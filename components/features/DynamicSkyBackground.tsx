import React, { useMemo } from 'react';

interface DynamicSkyBackgroundProps {
  currentHour: number;
}

export function DynamicSkyBackground({ currentHour }: DynamicSkyBackgroundProps) {
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

  // Sun and Moon positioning
  let celestialBody = null;
  
  if (isMorning) {
    // Sun rising from bottom
    celestialBody = (
      <div className="absolute left-[20%] bottom-[20%] w-32 h-32 bg-yellow-200 rounded-full blur-[2px] shadow-[0_0_60px_20px_rgba(253,224,71,0.5)] transition-all duration-[3000ms] ease-in-out" />
    );
  } else if (isMidday) {
    // Sun at top
    celestialBody = (
      <div className="absolute left-[50%] top-[10%] -translate-x-1/2 w-40 h-40 bg-yellow-100 rounded-full blur-[2px] shadow-[0_0_80px_30px_rgba(253,224,71,0.6)] transition-all duration-[3000ms] ease-in-out" />
    );
  } else if (isAfternoon) {
    // Sun setting
    celestialBody = (
      <div className="absolute right-[25%] bottom-[25%] w-32 h-32 bg-orange-400 rounded-full blur-[2px] shadow-[0_0_60px_20px_rgba(251,146,60,0.6)] transition-all duration-[3000ms] ease-in-out" />
    );
  } else if (isEvening) {
    // Sun fully setting
    celestialBody = (
      <div className="absolute right-[15%] bottom-[5%] w-24 h-24 bg-red-500 rounded-full blur-[4px] shadow-[0_0_50px_15px_rgba(239,68,68,0.7)] transition-all duration-[3000ms] ease-in-out" />
    );
  } else if (isNight) {
    // Moon
    celestialBody = (
      <div className="absolute right-[20%] top-[15%] w-24 h-24 bg-slate-100 rounded-full blur-[1px] shadow-[0_0_40px_10px_rgba(241,245,249,0.3)] transition-all duration-[3000ms] ease-in-out">
        {/* Moon Craters */}
        <div className="absolute top-4 left-4 w-4 h-4 bg-slate-300 rounded-full opacity-50"></div>
        <div className="absolute bottom-6 right-6 w-6 h-6 bg-slate-300 rounded-full opacity-40"></div>
        <div className="absolute top-10 right-4 w-3 h-3 bg-slate-300 rounded-full opacity-60"></div>
      </div>
    );
  }

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
      {celestialBody}
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
