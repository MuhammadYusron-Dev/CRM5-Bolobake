import React, { useState, useEffect, useRef, useMemo } from 'react';

interface DynamicSkyBackgroundProps {
  currentHour: number;
}

export function DynamicSkyBackground({ currentHour }: DynamicSkyBackgroundProps) {
  const sunWrapperRef = useRef<HTMLDivElement>(null);
  const sunInnerRef = useRef<HTMLDivElement>(null);
  const moonWrapperRef = useRef<HTMLDivElement>(null);
  const moonInnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId: number;
    const updateOrbits = () => {
      const now = new Date();
      // Precise decimal hour
      const h = now.getHours() + (now.getMinutes() / 60) + (now.getSeconds() / 3600) + (now.getMilliseconds() / 3600000);

      // Sun Orbit: 06:00 is -90deg (Left), 12:00 is 0deg (Top), 18:00 is 90deg (Right)
      const sunAngle = (h - 12) * 15;
      if (sunWrapperRef.current) {
        sunWrapperRef.current.style.transform = `rotate(${sunAngle}deg)`;
      }
      if (sunInnerRef.current) {
        sunInnerRef.current.style.opacity = (h >= 6 && h <= 18) ? '1' : '0';
      }

      // Moon Orbit: 19:00 is 90deg (Right), 23:00 is -90deg (Left)
      // Travels 180 degrees in 4 hours = 45 degrees/hour
      let moonAngle = 0;
      if (h >= 19 && h <= 23) {
         moonAngle = 90 - (h - 19) * 45;
      } else if (h < 19 && h > 12) {
         moonAngle = 90;
      } else {
         moonAngle = -90;
      }
      
      if (moonWrapperRef.current) {
        moonWrapperRef.current.style.transform = `rotate(${moonAngle}deg)`;
      }
      if (moonInnerRef.current) {
        moonInnerRef.current.style.transform = `rotate(${-moonAngle}deg)`;
        moonInnerRef.current.style.opacity = (h >= 19 && h <= 23) ? '1' : '0';
      }

      frameId = requestAnimationFrame(updateOrbits);
    };

    frameId = requestAnimationFrame(updateOrbits);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Determine time phase
  const isMorning = currentHour >= 5 && currentHour < 12;
  const isMidday = currentHour >= 12 && currentHour < 15;
  const isAfternoon = currentHour >= 15 && currentHour < 18;
  const isEvening = currentHour >= 18 && currentHour < 19;
  const isNight = currentHour >= 19 || currentHour < 5;

  // Background Gradient Classes
  let bgGradient = '';
  if (isMorning) {
    bgGradient = 'from-sky-300 via-blue-200 to-sky-100';
  } else if (isMidday) {
    bgGradient = 'from-blue-400 via-sky-300 to-sky-200';
  } else if (isAfternoon) {
    bgGradient = 'from-orange-400 via-rose-300 to-purple-400';
  } else if (isEvening) {
    bgGradient = 'from-orange-600 via-purple-600 to-indigo-800';
  } else if (isNight) {
    bgGradient = 'from-slate-900 via-indigo-950 to-slate-900';
  }

  // Cloud Color Class
  let cloudClass = '';
  if (isMorning || isMidday) {
    cloudClass = 'text-white/90';
  } else if (isAfternoon) {
    cloudClass = 'text-orange-200/60 drop-shadow-md';
  } else if (isEvening) {
    cloudClass = 'text-purple-300/40';
  } else if (isNight) {
    cloudClass = 'text-slate-300/10';
  }

  // Celestial bodies orbiting on a pivot
  const celestialBodies = (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* Sun Orbit Wrapper */}
      <div 
        ref={sunWrapperRef}
        className="absolute left-1/2 w-0 h-0"
        style={{ bottom: 'calc(32px - 60vw)' }}
      >
        <div 
          ref={sunInnerRef}
          className="absolute -ml-[2rem] -mt-[2rem] w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-[4000ms]"
          style={{ 
            bottom: '60vw', 
            background: isMorning ? '#fef08a' : isMidday ? '#fef9c3' : '#fb923c',
            boxShadow: isMorning ? '0 0 40px 15px rgba(253,224,71,0.5)' : isMidday ? '0 0 50px 20px rgba(253,224,71,0.6)' : '0 0 60px 25px rgba(251,146,60,0.8)',
          }}
        >
          {isAfternoon && (
             <div className="absolute inset-[-100px] sunset-rays rounded-full opacity-60"></div>
          )}
        </div>
      </div>

      {/* Moon Orbit Wrapper */}
      <div 
        ref={moonWrapperRef}
        className="absolute left-1/2 w-0 h-0"
        style={{ bottom: 'calc(32px - 60vw)' }}
      >
        <div 
          ref={moonInnerRef}
          className="absolute -ml-[1.5rem] -mt-[1.5rem] w-12 h-12 bg-slate-100 rounded-full blur-[1px] shadow-[0_0_20px_5px_rgba(241,245,249,0.3)]"
          style={{ bottom: '60vw' }}
        >
          {/* Moon Craters */}
          <div className="absolute top-2 left-2 w-2 h-2 bg-slate-300 rounded-full opacity-50"></div>
          <div className="absolute bottom-3 right-3 w-3 h-3 bg-slate-300 rounded-full opacity-40"></div>
          <div className="absolute top-5 right-2 w-1.5 h-1.5 bg-slate-300 rounded-full opacity-60"></div>
        </div>
      </div>
    </div>
  );

  // Stars (Only at night and evening)
  const stars = useMemo(() => {
    if (!isNight && !isEvening) return null;
    // Generate random stars
    return Array.from({ length: 60 }).map((_, i) => {
      const size = Math.random() * 3 + 1;
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = Math.random() * 3 + 2;
      return (
        <div
          key={i}
          className="absolute bg-white rounded-full animate-twinkle"
          style={{
            width: size,
            height: size,
            top: `${top}%`,
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            opacity: Math.random() * 0.8 + 0.2
          }}
        />
      );
    });
  }, [isNight, isEvening]);

  // Clouds layer
  const clouds = (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Cloud 1 */}
      <div className="absolute top-[5%] -left-[30%] animate-drift" style={{ animationDuration: '55s' }}>
        <RealisticCloud className={cloudClass} />
      </div>
      {/* Cloud 2 */}
      <div className="absolute top-[20%] -left-[30%] animate-drift" style={{ animationDuration: '75s', animationDelay: '-15s', transform: 'scale(1.2)' }}>
        <RealisticCloud className={cloudClass} />
      </div>
      {/* Cloud 3 */}
      <div className="absolute top-[40%] -left-[30%] animate-drift" style={{ animationDuration: '65s', animationDelay: '-30s', transform: 'scale(0.7)' }}>
        <RealisticCloud className={cloudClass} />
      </div>
      {/* Cloud 4 */}
      <div className="absolute top-[60%] -left-[30%] animate-drift" style={{ animationDuration: '90s', animationDelay: '-40s', transform: 'scale(0.9)' }}>
        <RealisticCloud className={cloudClass} />
      </div>
      {/* Cloud 5 */}
      <div className="absolute top-[10%] -left-[30%] animate-drift" style={{ animationDuration: '100s', animationDelay: '-60s', transform: 'scale(1.5)' }}>
        <RealisticCloud className={cloudClass} />
      </div>
    </div>
  );

  const birds = isAfternoon ? (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <div className="absolute bird-animate-1">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-black/40">
           <path d="M2,12 C4,8 8,6 12,10 C16,6 20,8 22,12 C20,10 16,10 12,13 C8,10 4,10 2,12 Z" fill="currentColor"/>
        </svg>
      </div>
      <div className="absolute bird-animate-2" style={{ top: '15%' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-black/30">
           <path d="M2,12 C4,8 8,6 12,10 C16,6 20,8 22,12 C20,10 16,10 12,13 C8,10 4,10 2,12 Z" fill="currentColor"/>
        </svg>
      </div>
      <div className="absolute bird-animate-3" style={{ top: '5%' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-black/20">
           <path d="M2,12 C4,8 8,6 12,10 C16,6 20,8 22,12 C20,10 16,10 12,13 C8,10 4,10 2,12 Z" fill="currentColor"/>
        </svg>
      </div>
    </div>
  ) : null;

  return (
    <div className={`fixed inset-0 z-0 bg-gradient-to-b transition-colors duration-[3000ms] ${bgGradient} overflow-hidden pointer-events-none`}>
      <style>{`
        @keyframes flyBirds {
          0% { transform: translateX(120vw) translateY(5vh); }
          100% { transform: translateX(-20vw) translateY(-5vh); }
        }
        .bird-animate-1 { animation: flyBirds 25s linear infinite; }
        .bird-animate-2 { animation: flyBirds 35s linear infinite 5s; }
        .bird-animate-3 { animation: flyBirds 40s linear infinite 12s; }
        @keyframes sunsetRays {
          0% { transform: rotate(0deg) scale(1); opacity: 0.3; }
          50% { transform: rotate(180deg) scale(1.2); opacity: 0.6; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.3; }
        }
        .sunset-rays {
          animation: sunsetRays 90s linear infinite;
          background: repeating-conic-gradient(from 0deg, rgba(255, 200, 100, 0.4) 0deg 15deg, transparent 15deg 30deg);
          -webkit-mask-image: radial-gradient(circle, black 20%, transparent 70%);
          mask-image: radial-gradient(circle, black 20%, transparent 70%);
        }
      `}</style>
      {celestialBodies}
      {stars}
      {clouds}
      {birds}
    </div>
  );
}

function RealisticCloud({ className }: { className?: string }) {
  // Uses overlapping blurred elements to create volumetric fog/clouds
  return (
    <div className={`relative w-[400px] h-[150px] transition-colors duration-[3000ms] ${className}`}>
      {/* Base fluffy parts */}
      <div className="absolute top-[30%] left-[10%] w-[150px] h-[60px] bg-current rounded-full blur-[20px] opacity-80" />
      <div className="absolute top-[20%] left-[30%] w-[180px] h-[80px] bg-current rounded-full blur-[25px] opacity-90" />
      <div className="absolute top-[40%] left-[50%] w-[160px] h-[70px] bg-current rounded-full blur-[20px] opacity-70" />
      <div className="absolute top-[50%] left-[20%] w-[250px] h-[50px] bg-current rounded-full blur-[15px] opacity-60" />
      
      {/* Wispy edges */}
      <div className="absolute top-[10%] left-[40%] w-[100px] h-[40px] bg-current rounded-full blur-[15px] opacity-50" />
      <div className="absolute top-[60%] left-[40%] w-[150px] h-[40px] bg-current rounded-full blur-[15px] opacity-50" />
    </div>
  );
}
