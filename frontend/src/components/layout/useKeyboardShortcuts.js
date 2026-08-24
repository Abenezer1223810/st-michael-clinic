import { useEffect, useRef } from 'react';

const ROUTES = {
  d: '/dashboard',
  p: '/patients',
  n: '/patients/new',
  v: '/visits',
  q: '/queue',
  o: '/opd',
  l: '/laboratory',
  c: '/procedures',
  r: '/reports',
  a: '/admin',
};

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable ||
    target.closest('[contenteditable="true"]') !== null
  );
}

export function useKeyboardShortcuts({ onShortcuts, onTheme, onContrast, onNavigate }) {
  const handlersRef = useRef({ onShortcuts, onTheme, onContrast, onNavigate });
  handlersRef.current = { onShortcuts, onTheme, onContrast, onNavigate };

  useEffect(() => {
    let pending = null;
    let clearTimer = null;

    const clearPending = () => {
      pending = null;
      if (clearTimer) window.clearTimeout(clearTimer);
      clearTimer = null;
    };

    const handleKeyDown = (e) => {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();

      if (key === '?') {
        e.preventDefault();
        handlersRef.current.onShortcuts?.();
        return;
      }
      if (key === 't') {
        e.preventDefault();
        handlersRef.current.onTheme?.();
        return;
      }
      if (key === 'h') {
        e.preventDefault();
        handlersRef.current.onContrast?.();
        return;
      }

      if (key === 'g' && !pending) {
        pending = 'g';
        clearTimer = window.setTimeout(clearPending, 800);
        return;
      }
      if (pending === 'g') {
        e.preventDefault();
        clearPending();
        const to = ROUTES[key];
        if (to) handlersRef.current.onNavigate?.(to);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearPending();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
