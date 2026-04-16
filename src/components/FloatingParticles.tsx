import { motion } from "framer-motion";

const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: Math.random() * 4 + 2,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 8 + 12,
  delay: Math.random() * 5,
}));

const FloatingParticles = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {particles.map((p) => (
      <motion.div
        key={p.id}
        className="absolute rounded-full"
        style={{
          width: p.size,
          height: p.size,
          left: `${p.x}%`,
          top: `${p.y}%`,
          background: p.id % 3 === 0
            ? "hsl(185 100% 50% / 0.3)"
            : p.id % 3 === 1
            ? "hsl(260 80% 65% / 0.25)"
            : "hsl(300 70% 55% / 0.2)",
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, 15, -15, 0],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: p.duration,
          repeat: Infinity,
          delay: p.delay,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

export default FloatingParticles;
