import React, { useEffect, useState } from 'react';
import { Search, X, Filter, Sparkles, GraduationCap } from 'lucide-react';
import { api } from '../services/api';

export default function SearchCard({
  symbolNumber,
  setSymbolNumber,
  selectedExamId,
  setSelectedExamId,
  onSearch,
  onClear,
  loading
}) {
  const [examinations, setExaminations] = useState([]);

  useEffect(() => {
    async function loadExams() {
      try {
        const data = await api.getPublishedExaminations();
        setExaminations(data);
      } catch (err) {
        console.error('Failed to load published examinations list:', err);
      }
    }
    loadExams();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!symbolNumber.trim() || loading) return;
    onSearch();
  };

  const sampleSymbols = ['00101', '00102', '00204', '01053', '05999', '10101'];

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8 transition-all">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Entrance Result Verification</h2>
          <p className="text-xs text-slate-500">Search by official CEE Symbol / Roll Number</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Examination Filter (Optional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Select Examination / Program
          </label>
          <div className="relative">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="">All Officially Published CEE Examinations</option>
              {examinations.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.examination_name} ({exam.examination_year})
                </option>
              ))}
            </select>
            <Filter className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Symbol Number Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Symbol Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={symbolNumber}
              onChange={(e) => setSymbolNumber(e.target.value)}
              placeholder="e.g. 00101 or 10101"
              autoFocus
              className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-4 py-3.5 text-base sm:text-lg font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-sans transition tracking-wider"
            />
            {symbolNumber && (
              <button
                type="button"
                onClick={onClear}
                aria-label="Clear input"
                className="absolute right-3.5 top-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-500 flex items-center justify-between">
            <span>Preserves exact leading zeros (e.g., 00101). Whitespace is ignored.</span>
            <span className="font-mono text-[11px] text-slate-400">{symbolNumber.length} chars</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={!symbolNumber.trim() || loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-[#0f2942] hover:bg-[#163b5f] active:bg-[#0a1c2e] focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-md shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Searching Records...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Check Result</span>
              </>
            )}
          </button>

          {symbolNumber && (
            <button
              type="button"
              onClick={onClear}
              className="px-5 py-3.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Quick Test Demo Chips */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Demo Numbers (1-Click Test):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleSymbols.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => {
                setSymbolNumber(sym);
                onSearch(sym);
              }}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-700 transition"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
