/**
 * DemoAuthContext.jsx — Demo authentication context.
 * Uses in-memory state with mock demo users.
 * On login/register, triggers wallet initialization via WalletContext.
 * 
 * DEMO SYSTEM — simulated money only.
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { DEMO_USERS } from '../data/mockData';

const DemoAuthContext = createContext(null);

export function DemoAuthProvider({ children, onLogin, onLogout }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState(null);

  // Simulate login with demo accounts
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    await new Promise(r => setTimeout(r, 600));

    const user = DEMO_USERS.find(u => u.email === email);
    if (!user) {
      setError('No account found with this email address.');
      setIsLoading(false);
      return { success: false };
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsLoading(false);
      return { success: false };
    }

    setCurrentUser(user);
    setIsLoading(false);
    onLogin?.(user);
    return { success: true, user };
  }, [onLogin]);

  // Quick demo login
  const quickLogin = useCallback(async (userId) => {
    setIsLoading(true);
    setError(null);
    await new Promise(r => setTimeout(r, 300));

    const user = DEMO_USERS.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      onLogin?.(user);
    }
    setIsLoading(false);
    return { success: !!user, user };
  }, [onLogin]);

  // Simulate registration — creates a new demo user
  const register = useCallback(async ({ name, email, phone, password }) => {
    setIsLoading(true);
    setError(null);
    await new Promise(r => setTimeout(r, 800));

    const exists = DEMO_USERS.find(u => u.email === email);
    if (exists) {
      setError('An account with this email already exists.');
      setIsLoading(false);
      return { success: false };
    }

    const newUser = {
      id: `user-new-${Date.now()}`,
      name,
      email,
      phone,
      avatar: name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      avatarColor: '#4F46E5',
      role: 'user',
      wallet: {
        id: `wallet-new-${Date.now()}`,
        availableBalance: 1000.00,
        offlineLimit: 0,
        offlineSpent: 0,
        offlineRemaining: 0,
        currency: 'NPR',
        totalReceived: 1000.00,
        totalSent: 0,
      },
      device: null,
      createdAt: new Date().toISOString(),
    };

    setCurrentUser(newUser);
    setIsLoading(false);
    onLogin?.(newUser);
    return { success: true, user: newUser };
  }, [onLogin]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setError(null);
    onLogout?.();
  }, [onLogout]);

  const clearError = useCallback(() => setError(null), []);

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <DemoAuthContext.Provider value={{
      currentUser,
      isAuthenticated,
      isAdmin,
      isLoading,
      error,
      login,
      quickLogin,
      register,
      logout,
      clearError,
    }}>
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(DemoAuthContext);
  if (!ctx) throw new Error('useAuth must be used within a DemoAuthProvider');
  return ctx;
}

export default DemoAuthContext;
