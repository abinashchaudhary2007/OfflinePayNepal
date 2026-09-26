/**
 * DemoAuthContext.jsx — Real Supabase Authentication + Offline Session Management.
 * Supports online Supabase email/password auth and seamless offline authentication
 * via IndexedDB credential caching and persistent sessions.
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getUserByEmail, getUser, saveUser, saveWallet, getWalletByUserId } from '../services/db';

const DemoAuthContext = createContext(null);

const ACTIVE_USER_STORAGE_KEY = 'offlinepay_active_user_id';

/**
 * Hash password locally with SHA-256 for secure offline credential validation
 */
async function hashPassword(password) {
  if (!password) return '';
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function DemoAuthProvider({ children, onLogin, onLogout }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState(null);

  // ─── Initialize session from Supabase or local offline storage ───
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        // 1. Try Supabase Auth session if online
        if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            const sbUser = session.user;
            let localUser = await getUser(sbUser.id);
            if (!localUser) {
              // Fetch profile from Supabase
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sbUser.id)
                .single();

              const userName = profile?.full_name || sbUser.user_metadata?.full_name || sbUser.email.split('@')[0];
              localUser = {
                id: sbUser.id,
                name: userName,
                email: sbUser.email,
                phone: profile?.phone_number || sbUser.user_metadata?.phone || '',
                role: profile?.role || 'user',
                avatar: userName.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U',
                avatarColor: '#4F46E5',
                createdAt: profile?.created_at || new Date().toISOString(),
              };
              await saveUser(localUser);
            }

            // Ensure wallet is initialized
            let wallet = await getWalletByUserId(localUser.id);
            if (!wallet) {
              wallet = {
                id: `wallet-${localUser.id}`,
                userId: localUser.id,
                availableBalance: 1000.00,
                offlineLimit: 0,
                offlineSpent: 0,
                offlineRemaining: 0,
                currency: 'NPR',
                totalReceived: 1000.00,
                totalSent: 0,
                updatedAt: new Date().toISOString(),
              };
              await saveWallet(wallet);
            }
            localUser.wallet = wallet;

            setCurrentUser(localUser);
            localStorage.setItem(ACTIVE_USER_STORAGE_KEY, localUser.id);
            setIsLoading(false);
            onLogin?.(localUser);
            return;
          }
        }

        // 2. Fallback: Restore active session from IndexedDB when offline
        const savedUserId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
        if (savedUserId && isMounted) {
          const localUser = await getUser(savedUserId);
          if (localUser) {
            let wallet = await getWalletByUserId(localUser.id);
            if (!wallet) {
              wallet = {
                id: `wallet-${localUser.id}`,
                userId: localUser.id,
                availableBalance: 1000.00,
                offlineLimit: 0,
                offlineSpent: 0,
                offlineRemaining: 0,
                currency: 'NPR',
                totalReceived: 1000.00,
                totalSent: 0,
                updatedAt: new Date().toISOString(),
              };
              await saveWallet(wallet);
            }
            localUser.wallet = wallet;
            setCurrentUser(localUser);
            onLogin?.(localUser);
          }
        }
      } catch (err) {
        console.warn('[auth] Session initialization check:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    // Listen to Supabase auth events
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setCurrentUser(null);
            localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
          }
        }
      });
      return () => {
        isMounted = false;
        subscription?.unsubscribe();
      };
    }

    return () => { isMounted = false; };
  }, []);

  // ─── Login (Supabase + Offline fallback) ────────────────────────
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      setIsLoading(false);
      return { success: false };
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsLoading(false);
      return { success: false };
    }

    const hashedInput = await hashPassword(password);

    // Online path: Authenticate with Supabase
    if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!sbError && data?.user) {
          const sbUser = data.user;
          let user = await getUser(sbUser.id);

          if (!user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', sbUser.id)
              .single();

            const userName = profile?.full_name || sbUser.user_metadata?.full_name || cleanEmail.split('@')[0];
            user = {
              id: sbUser.id,
              name: userName,
              email: cleanEmail,
              phone: profile?.phone_number || sbUser.user_metadata?.phone || '',
              role: profile?.role || 'user',
              avatar: userName.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U',
              avatarColor: '#4F46E5',
              passwordHash: hashedInput,
              createdAt: profile?.created_at || new Date().toISOString(),
            };
            await saveUser(user);
          } else {
            // Update cached password hash for offline access
            user.passwordHash = hashedInput;
            await saveUser(user);
          }

          let wallet = await getWalletByUserId(user.id);
          if (!wallet) {
            wallet = {
              id: `wallet-${user.id}`,
              userId: user.id,
              availableBalance: 1000.00,
              offlineLimit: 0,
              offlineSpent: 0,
              offlineRemaining: 0,
              currency: 'NPR',
              totalReceived: 1000.00,
              totalSent: 0,
              updatedAt: new Date().toISOString(),
            };
            await saveWallet(wallet);
          }
          user.wallet = wallet;

          setCurrentUser(user);
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, user.id);
          setIsLoading(false);
          onLogin?.(user);
        } else if (sbError && sbError.message !== 'Failed to fetch') {
          // If Supabase rejected (e.g., email not confirmed or rate-limited), check local user cache
          const cachedUser = await getUserByEmail(cleanEmail);
          if (cachedUser && cachedUser.passwordHash === hashedInput) {
            let wallet = await getWalletByUserId(cachedUser.id);
            if (wallet) cachedUser.wallet = wallet;
            setCurrentUser(cachedUser);
            localStorage.setItem(ACTIVE_USER_STORAGE_KEY, cachedUser.id);
            setIsLoading(false);
            onLogin?.(cachedUser);
            return { success: true, user: cachedUser };
          }

          if (sbError.message.toLowerCase().includes('email not confirmed')) {
            setError('Email not confirmed. Please check your inbox for the verification link, or click below to resend it.');
          } else {
            setError(sbError.message || 'Invalid email or password.');
          }
          setIsLoading(false);
          return { success: false };
        }
      } catch (err) {
        console.warn('[auth] Supabase online login failed, trying offline cache:', err);
      }
    }

    // Offline / Local fallback: Authenticate from IndexedDB
    try {
      const localUser = await getUserByEmail(cleanEmail);
      if (!localUser) {
        setError('No account found with this email address.');
        setIsLoading(false);
        return { success: false };
      }

      // Check stored password hash
      if (localUser.passwordHash && localUser.passwordHash !== hashedInput) {
        setError('Incorrect password.');
        setIsLoading(false);
        return { success: false };
      }

      let wallet = await getWalletByUserId(localUser.id);
      if (!wallet) {
        wallet = {
          id: `wallet-${localUser.id}`,
          userId: localUser.id,
          availableBalance: 1000.00,
          offlineLimit: 0,
          offlineSpent: 0,
          offlineRemaining: 0,
          currency: 'NPR',
          totalReceived: 1000.00,
          totalSent: 0,
          updatedAt: new Date().toISOString(),
        };
        await saveWallet(wallet);
      }
      localUser.wallet = wallet;

      setCurrentUser(localUser);
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, localUser.id);
      setIsLoading(false);
      onLogin?.(localUser);
      return { success: true, user: localUser };
    } catch (err) {
      console.error('[auth] Offline login error:', err);
      setError('An error occurred during authentication.');
      setIsLoading(false);
      return { success: false };
    }
  }, [onLogin]);

  // ─── Register (Supabase + IndexedDB persistence) ───────────────
  const register = useCallback(async ({ name, email, phone, password }) => {
    setIsLoading(true);
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanEmail || !cleanPhone || !password) {
      setError('Please fill out all required fields.');
      setIsLoading(false);
      return { success: false };
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsLoading(false);
      return { success: false };
    }

    const hashedInput = await hashPassword(password);

    // 1. Duplicate check in local IndexedDB
    const existing = await getUserByEmail(cleanEmail);
    if (existing) {
      setError('An account with this email already exists. Please sign in instead.');
      setIsLoading(false);
      return { success: false };
    }

    // 2. Duplicate check in remote Supabase profiles if online
    if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (existingProfile) {
          setError('An account with this email already exists. Please sign in instead.');
          setIsLoading(false);
          return { success: false };
        }
      } catch (err) {
        console.warn('[auth] Remote profile duplicate check:', err);
      }
    }

    let assignedUserId = `user-${Date.now()}`;
    let requiresEmailConfirmation = false;

    // 3. Online registration via Supabase Auth
    if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { data, error: sbError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
              phone: cleanPhone,
            },
          },
        });

        if (sbError) {
          console.warn('[auth] Supabase register notice:', sbError.message);
          const msg = (sbError.message || '').toLowerCase();

          // Reject if email is already in use
          if (
            msg.includes('already registered') ||
            msg.includes('already exists') ||
            msg.includes('user already in use') ||
            msg.includes('email address is already') ||
            sbError.status === 422
          ) {
            setError('An account with this email already exists. Please sign in instead.');
            setIsLoading(false);
            return { success: false };
          }

          const isRateLimit = msg.includes('rate limit') || msg.includes('too many requests') || sbError.status === 429;
          if (!isRateLimit) {
            setError(sbError.message);
            setIsLoading(false);
            return { success: false };
          }
          // Proceed with prototype ID for email-rate-limited accounts
          console.info('[auth] Supabase email rate limit reached. Creating user profile directly.');
        }

        // Supabase identity enumeration protection: empty identities means email is already registered!
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setError('An account with this email already exists. Please sign in instead.');
          setIsLoading(false);
          return { success: false };
        }

        if (data?.user?.id) {
          assignedUserId = data.user.id;
        }

        if (data?.user && !data.session) {
          requiresEmailConfirmation = true;
        }
      } catch (err) {
        console.warn('[auth] Supabase register exception:', err);
      }
    }

    const newWallet = {
      id: `wallet-${assignedUserId}`,
      userId: assignedUserId,
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
      id: assignedUserId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      avatar: cleanName.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U',
      avatarColor: '#4F46E5',
      role: 'user',
      passwordHash: hashedInput,
      wallet: newWallet,
      device: null,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveUser(newUser);
      await saveWallet(newWallet);
    } catch (err) {
      console.error('[auth] Failed to persist new user to IndexedDB:', err);
    }

    setCurrentUser(newUser);
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, newUser.id);
    setIsLoading(false);
    onLogin?.(newUser);
    return { success: true, user: newUser, requiresEmailConfirmation };
  }, [onLogin]);

  // ─── Resend Confirmation Email ────────────────────────────────
  const resendConfirmationEmail = useCallback(async (email) => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase is not configured.' };
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });
      if (resendErr) throw resendErr;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to resend confirmation email.' };
    }
  }, []);

  // ─── Delete Account ───────────────────────────────────────────
  const deleteAccount = useCallback(async () => {
    if (!currentUser) return { success: false, error: 'No active user session' };
    setIsLoading(true);
    const userId = currentUser.id;

    try {
      // 1. Delete remote Supabase data if online
      if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const { deleteProfileAndWalletFromSupabase } = await import('../services/supabaseSync');
          await deleteProfileAndWalletFromSupabase(userId);
          await supabase.auth.signOut().catch(() => {});
        } catch (err) {
          console.warn('[auth] Error during Supabase account deletion:', err);
        }
      }

      // 2. Delete all local IndexedDB data
      const { deleteUserData } = await import('../services/db');
      await deleteUserData(userId);

      // 3. Clear session storage & state
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      setCurrentUser(null);
      setError(null);
      setIsLoading(false);
      onLogout?.();

      return { success: true };
    } catch (err) {
      console.error('[auth] Failed to delete account:', err);
      setIsLoading(false);
      return { success: false, error: err.message || 'Failed to delete account' };
    }
  }, [currentUser, onLogout]);

  // ─── Quick login for developer testing ─────────────────────────
  const quickLogin = useCallback(async (userId) => {
    setIsLoading(true);
    setError(null);

    let user = await getUser(userId);
    if (!user) {
      user = await getUserByEmail(userId);
    }

    if (user) {
      const wallet = await getWalletByUserId(user.id);
      if (wallet) user.wallet = wallet;
      setCurrentUser(user);
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, user.id);
      onLogin?.(user);
      setIsLoading(false);
      return { success: true, user };
    }

    setIsLoading(false);
    return { success: false };
  }, [onLogin]);

  // ─── Logout ───────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[auth] Error signing out of Supabase:', err);
      }
    }
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
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
      setCurrentUser,
      isAuthenticated,
      isAdmin,
      isLoading,
      error,
      login,
      quickLogin,
      register,
      logout,
      deleteAccount,
      resendConfirmationEmail,
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
