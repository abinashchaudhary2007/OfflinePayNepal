/**
 * qrImageDecoder.js — High-performance multi-engine QR decoder for images & screenshots.
 * 
 * Why this is needed:
 * Standard ZXing (used by html5-qrcode) often fails on mobile screenshots (e.g. 720x1600 or 1080x2400)
 * because the QR code sits inside a dark/light-themed UI with surrounding text, status bars, and borders,
 * causing single-pass histogram binarizers to fail with "No MultiFormat Readers were able to detect the code".
 * 
 * Multi-Engine Pipeline:
 * 1. Native browser BarcodeDetector API (fastest, ML-accelerated in Chromium/Safari).
 * 2. jsQR on full resolution canvas (direct, adaptive binarization, fixed binarization).
 * 3. jsQR on downscaled canvas (resolves ultra-high resolution mobile screenshots).
 * 4. jsQR on multi-scale region crops (25% to 90% scale at 15%-50% Y-offsets targeting phone screenshot QRs).
 * 5. Html5Qrcode scanFile fallback (ZXing engine).
 */

import jsQR from 'jsqr';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Load image from File, Blob, or URL into an HTMLImageElement
 */
function loadImage(fileOrUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl = null;
    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image: ' + (err?.message || 'Invalid format')));
    };

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      objectUrl = URL.createObjectURL(fileOrUrl);
      img.src = objectUrl;
    }
  });
}

/**
 * Scan an image file or URL for a QR code using our multi-engine strategy.
 * 
 * @param {File | Blob | string} imageSource - The image to scan
 * @returns {Promise<string>} The decoded QR string
 */
export async function decodeQRFromImage(imageSource) {
  let img = null;
  try {
    img = await loadImage(imageSource);
  } catch (err) {
    throw new Error('Could not open image file: ' + err.message);
  }

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (!width || !height) {
    throw new Error('Image has invalid dimensions.');
  }

  // ─── ENGINE 1: Native BarcodeDetector API (Hardware/ML Accelerated) ───
  if (typeof globalThis !== 'undefined' && 'BarcodeDetector' in globalThis) {
    try {
      const barcodeDetector = new globalThis.BarcodeDetector({ formats: ['qr_code'] });
      const barcodes = await barcodeDetector.detect(img);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue;
      }
    } catch (nativeErr) {
      console.info('[qrImageDecoder] Native BarcodeDetector check:', nativeErr.message);
    }
  }

  // Helper to scan a 2D canvas context with jsQR (normal + adaptive binarization + fixed threshold)
  const scanCanvasData = (ctx, w, h) => {
    try {
      const imgData = ctx.getImageData(0, 0, w, h);
      
      // 1. Direct scan
      let code = jsQR(imgData.data, w, h, { inversionAttempts: 'attemptBoth' });
      if (code && code.data) return code.data;

      // 2. Adaptive threshold scan (Mean luminance)
      const data = imgData.data;
      let sum = 0;
      const totalPixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgLum = sum / totalPixels;

      const binData = new Uint8ClampedArray(data);
      for (let i = 0; i < binData.length; i += 4) {
        const lum = 0.299 * binData[i] + 0.587 * binData[i + 1] + 0.114 * binData[i + 2];
        const val = lum > avgLum ? 255 : 0;
        binData[i] = val;
        binData[i + 1] = val;
        binData[i + 2] = val;
      }
      code = jsQR(binData, w, h, { inversionAttempts: 'attemptBoth' });
      if (code && code.data) return code.data;

      // 3. Fixed high-contrast threshold scan (128 threshold)
      for (let i = 0; i < binData.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const val = lum > 128 ? 255 : 0;
        binData[i] = val;
        binData[i + 1] = val;
        binData[i + 2] = val;
      }
      code = jsQR(binData, w, h, { inversionAttempts: 'attemptBoth' });
      if (code && code.data) return code.data;
    } catch (_) {}
    return null;
  };

  // ─── ENGINE 2: Full Resolution Canvas ───
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    ctx.drawImage(img, 0, 0, width, height);
    const result = scanCanvasData(ctx, width, height);
    if (result) return result;
  }

  // ─── ENGINE 3: Downscaled Canvas (Target high-resolution screenshots like 1080x2400) ───
  const maxDim = Math.max(width, height);
  if (maxDim > 800) {
    const scaleFactor = 800 / maxDim;
    const scaledW = Math.round(width * scaleFactor);
    const scaledH = Math.round(height * scaleFactor);
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = scaledW;
    scaledCanvas.height = scaledH;
    const scaledCtx = scaledCanvas.getContext('2d', { willReadFrequently: true });
    if (scaledCtx) {
      scaledCtx.drawImage(img, 0, 0, scaledW, scaledH);
      const result = scanCanvasData(scaledCtx, scaledW, scaledH);
      if (result) return result;
    }
  }

  // ─── ENGINE 4: Multi-Scale Region Cropping (Mobile Screenshot Specialist) ───
  // Phone screenshots place QR codes in center or upper-center at various scale factors
  const minDim = Math.min(width, height);
  const cropScales = [0.90, 0.75, 0.60, 0.45, 0.35, 0.25];
  const yPercentages = [0.15, 0.25, 0.35, 0.45, 0.50];

  for (const scale of cropScales) {
    const cropSize = Math.round(minDim * scale);
    if (cropSize < 50) continue;
    const startX = Math.round((width - cropSize) / 2);

    const yOffsets = [
      Math.round((height - cropSize) / 2), // Center
      ...yPercentages.map(p => Math.max(0, Math.round(height * p))),
    ];

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropSize;
    cropCanvas.height = cropSize;
    const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });
    if (!cropCtx) continue;

    for (const startY of yOffsets) {
      if (startY + cropSize > height) continue;

      cropCtx.clearRect(0, 0, cropSize, cropSize);
      cropCtx.drawImage(img, startX, startY, cropSize, cropSize, 0, 0, cropSize, cropSize);

      const result = scanCanvasData(cropCtx, cropSize, cropSize);
      if (result) return result;
    }
  }

  // ─── ENGINE 5: Html5Qrcode.scanFile (ZXing engine fallback) ───
  if (typeof imageSource !== 'string' && typeof document !== 'undefined') {
    try {
      const tempId = `temp-qr-scan-${Date.now()}`;
      const tempDiv = document.createElement('div');
      tempDiv.id = tempId;
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);

      const html5Qr = new Html5Qrcode(tempId);
      const zxingResult = await html5Qr.scanFile(imageSource, false);
      html5Qr.clear().catch(() => {});
      tempDiv.remove();

      if (zxingResult) {
        return zxingResult;
      }
    } catch (_) {}
  }

  throw new Error('No QR code could be detected in this image. Please ensure the QR code is clearly visible and not blurry.');
}
