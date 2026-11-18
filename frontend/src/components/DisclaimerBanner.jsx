import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="bg-blue-50/80 border-b border-blue-100/80 px-4 py-2.5 text-xs sm:text-sm text-slate-600 no-print">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <p>
            <span className="font-semibold text-slate-800">Public Information Notice:</span> This is an independent verification platform for Nepal CEE entrance results. Official records remain with the Medical Education Commission (MEC).
          </p>
        </div>
        <span className="hidden md:inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800">
          Nepal CEE Portal
        </span>
      </div>
    </div>
  );
}
