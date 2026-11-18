import React from 'react';
import { Award, Printer, CheckCircle, AlertTriangle, Building, BookOpen, Hash, UserCheck } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function ResultCard({ result }) {
  if (!result) return null;

  const handlePrint = () => {
    window.print();
  };

  const isQualified = result.qualification_status && 
    result.qualification_status.toLowerCase().includes('qualified') &&
    !result.qualification_status.toLowerCase().includes('not');

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/80 overflow-hidden print-card transition-all animate-fadeIn">
      {/* Top Banner with Exam Branding */}
      <div className={`px-6 sm:px-8 py-5 border-b flex flex-wrap items-center justify-between gap-4 ${
        isQualified ? 'bg-gradient-to-r from-slate-900 via-[#0f2942] to-slate-900 text-white' : 'bg-slate-800 text-white'
      }`}>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-blue-200 mb-1 backdrop-blur-sm">
            <Building className="w-3 h-3" />
            Official Entrance Result Record
          </div>
          <h3 className="text-base sm:text-lg font-bold tracking-tight">
            {result.examination_name || 'Common Entrance Examination (CEE)'}
          </h3>
          <p className="text-xs text-slate-300">
            Year: {result.examination_year || '2024'} • Program: {result.program || 'Bachelor Level'}
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="no-print inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition backdrop-blur-sm"
          title="Print or save as PDF"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Slip</span>
        </button>
      </div>

      {/* Main Result Scorecard Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Status & Key Metrics Grid */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Qualification Status</span>
            <div className="mt-1">
              <StatusBadge status={result.qualification_status || 'Under Evaluation'} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {result.rank !== null && result.rank !== undefined && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" /> Merit Rank
                </span>
                <p className="text-2xl font-extrabold text-slate-900 font-mono">
                  #{result.rank}
                </p>
              </div>
            )}

            {result.score !== null && result.score !== undefined && (
              <div className="text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Obtained Score</span>
                <p className="text-2xl font-extrabold text-blue-700 font-mono">
                  {Number(result.score).toFixed(2)}
                  <span className="text-xs font-normal text-slate-400 font-sans ml-1">/ 200</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Extracted Candidate Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-500" /> Candidate Name
            </span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {result.student_name || <span className="text-slate-400 italic">Name Not Published in Source PDF</span>}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-500" /> Symbol / Roll Number
            </span>
            <p className="text-base font-bold font-mono text-slate-900 mt-0.5 tracking-wider">
              {result.symbol_number}
            </p>
          </div>

          {result.category && (
            <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Category / Reservation Quota
              </span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {result.category}
              </p>
            </div>
          )}

          {result.program && (
            <div className="p-3.5 rounded-xl border border-slate-100 bg-white">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" /> Examination Program
              </span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {result.program}
              </p>
            </div>
          )}
        </div>

        {/* Remarks / Counseling Advisory if Available */}
        {result.remarks && (
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs sm:text-sm text-blue-900">
            <span className="font-semibold block mb-0.5">Official Remarks:</span>
            <p>{result.remarks}</p>
          </div>
        )}

        {/* Verification Footer Notes */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Record verified against published administrative result sheet.</span>
          </div>
          {result.published_at && (
            <span>Published: {new Date(result.published_at).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
