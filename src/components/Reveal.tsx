'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// A single, reusable scroll-reveal wrapper used across the whole public site
// — fades and slides content up into place the first time it scrolls into
// view (never repeats on re-scroll, so it doesn't feel gimmicky on a long
// page). `delay` lets a grid of cards stagger in one after another instead
// of all popping in at once.
export default function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
