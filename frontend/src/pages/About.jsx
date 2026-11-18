import React from 'react';
import { BookOpen, CheckCircle, Award, Shield, HelpCircle } from 'lucide-react';

export default function About() {
  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <BookOpen className="w-3.5 h-3.5" />
          <span>About Nepal CEE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f2942] tracking-tight">
          Common Entrance Examination (CEE) Nepal
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          The Common Entrance Examination (CEE) is the unified, high-stakes medical and healthcare entrance examination conducted annually across Nepal by the Medical Education Commission (MEC).
        </p>
      </div>

      <div className="space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
        {/* Section 1 */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Participating Academic Programs
          </h2>
          <p>
            The examination determines merit-based admissions for both scholarship (free) seats and paying seats in medical and health sciences across all medical colleges and universities in Nepal, including:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs sm:text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>MBBS:</strong> Bachelor of Medicine, Bachelor of Surgery</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>BDS:</strong> Bachelor of Dental Surgery</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>B.Sc Nursing / B.Midwifery:</strong> Professional Nursing</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>BAMS:</strong> Ayurvedic Medicine and Surgery</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>B.Pharm:</strong> Bachelor of Pharmacy</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>BPT:</strong> Bachelor of Physiotherapy</span>
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Marking Scheme & Qualification Criteria
          </h2>
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              • <strong>Total Marks:</strong> 200 marks (single comprehensive test consisting of Physics, Chemistry, Biology, and Mental Agility Test).
            </p>
            <p>
              • <strong>Negative Marking:</strong> 0.25 marks deducted for each incorrect response.
            </p>
            <p>
              • <strong>Minimum Qualifying Cutoff:</strong> Candidates must obtain at least the 50th percentile (typically 100.00 marks out of 200) to be considered qualified for college matching and counseling.
            </p>
          </div>
        </div>

        {/* Section 3: Platform Transparency */}
        <div className="bg-blue-50/70 p-6 rounded-2xl border border-blue-100 text-sm space-y-2 text-blue-900">
          <h3 className="font-bold flex items-center gap-2 text-blue-950">
            <HelpCircle className="w-4 h-4 text-blue-700" />
            Role of CEE Result Checker Nepal
          </h3>
          <p>
            This portal is an independent result verification tool. When official PDFs are released by the authorities, they often span hundreds of pages, making it difficult for mobile users to quickly find and verify their scores. Our system parses the officially published PDF using both native text extraction and OCR (Optical Character Recognition) so students can instantly search by symbol number while preserving exact formatting.
          </p>
        </div>
      </div>
    </div>
  );
}
