import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: About Platform */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                CEE Result Checker Nepal
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
              A high-performance result verification portal designed for students appearing in Nepal's Common Entrance Examination (CEE) for Bachelor Level Medical, Dental, and Allied Health programs.
            </p>
            <div className="pt-2 text-xs text-slate-500">
              Preserving exact symbol numbers with high-fidelity PDF extraction and OCR.
            </div>
          </div>

          {/* Column 2: Supported Programs */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              CEE Programs
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-slate-200 transition">MBBS (Medicine & Surgery)</li>
              <li className="hover:text-slate-200 transition">BDS (Dental Surgery)</li>
              <li className="hover:text-slate-200 transition">B.Sc Nursing / B.Midwifery</li>
              <li className="hover:text-slate-200 transition">BAMS (Ayurvedic Medicine)</li>
              <li className="hover:text-slate-200 transition">B.Pharm & Allied Health</li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Information & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-slate-200 transition">Check Result</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-slate-200 transition">About CEE Entrance</Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-slate-200 transition">Help & Verification FAQ</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-slate-200 transition">Privacy Policy & Disclaimer</Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-slate-200 transition">Admin Controller Portal</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Disclaimer */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} CEE Result Checker Nepal. Non-governmental public utility.
          </p>
          <p className="flex items-center gap-1">
            Built for Nepal entrance candidates with accuracy & care
          </p>
        </div>
      </div>
    </footer>
  );
}
