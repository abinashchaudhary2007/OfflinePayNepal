import { useState, useCallback, useEffect } from 'react';

/**
 * useOfflineSimulation — simulates offline mode for demo purposes.
 *
 * - Reads real navigator.onLine state
 * - Allows manually toggling a "simulated offline" mode
 * - Useful for demonstrating offline payment flow even with internet
 */
export function useOfflineSimulation() {
  const [isReallyOnline, setIsReallyOnline] = useState(navigator.onLine);
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);

  // Track real connectivity changes
  useEffect(() => {
    const handleOnline  = () => setIsReallyOnline(true);
    const handleOffline = () => setIsReallyOnline(false);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Derived state: are we effectively offline?
  const isOffline = !isReallyOnline || isSimulatingOffline;
  const isOnline  = !isOffline;

  // Toggle simulation
  const enableOfflineSimulation  = useCallback(() => setIsSimulatingOffline(true), []);
  const disableOfflineSimulation = useCallback(() => setIsSimulatingOffline(false), []);
  const toggleOfflineSimulation  = useCallback(() => setIsSimulatingOffline(prev => !prev), []);

  // Status label for UI
  const statusLabel = isSimulatingOffline
    ? 'Offline Simulation'
    : isReallyOnline
      ? 'Online'
      : 'Offline';

  const statusType = isOffline ? 'offline' : 'online';

  return {
    isOffline,
    isOnline,
    isReallyOnline,
    isSimulatingOffline,
    statusLabel,
    statusType,
    enableOfflineSimulation,
    disableOfflineSimulation,
    toggleOfflineSimulation,
  };
}

export default useOfflineSimulation;
