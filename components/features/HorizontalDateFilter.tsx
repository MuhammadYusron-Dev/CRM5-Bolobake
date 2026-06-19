import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface HorizontalDateFilterProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onRangeChange: (start: string, end: string) => void;
  orderDates: Set<string>; // Set of 'YYYY-MM-DD'
}

export function HorizontalDateFilter({
  startDate,
  endDate,
  onRangeChange,
  orderDates
}: HorizontalDateFilterProps) {
  // Use today as fallback
  const today = new Date();
  const defaultDate = startDate ? new Date(startDate) : today;
  
  const [viewMonth, setViewMonth] = useState(defaultDate.getMonth());
  const [viewYear, setViewYear] = useState(defaultDate.getFullYear());
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<string | null>(null);
  const [localStart, setLocalStart] = useState<string>(startDate);
  const [localEnd, setLocalEnd] = useState<string>(endDate);

  // Sync local state when external state changes, unless we are currently dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalStart(startDate);
      setLocalEnd(endDate);
    }
  }, [startDate, endDate, isDragging]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Update view when startDate changes externally
  useEffect(() => {
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) {
        setViewMonth(d.getMonth());
        setViewYear(d.getFullYear());
      }
    }
  }, [startDate]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const formatYMD = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Helper to check if a date string is between start and end (inclusive)
  const isDateInRange = (dateStr: string, startStr: string, endStr: string) => {
    if (!startStr || !endStr) return false;
    const d = new Date(dateStr).getTime();
    const s = new Date(startStr).getTime();
    const e = new Date(endStr).getTime();
    return d >= Math.min(s, e) && d <= Math.max(s, e);
  };

  // Mouse Handlers for Drag to Select
  const handleMouseDown = (dateStr: string) => {
    setIsDragging(true);
    setDragStartDate(dateStr);
    setLocalStart(dateStr);
    setLocalEnd(dateStr);
  };

  const handleMouseEnter = (dateStr: string) => {
    if (isDragging && dragStartDate) {
      const d1 = new Date(dragStartDate);
      const d2 = new Date(dateStr);
      if (d1.getTime() <= d2.getTime()) {
        setLocalStart(dragStartDate);
        setLocalEnd(dateStr);
      } else {
        setLocalStart(dateStr);
        setLocalEnd(dragStartDate);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragStartDate(null);
      // Finalize selection to parent
      if (localStart && localEnd) {
        onRangeChange(localStart, localEnd);
      }
    }
  };

  // Global mouse up to stop dragging if they release outside the container
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStartDate(null);
        if (localStart && localEnd) {
          onRangeChange(localStart, localEnd);
        }
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, localStart, localEnd, onRangeChange]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      // Prevent default vertical scroll if scrolling horizontally with mouse wheel
      if (e.deltaY !== 0) {
        e.preventDefault();
        scrollRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const todayYMD = formatYMD(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-muted/30 dark:glass-panel p-2 rounded-xl border border-border dark:border-white/10">
      
      {/* Month/Year Selector */}
      <div className="flex items-center justify-between sm:justify-start gap-2 bg-background dark:bg-black/20 px-3 py-2 rounded-lg border border-border dark:border-white/5 shadow-sm shrink-0">
        <button onClick={prevMonth} className="p-1 hover:bg-muted dark:hover:bg-white/10 rounded-md text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center min-w-[100px]">
          <span className="text-xs font-bold text-foreground dark:text-white">{monthNames[viewMonth]}</span>
          <span className="text-[10px] text-muted-foreground dark:text-white/60">{viewYear}</span>
        </div>
        <button onClick={nextMonth} className="p-1 hover:bg-muted dark:hover:bg-white/10 rounded-md text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Dates Container */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto pb-2 gap-1 custom-scrollbar select-none cursor-grab active:cursor-grabbing"
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {days.map(day => {
          const dateStr = formatYMD(viewYear, viewMonth, day);
          const hasOrders = orderDates.has(dateStr);
          const isSelected = isDateInRange(dateStr, localStart, localEnd);
          const isToday = dateStr === todayYMD;

          return (
            <div
              key={day}
              onMouseDown={() => handleMouseDown(dateStr)}
              onMouseEnter={() => handleMouseEnter(dateStr)}
              onMouseUp={handleMouseUp}
              className={`
                relative flex flex-col items-center justify-center min-w-[32px] h-[40px] rounded-md transition-all
                ${isSelected ? 'bg-primary text-primary-foreground shadow-sm scale-105 z-10 dark:shadow-[0_0_15px_rgba(0,89,255,0.6)]' : 'bg-background hover:bg-muted dark:bg-black/20 dark:hover:bg-primary/20 border border-border/50 dark:border-white/5 text-foreground'}
                ${isToday && !isSelected ? 'border-primary/50 dark:border-primary/50 dark:shadow-[inset_0_0_10px_rgba(0,89,255,0.3)]' : ''}
              `}
            >
              <span className={`text-xs ${isSelected ? 'font-bold' : 'font-medium'}`}>{day}</span>
              
              {/* Dot Indicator for Orders */}
              {hasOrders && (
                <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground dark:bg-white dark:shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'bg-primary dark:bg-primary dark:shadow-[0_0_8px_rgba(0,89,255,0.8)]'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Global CSS for hiding scrollbar if needed */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
