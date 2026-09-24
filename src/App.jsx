import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useCallback, useEffect } from 'react';
import { DemoAuthProvider, useAuth } from './context/DemoAuthContext';
import { WalletProvider, useWallet } from './context/WalletContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Landing           from './pages/Landing';
import Login             from './pages/Login';
import Register          from './pages/Register';
import Dashboard         from './pages/Dashboard';
import SendMoney         from './pages/SendMoney';
import ReceiveMoney      from './pages/ReceiveMoney';
import OfflinePayment    from './pages/OfflinePayment';
import Transactions      from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import Security          from './pages/Security';
import Profile           from './pages/Profile';
import AdminDashboard    from './pages/AdminDashboard';
import CybersecurityDemo from './pages/CybersecurityDemo';
import OfflineAuthorization from './pages/OfflineAuthorization';
import DeviceManagement  from './pages/DeviceManagement';
import QRScanner         from './pages/QRScanner';

/** Protected route — redirects to /login if not authenticated */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/** Public-only route — redirects authenticated users to /dashboard */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

/** Admin-only route — redirects non-admins to /dashboard */
function AdminRoute({ children }) {
  const { currentUser, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

/**
 * AppCore — the inner app shell that bridges auth state → wallet init.
 * Must be a child of both DemoAuthProvider and WalletProvider.
 */
function AppCore() {
  const { currentUser, isAuthenticated } = useAuth();
  const { initWallet, resetWallet } = useWallet();

  // Guarantees wallet is initialized whenever user session is active (including page refresh)
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      initWallet(currentUser);
    } else if (!isAuthenticated) {
      resetWallet();
    }
  }, [isAuthenticated, currentUser?.id, initWallet, resetWallet]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/"        element={<Landing />} />
      <Route path="/login"   element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

      {/* Protected dashboard routes */}
      <Route path="/dashboard"         element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/wallet"            element={<Navigate to="/dashboard" replace />} />
      <Route path="/send"              element={<ProtectedRoute><SendMoney /></ProtectedRoute>} />
      <Route path="/receive"           element={<ProtectedRoute><ReceiveMoney /></ProtectedRoute>} />
      <Route path="/offline"           element={<ProtectedRoute><OfflinePayment /></ProtectedRoute>} />
      <Route path="/offline-authorization" element={<ProtectedRoute><OfflineAuthorization /></ProtectedRoute>} />
      <Route path="/transactions"      element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/transactions/:id"  element={<ProtectedRoute><TransactionDetail /></ProtectedRoute>} />
      <Route path="/security"          element={<ProtectedRoute><Security /></ProtectedRoute>} />
      <Route path="/settings"          element={<ProtectedRoute><Security /></ProtectedRoute>} />
      <Route path="/devices"           element={<ProtectedRoute><DeviceManagement /></ProtectedRoute>} />
      <Route path="/profile"           element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/admin"             element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/cybersecurity-demo" element={<ProtectedRoute><CybersecurityDemo /></ProtectedRoute>} />
      <Route path="/scan"              element={<ProtectedRoute><QRScanner /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * AppWithWallet — wraps AppCore so that WalletProvider has auth context available
 * via the callbacks passed up to DemoAuthProvider.
 */
function AppWithProviders() {
  // We use a ref-based approach: DemoAuthProvider calls onLogin,
  // which is bridged to WalletProvider.initWallet via a shared callback ref.
  // This avoids circular context dependencies.
  return (
    <WalletProvider>
      <WalletBridge />
    </WalletProvider>
  );
}

/** WalletBridge — reads auth state to initialize wallet after login */
function WalletBridge() {
  const { initWallet, resetWallet } = useWallet();
  return (
    <DemoAuthProvider
      onLogin={(user) => initWallet(user)}
      onLogout={() => resetWallet()}
    >
      <AppCore />
    </DemoAuthProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppWithProviders />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
