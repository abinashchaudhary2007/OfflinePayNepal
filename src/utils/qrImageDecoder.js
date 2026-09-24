/**
 * qrImageDecoder.js — High-performance multi-engine QR decoder for images & screenshots.
 * 
 * Why this is needed:
 * Standard ZXing (used by html5-qrcode) often fails on mobile screenshots (e.g. 720x1600)
 * because the QR code sits inside a dark-themed UI with text, borders, and high module density,
 * causing single-pass histogram binarizers to fail with "No MultiFormat Readers were able to detect the code".
 * 
 * Multi-Engine Pipeline:
 * 1. Native browser BarcodeDetector API (fastest, ML-accelerated in Chromium/Safari).
 * 2. jsQR on full resolution canvas (handles uncropped raw photos).
 * 3. jsQR on center / upper-center crops (targets QR codes inside mobile screenshots).
 * 4. jsQR with high-contrast luminance thresholding (resolves high-density cryptographic QRs).
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
      // Native detector either unsupported on this format or missed, fallback to jsQR
      console.info('[qrImageDecoder] Native BarcodeDetector check:', nativeErr.message);
    }
  }

  // Prepare primary canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context.');
  }
  ctx.drawImage(img, 0, 0, width, height);

  // ─── ENGINE 2: jsQR on full image ───
  try {
    const fullImageData = ctx.getImageData(0, 0, width, height);
    const code = jsQR(fullImageData.data, width, height, {
      inversionAttempts: 'attemptBoth',
    });
    if (code && code.data) {
      return code.data;
    }
  } catch (e) {
    console.warn('[qrImageDecoder] jsQR full-image attempt exception:', e.message);
  }

  // ─── ENGINE 3: jsQR on screenshot regions (Center & Upper-Center crops) ───
  // Phone screenshots (e.g. 720x1600 or 1080x2400) place the QR code in the center or upper half
  const minDim = Math.min(width, height);
  const cropScales = [0.85, 0.70, 0.55]; // Test 85%, 70%, and 55% crop windows

  for (const scale of cropScales) {
    const cropSize = Math.round(minDim * scale);
    const startX = Math.round((width - cropSize) / 2);

    // Test both vertical center and vertical upper-center (y = 20% to 30%)
    const yOffsets = [
      Math.round((height - cropSize) / 2),           // Center
      Math.max(0, Math.round(height * 0.20)),        // Upper-center
      Math.max(0, Math.round(height * 0.30)),        // Mid-upper
    ];

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropSize;
    cropCanvas.height = cropSize;
    const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });

    for (const startY of yOffsets) {
      if (startY + cropSize > height) continue;

      cropCtx.clearRect(0, 0, cropSize, cropSize);
      cropCtx.drawImage(img, startX, startY, cropSize, cropSize, 0, 0, cropSize, cropSize);
      const cropData = cropCtx.getImageData(0, 0, cropSize, cropSize);

      // Normal scan
      let code = jsQR(cropData.data, cropSize, cropSize, {
        inversionAttempts: 'attemptBoth',
      });
      if (code && code.data) {
        return code.data;
      }

      // ─── ENGINE 4: High-contrast binarization on cropped region ───
      // Eliminates dark UI theme artifacts around finder patterns
      const d = cropData.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const binary = gray > 135 ? 255 : 0;
        d[i] = binary;
        d[i + 1] = binary;
        d[i + 2] = binary;
      }
      code = jsQR(cropData.data, cropSize, cropSize, {
        inversionAttempts: 'attemptBoth',
      });
      if (code && code.data) {
        return code.data;
      }
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
    } catch (zxingErr) {
      // Both ZXing and jsQR failed
    }
  }

  throw new Error('No QR code could be detected in this image. Please ensure the QR code is clearly visible and not blurry.');
}
