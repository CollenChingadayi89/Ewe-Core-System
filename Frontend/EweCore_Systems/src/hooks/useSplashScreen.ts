import { useState, useEffect } from 'react';

const SPLASH_DURATION = 6000; // 6 seconds

export function useSplashScreen() {
  // Always show splash on initial load
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Auto-hide after animation completes
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  return showSplash;
}
