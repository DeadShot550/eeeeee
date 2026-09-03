import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface Props {
  density?: 'full' | 'light';
}

export default function FloatingObjects({ density = 'full' }: Props) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2);
      my.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mx, my]);

  const l1x = useTransform(sx, (v) => v * -18);
  const l1y = useTransform(sy, (v) => v * -18);
  const l2x = useTransform(sx, (v) => v * 30);
  const l2y = useTransform(sy, (v) => v * 30);
  const l3x = useTransform(sx, (v) => v * -45);
  const l3y = useTransform(sy, (v) => v * -45);

  const stars = Array.from({ length: density === 'full' ? 18 : 8 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    top: `${(i * 53 + 11) % 100}%`,
    delay: `${(i % 6) * 0.7}s`,
    size: 2 + (i % 3),
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Layer 1 — soft glowing orbs */}
      <motion.div style={{ x: l1x, y: l1y }} className="absolute inset-0">
        <div className="absolute -top-32 -right-24 w-[36rem] h-[36rem] rounded-full bg-[radial-gradient(circle,rgba(201,169,97,0.22),transparent_60%)] blur-2xl animate-float-slow" />
        <div className="absolute top-1/2 -left-40 w-[28rem] h-[28rem] rounded-full bg-[radial-gradient(circle,rgba(34,51,87,0.9),transparent_65%)] blur-2xl animate-float" style={{ animationDelay: '-4s' }} />
        {density === 'full' && (
          <div className="absolute bottom-0 right-1/3 w-[22rem] h-[22rem] rounded-full bg-[radial-gradient(circle,rgba(201,169,97,0.12),transparent_60%)] blur-2xl animate-float-slow" style={{ animationDelay: '-7s' }} />
        )}
      </motion.div>

      {/* Layer 2 — rotating rings */}
      <motion.div style={{ x: l2x, y: l2y }} className="absolute inset-0">
        <svg className="absolute -top-28 -right-28 w-[34rem] h-[34rem] animate-spin-slow opacity-60" viewBox="0 0 400 400" fill="none">
          <circle cx="200" cy="200" r="190" stroke="rgba(201,169,97,0.35)" strokeWidth="1" strokeDasharray="6 14" />
          <circle cx="200" cy="200" r="150" stroke="rgba(201,169,97,0.2)" strokeWidth="1" />
          <circle cx="200" cy="10" r="4" fill="#c9a961" />
          <circle cx="350" cy="200" r="2.5" fill="#e8d4a0" />
        </svg>
        <svg className="absolute top-1/3 -left-20 w-72 h-72 animate-spin-reverse opacity-50" viewBox="0 0 300 300" fill="none">
          <circle cx="150" cy="150" r="140" stroke="rgba(201,169,97,0.3)" strokeWidth="1" strokeDasharray="2 10" />
          <rect x="100" y="100" width="100" height="100" stroke="rgba(201,169,97,0.25)" strokeWidth="1" transform="rotate(45 150 150)" />
        </svg>
        {density === 'full' && (
          <svg className="absolute bottom-10 right-[18%] w-40 h-40 animate-spin-slow opacity-40" viewBox="0 0 200 200" fill="none">
            <polygon points="100,10 190,100 100,190 10,100" stroke="rgba(201,169,97,0.4)" strokeWidth="1" />
            <polygon points="100,40 160,100 100,160 40,100" stroke="rgba(201,169,97,0.25)" strokeWidth="1" />
          </svg>
        )}
      </motion.div>

      {/* Layer 3 — drifting diamonds & twinkling stars */}
      <motion.div style={{ x: l3x, y: l3y }} className="absolute inset-0">
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-gold-light animate-twinkle"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay, boxShadow: '0 0 8px rgba(232,212,160,0.8)' }}
          />
        ))}
        <motion.div
          className="absolute top-[22%] left-[12%] w-3 h-3 border border-gold/70 rotate-45"
          animate={{ y: [0, -30, 0], rotate: [45, 225, 405] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[68%] left-[58%] w-2 h-2 bg-gold/80 rotate-45"
          animate={{ y: [0, 24, 0], x: [0, 12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute top-[14%] left-[64%] w-5 h-5 border border-gold/50 rounded-full"
          animate={{ y: [0, 18, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-[80%] left-[20%] w-16 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
          animate={{ x: [0, 40, 0], opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}
