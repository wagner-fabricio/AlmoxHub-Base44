import { useEffect, useRef, useState } from 'react';

export default function useIdleTimer(options = {}) {
  const {
    timeout = 15 * 60 * 1000, // 15 minutes default
    warningTime = 2 * 60 * 1000, // 2 minutes warning
    onIdle,
    onWarning,
    events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  } = options;

  const [isIdle, setIsIdle] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(warningTime);
  
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownRef = useRef(null);

  const resetTimer = () => {
    setIsIdle(false);
    setShowWarning(false);
    setRemainingTime(warningTime);

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Save last activity
    localStorage.setItem('last_activity', Date.now().toString());

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingTime(warningTime);
      if (onWarning) onWarning();

      // Start countdown
      const startTime = Date.now();
      countdownRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, warningTime - elapsed);
        setRemainingTime(remaining);

        if (remaining === 0) {
          clearInterval(countdownRef.current);
        }
      }, 1000);
    }, timeout - warningTime);

    // Set idle timer
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      setShowWarning(false);
      if (onIdle) onIdle();
    }, timeout);
  };

  useEffect(() => {
    // Não inicializar timer durante autenticação (evita logout automático durante SSO)
    if (window.location.pathname.includes('auth') || window.location.search.includes('code=')) {
      return;
    }

    // Check last activity on mount - reseta o contador ao invés de fazer logout
    const lastActivity = localStorage.getItem('last_activity');
    if (lastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
      if (timeSinceLastActivity >= timeout) {
        // Limpar last_activity e resetar timer (não fazer logout automático)
        localStorage.removeItem('last_activity');
      }
    }

    // Setup event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [timeout, warningTime]);

  return {
    isIdle,
    showWarning,
    remainingTime,
    resetTimer
  };
}