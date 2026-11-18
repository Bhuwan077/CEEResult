import React from 'react';
import { CheckCircle2, XCircle, Clock, FileCheck } from 'lucide-react';

export default function StatusBadge({ status, type = 'qualification' }) {
  if (!status) return null;

  const s = status.toLowerCase();

  if (type === 'qualification') {
    if (s.includes('qualified') && !s.includes('not')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Qualified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        Not Qualified
      </span>
    );
  }

  // Publication Status
  if (s === 'published') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <FileCheck className="w-3 h-3 text-blue-600" />
        Published
      </span>
    );
  }
  if (s === 'reviewing') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        Reviewing OCR
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      Draft
    </span>
  );
}
