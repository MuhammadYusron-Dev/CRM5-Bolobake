"use client";
import { useRef, useState, useEffect } from "react";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";

interface FloatingPastryProps {
  src: string;
  size: number;
  speed: number;
  rotationSpeed: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function FloatingPastry({ src, size, speed, rotationSpeed, containerRef }: FloatingPastryProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);

  const velocityX = useRef(speed * (Math.random() > 0.5 ? 1 : -1));
  const velocityY = useRef(speed * (Math.random() > 0.5 ? 1 : -1));
  const isDragging = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // randomize start slightly so they don't look identical if window size changes
    if (typeof window !== "undefined" && containerRef.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        x.set(Math.random() * (bounds.width - size));
        y.set(Math.random() * (bounds.height - size));
    }
    setMounted(true);
  }, [containerRef, size, x, y]);

  useAnimationFrame((t, delta) => {
    if (isDragging.current || !containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const currentX = x.get();
    const currentY = y.get();

    // Prevent huge jumps if delta is too large (e.g. returning to tab)
    const normalizedDelta = Math.min(delta, 32); 

    let newX = currentX + velocityX.current * (normalizedDelta / 16);
    let newY = currentY + velocityY.current * (normalizedDelta / 16);

    // Collision detection with window bounds
    if (newX <= 0) {
      newX = 0;
      velocityX.current = Math.abs(velocityX.current);
    } else if (newX >= container.width - size) {
      newX = container.width - size;
      velocityX.current = -Math.abs(velocityX.current);
    }

    if (newY <= 0) {
      newY = 0;
      velocityY.current = Math.abs(velocityY.current);
    } else if (newY >= container.height - size) {
      newY = container.height - size;
      velocityY.current = -Math.abs(velocityY.current);
    }

    x.set(newX);
    y.set(newY);
    rotate.set(rotate.get() + rotationSpeed * (normalizedDelta / 16));
  });

  if (!mounted) return null;

  return (
    <motion.img
      src={src}
      alt="Floating Pastry"
      drag
      dragConstraints={containerRef}
      dragElastic={0.1}
      onDragStart={() => (isDragging.current = true)}
      onDragEnd={(e, info) => {
        isDragging.current = false;
        // Inject drag momentum into the velocity
        if (Math.abs(info.velocity.x) > 10) {
           // Cap the thrown speed
           velocityX.current = Math.min(Math.max(info.velocity.x * 0.005, -5), 5);
        }
        if (Math.abs(info.velocity.y) > 10) {
           velocityY.current = Math.min(Math.max(info.velocity.y * 0.005, -5), 5);
        }
      }}
      style={{
        x,
        y,
        rotate,
        width: size,
        height: size,
        position: "absolute",
        cursor: "grab",
        touchAction: "none",
        filter: "drop-shadow(0px 20px 30px rgba(0,0,0,0.25))",
        userSelect: "none"
      }}
      whileTap={{ cursor: "grabbing", scale: 1.1 }}
    />
  );
}
