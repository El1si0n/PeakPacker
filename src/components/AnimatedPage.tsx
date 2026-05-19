import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function AnimatedPage({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const direction = location.state?.direction;
  const initialX = direction === 'left' ? 30 : direction === 'right' ? -30 : 0;
  const exitX = direction === 'left' ? -30 : direction === 'right' ? 30 : 0;

  return (
    <motion.div
      initial={isMobile ? { opacity: 0, x: initialX } : { opacity: 0 }}
      animate={{ opacity: 1, x: 0 }}
      exit={isMobile ? { opacity: 0, x: exitX } : { opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
