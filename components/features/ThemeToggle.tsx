"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle({ isCollapsed }: { isCollapsed?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder to prevent hydration mismatch
    return (
      <div className={`flex items-center justify-center p-1 bg-secondary rounded-full ${isCollapsed ? 'w-10' : 'w-full max-w-[200px]'}`}>
        <div className="w-8 h-8 rounded-full bg-background" />
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <button
        onClick={() => {
          if (theme === 'light') setTheme('dark');
          else if (theme === 'dark') setTheme('system');
          else setTheme('light');
        }}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        title={`Tema saat ini: ${theme === 'system' ? 'Sistem' : theme === 'dark' ? 'Gelap' : 'Terang'}`}
      >
        {theme === 'light' ? <Sun className="w-5 h-5" /> : theme === 'dark' ? <Moon className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between p-1 bg-secondary/60 rounded-full w-full max-w-[220px] relative">
      {/* Sliding Highlight Background */}
      <div 
        className="absolute h-[calc(100%-8px)] w-[calc(33.33%-4px)] bg-background rounded-full shadow-sm transition-all duration-300 ease-out z-0"
        style={{ 
          left: '4px',
          transform: `translateX(${theme === 'light' ? '0%' : theme === 'dark' ? '106%' : '212%'})` 
        }}
      />

      <button
        onClick={() => setTheme("light")}
        className={`flex-1 flex items-center justify-center h-8 rounded-full transition-colors z-10 ${
          theme === "light" ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Light mode"
        title="Terang"
      >
        <Sun className="w-4 h-4" />
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`flex-1 flex items-center justify-center h-8 rounded-full transition-colors z-10 ${
          theme === "dark" ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Dark mode"
        title="Gelap"
      >
        <Moon className="w-4 h-4" />
      </button>

      <button
        onClick={() => setTheme("system")}
        className={`flex-1 flex items-center justify-center h-8 rounded-full transition-colors z-10 ${
          theme === "system" ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="System mode"
        title="Sistem"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
