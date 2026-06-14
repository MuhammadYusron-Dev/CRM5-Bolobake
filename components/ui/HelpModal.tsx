"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HelpCircle } from 'lucide-react';

interface HelpModalProps {
  title: string;
  triggerText?: string;
  children: React.ReactNode;
}

export function HelpModal({ title, triggerText = "Bantuan", children }: HelpModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full shadow-sm hover:shadow">
          <HelpCircle className="w-4 h-4" />
          {triggerText}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto print:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl border-b pb-3">
            <HelpCircle className="w-6 h-6 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
