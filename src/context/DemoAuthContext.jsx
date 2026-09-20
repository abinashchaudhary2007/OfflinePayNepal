/**
 * DemoAuthContext.jsx — Demo authentication context.
 * Uses in-memory state with mock demo users.
 * On login/register, triggers wallet initialization via WalletContext.
 * 
 * DEMO SYSTEM — simulated money only.
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DEMO_USERS } from '../data/mockData';
import { getUserByEmail, getUser, saveUser, saveWallet, initSeedData } from '../services/db';

const DemoAuthContext = createContext(null);

export function DemoAuthProvider({ children, onLogin, onLogout }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState(null);

  // Initialize seed users on provider mount
  useEffect(() => {
    initSeedData().catch(console.error);
  }, []);

  // Login with persistent store + demo accounts fallback
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    await new Promise(r => setTimeout(r, 400));

    // Look up in persistent IndexedDB users first
    let user = null;
    try {
      user = await getUserByEmail(email);
    } catch (err) {
      console.warn('[auth] Error checking DB for user:', err);
    }

    // Fallback to static mock data
    if (!user) {
      user = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

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
    await new Promise(r => setTimeout(r, 200));

    let user = null;
    try {
      user = await getUser(userId);
    } catch (err) {
      console.warn('[auth] Error fetching quick user from DB:', err);
    }

    if (!user) {
      user = DEMO_USERS.find(u => u.id === userId);
    }

    if (user) {
      setCurrentUser(user);
      onLogin?.(user);
    }
    setIsLoading(false);
    return { success: !!user, user };
  }, [onLogin]);

  // Register — creates and persists a new user with initial wallet
  const register = useCallback(async ({ name, email, phone, password }) => {
    setIsLoading(true);
    setError(null);
    await new Promise(r => setTimeout(r, 500));

    // Duplicate check in DB and mock data
    let existsInDb = false;
    try {
      existsInDb = !!(await getUserByEmail(email));
    } catch {
      existsInDb = false;
    }
    const existsInMock = DEMO_USERS.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (existsInDb || existsInMock) {
      setError('An account with this email already exists.');
      setIsLoading(false);
      return { success: false };
    }

    const timestamp = Date.now();
    const newUserId = `user-reg-${timestamp}`;
    const newWalletId = `wallet-reg-${timestamp}`;

    const newWallet = {
      id: newWalletId,
      userId: newUserId,
      availableBalance: 1000.00,
      offlineLimit: 0,
      offlineSpent: 0,
      offlineRemaining: 0,
      currency: 'NPR',
      totalReceived: 1000.00,
      totalSent: 0,
      updatedAt: new Date().toISOString(),
    };

    const newUser = {
      id: newUserId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      avatar: name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U',
      avatarColor: '#4F46E5',
      role: 'user',
      wallet: newWallet,
      device: null,
      createdAt: new Date().toISOString(),
    };

    // Persist user and wallet to IndexedDB
    try {
      await saveUser(newUser);
      await saveWallet(newWallet);
    } catch (err) {
      console.error('[auth] Failed to persist new user to IndexedDB:', err);
    }

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
