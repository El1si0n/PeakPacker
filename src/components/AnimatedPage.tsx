import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function AnimatedPage({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <motion.div
      initial={isMobile ? { opacity: 0, x: 30 } : { opacity: 0 }}
      animate={{ opacity: 1, x: 0 }}
      exit={isMobile ? { opacity: 0, x: -30 } : { opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
