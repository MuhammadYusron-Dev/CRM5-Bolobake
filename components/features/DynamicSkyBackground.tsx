import React, { useState, useEffect, useRef, useMemo } from 'react';

interface DynamicSkyBackgroundProps {
  currentHour: number;
}

export function DynamicSkyBackground({ currentHour }: DynamicSkyBackgroundProps) {
  // Track accumulated hours to prevent backwards rotation jumps in preview mode
  const [accumulatedHour, setAccumulatedHour] = useState(currentHour);
  const prevHourRef = useRef(currentHour);

  useEffect(() => {
    let diff = currentHour - prevHourRef.current;
    // If time jumped backwards by a lot (e.g., midnight or fast preview loop), assume it's the next day
    if (diff < -6) {
      diff += 24;
    }
    setAccumulatedHour(prev => prev + diff);
    prevHourRef.current = currentHour;
  }, [currentHour]);

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
    cloudClass = 'text-rose-100/70';
  } else if (isEvening) {
    cloudClass = 'text-purple-200/40';
  } else if (isNight) {
    cloudClass = 'text-slate-300/10';
  }

  // Calculate angles for the arc
  // Sun: 06:00 is -90deg (Left), 12:00 is 0deg (Top), 18:00 is 90deg (Right)
  const sunAngle = (accumulatedHour - 12) * 15;
  // Moon: 18:00 is 90deg (Right), 00:00 is 0deg (Top), 06:00 is -90deg (Left)
  const moonAngle = -(accumulatedHour - 24) * 15;

  // Celestial bodies orbiting on a pivot
  const celestialBodies = (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* Sun Orbit Wrapper */}
      <div 
        className="absolute left-1/2 w-0 h-0 transition-transform duration-[4000ms] ease-in-out"
        style={{ bottom: 'calc(32px - 60vw)', transform: `rotate(${sunAngle}deg)` }}
      >
        <div 
          className="absolute -ml-[2rem] -mt-[2rem] w-16 h-16 rounded-full transition-all duration-[4000ms] ease-in-out"
          style={{ 
            bottom: '60vw', 
            background: isMorning ? '#fef08a' : isMidday ? '#fef9c3' : '#fb923c',
            boxShadow: isMorning ? '0 0 30px 10px rgba(253,224,71,0.5)' : isMidday ? '0 0 40px 15px rgba(253,224,71,0.6)' : '0 0 30px 10px rgba(251,146,60,0.6)',
            filter: isAfternoon || isEvening ? 'blur(2px)' : 'blur(1px)',
            opacity: isNight ? 0 : 1
          }}
        />
      </div>

      {/* Moon Orbit Wrapper */}
      <div 
        className="absolute left-1/2 w-0 h-0 transition-transform duration-[4000ms] ease-in-out"
        style={{ bottom: 'calc(32px - 60vw)', transform: `rotate(${moonAngle}deg)` }}
      >
        <div 
          className="absolute -ml-[1.5rem] -mt-[1.5rem] w-12 h-12 bg-slate-100 rounded-full blur-[1px] shadow-[0_0_20px_5px_rgba(241,245,249,0.3)] transition-all duration-[4000ms] ease-in-out"
          style={{ 
            bottom: '60vw',
            transform: `rotate(${-moonAngle}deg)`, // Counter-rotate so craters stay upright
            opacity: (!isNight && !isEvening && currentHour > 7 && currentHour < 17) ? 0 : 1 
          }}
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

  return (
    <div className={`fixed inset-0 z-0 bg-gradient-to-b transition-colors duration-[3000ms] ${bgGradient} overflow-hidden pointer-events-none`}>
      {celestialBodies}
      {stars}
      {clouds}
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
