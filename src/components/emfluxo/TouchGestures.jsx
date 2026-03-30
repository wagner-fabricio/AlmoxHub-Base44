import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

// Seletor CSS para elementos que não devem disparar o onTap do card
const IGNORE_TAP_SELECTOR = 'button, a, [data-no-tap]';

export default function TouchGestures({ 
  children, 
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  onTap,
  disabled = false 
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5]);
  const longPressTimer = useRef(null);
  const isDragging = useRef(false);

  const handleDragStart = () => { isDragging.current = true; };

  const handleDragEnd = (event, info) => {
    const threshold = 100;
    
    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
      if (navigator.vibrate) navigator.vibrate(50);
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
      if (navigator.vibrate) navigator.vibrate(50);
    }
    
    x.set(0);
    // Reset dragging after a small delay to prevent tap firing after drag
    setTimeout(() => { isDragging.current = false; }, 50);
  };

  const handleTouchStart = (e) => {
    isDragging.current = false;
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
      }, 500);
    }
  };

  const handleTouchEnd = (e) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isDragging.current) return;

    // Se o toque foi em um botão/link, não aciona o onTap do card
    if (onTap && e.target.closest(IGNORE_TAP_SELECTOR)) return;
    if (onTap) onTap();
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      style={{ x, opacity }}
      className="touch-pan-x cursor-grab active:cursor-grabbing"
    >
      {children}
    </motion.div>
  );
}