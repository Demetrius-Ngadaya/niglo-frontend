'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// A subtle lift-on-hover wrapper for cards across the site (service cards,
// portfolio tiles, gallery albums, etc) — combined with each card's own
// existing image zoom, this gives every grid a bit of life without needing
// to touch each card's internal markup.
export default function HoverCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
