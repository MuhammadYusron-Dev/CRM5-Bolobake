"use client";
import { useRef, useState, useEffect } from "react";
import { motion, useAnimationFrame, useMotionValue, useSpring } from "framer-motion";

interface FloatingPastryProps {
  src: string;
  size: number;
  speed: number;
  rotationSpeed: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function FloatingPastry({ src, size, speed, rotationSpeed, containerRef }: FloatingPastryProps) {
  // targetX and targetY are the "logical" positions
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  
  // The visual position follows target with a spring for the rubber-band delay effect
  const springConfig = { stiffness: 80, damping: 12, mass: 1.2 };
  const x = useSpring(targetX, springConfig);
  const y = useSpring(targetY, springConfig);

  const rotate = useMotionValue(0);

  const velocityX = useRef(speed * (Math.random() > 0.5 ? 1 : -1));
  const velocityY = useRef(speed * (Math.random() > 0.5 ? 1 : -1));
  const isDragging = useRef(false);
  
  // Track pointer for velocity
  const lastMousePos = useRef({ x: 0, y: 0, time: 0 });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && containerRef.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        targetX.set(Math.random() * (bounds.width - size));
        targetY.set(Math.random() * (bounds.height - size));
    }
    setMounted(true);
  }, [containerRef, size, targetX, targetY]);

  useAnimationFrame((t, delta) => {
    if (isDragging.current || !containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const currentX = targetX.get();
    const currentY = targetY.get();

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

    targetX.set(newX);
    targetY.set(newY);
    rotate.set(rotate.get() + rotationSpeed * (normalizedDelta / 16));
  });

  if (!mounted) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY, time: performance.now() };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!containerRef.current) return;
      const container = containerRef.current.getBoundingClientRect();
      
      const dx = moveEvent.clientX - lastMousePos.current.x;
      const dy = moveEvent.clientY - lastMousePos.current.y;
      
      let newX = targetX.get() + dx;
      let newY = targetY.get() + dy;

      // Keep target exactly within frame so it doesn't get lost
      if (newX < 0) newX = 0;
      if (newX > container.width - size) newX = container.width - size;
      if (newY < 0) newY = 0;
      if (newY > container.height - size) newY = container.height - size;

      targetX.set(newX);
      targetY.set(newY);

      lastMousePos.current = { x: moveEvent.clientX, y: moveEvent.clientY, time: performance.now() };
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      isDragging.current = false;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      const now = performance.now();
      const dt = now - lastMousePos.current.time || 16;
      const dx = upEvent.clientX - lastMousePos.current.x;
      const dy = upEvent.clientY - lastMousePos.current.y;
      
      // Inject some momentum if thrown
      if (dt < 100 && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
        velocityX.current = Math.min(Math.max((dx / dt) * 20, -10), 10);
        velocityY.current = Math.min(Math.max((dy / dt) * 20, -10), 10);
      } else {
        velocityX.current = speed * (Math.random() > 0.5 ? 1 : -1);
        velocityY.current = speed * (Math.random() > 0.5 ? 1 : -1);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <motion.img
      src={src}
      alt="Floating Pastry"
      onPointerDown={handlePointerDown}
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
      whileTap={{ cursor: "grabbing" }}
      draggable={false}
    />
  );
}
