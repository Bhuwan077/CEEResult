import React from 'react';
import { Search, ShieldAlert, Award, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import SearchCard from '../components/SearchCard';
import ResultCard from '../components/ResultCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSearch } from '../hooks/useSearch';

export default function Home() {
  const {
    symbolNumber,
    setSymbolNumber,
    selectedExamId,
    setSelectedExamId,
    results,
    loading,
    error,
    hasSearched,
    performSearch,
    clearSearch
  } = useSearch();

  return (
    <div className="flex-1 flex flex-col">
      <DisclaimerBanner />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100/80 text-blue-800 border border-blue-200/60 shadow-2xs">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            <span>Nepal CEE Bachelor & PG Entrance Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0f2942] tracking-tight">
            Check Your CEE Entrance Result
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
            Enter your official entrance examination <span className="font-semibold text-slate-800">symbol number</span> to instantly view your merit rank, score, qualification status, and program allocation.
          </p>
        </div>

        {/* Prominent Search Card */}
        <div className="mt-8 sm:mt-10">
          <SearchCard
            symbolNumber={symbolNumber}
            setSymbolNumber={setSymbolNumber}
            selectedExamId={selectedExamId}
            setSelectedExamId={setSelectedExamId}
            onSearch={performSearch}
            onClear={clearSearch}
            loading={loading}
          />
        </div>
      </section>

      {/* Results / Feedback Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {loading && (
          <div className="py-12">
            <LoadingSpinner size="lg" text="Searching published examination datasets..." />
          </div>
        )}

        {/* Error / Not Found Message */}
        {!loading && hasSearched && error && (
          <div className="w-full max-w-2xl mx-auto p-5 sm:p-6 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 shadow-sm animate-fadeIn">
            <div className="flex items-start gap-3.5">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-base text-amber-900">Result Not Found</h4>
                <p className="text-sm text-amber-800 leading-relaxed">{error}</p>
                <div className="pt-2 text-xs text-amber-700 space-y-1">
                  <p>• Make sure to include all leading zeros (e.g., <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">00101</code> instead of <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">101</code>).</p>
                  <p>• Check if the result for your program has been officially published by the administrator.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Matched Results Cards */}
        {!loading && results && results.length > 0 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="w-full max-w-2xl mx-auto flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
              <span>Found {results.length} record(s) matching symbol "{symbolNumber}"</span>
              <span className="text-emerald-700 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Dataset
              </span>
            </div>

            {results.map((res) => (
              <ResultCard key={res.id || res.symbol_number} result={res} />
            ))}
          </div>
        )}

        {/* Informational Guidance (When no search has taken place) */}
        {!hasSearched && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-200 transition">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Leading Zero Preservation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Symbol numbers like <span className="font-mono font-medium text-slate-800">00101</span> or <span className="font-mono font-medium text-slate-800">02341</span> retain their leading digits with strict precision.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-200 transition">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Dual OCR & Text Pipeline</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Supports both native digital PDFs and scanned image documents processed via high-resolution OCR.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-200 transition">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Human-Verified Data</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Uncertain OCR extractions and potential duplicates are flagged and verified by administrators prior to public release.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
