import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

export default function TouchGestures({ 
  children, 
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  disabled = false 
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5]);
  const longPressTimer = useRef(null);

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
  };

  const handleTouchStart = () => {
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
      }, 500);
    }
  };

  const handleTouchEnd = () => {
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
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ x, opacity }}
      className="touch-pan-x cursor-grab active:cursor-grabbing"
    >
      {children}
    </motion.div>
  );
}