"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Plus, Bell, X, Clock, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Timer = {
  id: string;
  label: string;
  durationSec: number;
  remainingSec: number;
  status: 'idle' | 'running' | 'paused' | 'done';
};

export function ProductionTimers() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newMinutes, setNewMinutes] = useState<number>(15);
  
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Sound effect for alarm (using standard web audio)
  const playAlarm = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.setValueAtTime(0, audioCtx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch(e) {}
  };

  useEffect(() => {
    timerInterval.current = setInterval(() => {
      setTimers(prevTimers => {
        let hasChanges = false;
        let shouldAlarm = false;

        const updated = prevTimers.map(t => {
          if (t.status === 'running') {
            hasChanges = true;
            const nextRemaining = t.remainingSec - 1;
            if (nextRemaining <= 0) {
              shouldAlarm = true;
              return { ...t, remainingSec: 0, status: 'done' as Timer['status'] };
            }
            return { ...t, remainingSec: nextRemaining };
          }
          return t;
        });

        if (shouldAlarm) playAlarm();
        return hasChanges ? updated : prevTimers;
      });
    }, 1000);

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, []);

  const addTimer = () => {
    if (!newLabel || newMinutes <= 0) return;
    const newTimer: Timer = {
      id: Date.now().toString(),
      label: newLabel,
      durationSec: newMinutes * 60,
      remainingSec: newMinutes * 60,
      status: 'idle'
    };
    setTimers([...timers, newTimer]);
    setNewLabel('');
  };

  const updateTimerStatus = (id: string, status: Timer['status']) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const removeTimer = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (timers.length === 0 && isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 print:hidden">
        <Button onClick={() => setIsMinimized(false)} className="rounded-full shadow-lg h-14 w-14 gap-0" size="icon">
          <Clock className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-80 bg-white dark:bg-slate-950 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 print:hidden ${isMinimized ? 'translate-y-[calc(100%-3rem)]' : 'translate-y-0'}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b bg-slate-50 dark:bg-slate-900 rounded-t-xl cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">Produksi Timers</span>
          {timers.filter(t => t.status === 'running').length > 0 && (
            <span className="flex w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
        </Button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
        {timers.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-4 italic">
            Belum ada timer aktif.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {timers.map(timer => (
              <Card key={timer.id} className={`p-3 border flex flex-col gap-2 ${timer.status === 'done' ? 'border-red-300 bg-red-50 dark:bg-red-900/20 animate-pulse' : 'border-slate-100 dark:border-slate-800 shadow-sm'}`}>
                <div className="flex justify-between items-start">
                  <span className={`font-bold text-xs truncate max-w-[160px] ${timer.status === 'done' ? 'text-red-700' : 'text-slate-700 dark:text-slate-300'}`}>
                    {timer.label}
                  </span>
                  <button onClick={() => removeTimer(timer.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-mono text-2xl font-bold tracking-tight ${timer.status === 'done' ? 'text-red-600' : 'text-slate-800 dark:text-slate-100'}`}>
                    {formatTime(timer.remainingSec)}
                  </span>
                  
                  <div className="flex gap-1">
                    {timer.status === 'idle' || timer.status === 'paused' ? (
                      <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateTimerStatus(timer.id, 'running')}>
                        <Play className="w-4 h-4" />
                      </Button>
                    ) : timer.status === 'running' ? (
                      <Button size="icon" variant="outline" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => updateTimerStatus(timer.id, 'paused')}>
                        <Pause className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="outline" className="h-8 w-8 text-slate-600" onClick={() => updateTimerStatus(timer.id, 'idle')}>
                        <Square className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add Timer Form */}
        <div className="flex items-center gap-2 pt-2 border-t mt-2">
          <input 
            type="text" 
            placeholder="Label (Cth: Oven 1)" 
            className="flex-1 h-8 text-xs px-2 border rounded-md"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTimer()}
          />
          <input 
            type="number" 
            placeholder="Min" 
            className="w-14 h-8 text-xs px-2 border rounded-md text-center"
            value={newMinutes || ''}
            onChange={e => setNewMinutes(parseInt(e.target.value) || 0)}
            onKeyDown={e => e.key === 'Enter' && addTimer()}
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={addTimer}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
