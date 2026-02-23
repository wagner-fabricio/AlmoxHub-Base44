import React from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

export default function TouchGestures({ 
  children, 
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  disabled = false 
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5]);

  const handleDragEnd = (event, info) => {
    const threshold = 100;
    
    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
      // Vibração curta
      if (navigator.vibrate) navigator.vibrate(50);
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
      // Vibração curta
      if (navigator.vibrate) navigator.vibrate(50);
    }
    
    x.set(0);
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
      // Vibração dupla
      if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
    }
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
      onTapStart={(e, info) => {
        const timeout = setTimeout(handleLongPress, 500);
        const cleanup = () => clearTimeout(timeout);
        window.addEventListener('touchend', cleanup, { once: true });
        window.addEventListener('touchmove', cleanup, { once: true });
      }}
      style={{ x, opacity }}
      className="touch-pan-x cursor-grab active:cursor-grabbing"
    >
      {children}
    </motion.div>
  );
}