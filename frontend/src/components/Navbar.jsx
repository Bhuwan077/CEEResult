import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Menu, X, Lock, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const navLinks = [
    { name: 'Check Result', path: '/' },
    { name: 'About CEE', path: '/about' },
    { name: 'Help & FAQ', path: '/help' },
    { name: 'Privacy Policy', path: '/privacy' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Portal Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0f2942] text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:bg-[#163b5f] transition">
              <GraduationCap className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-extrabold text-[#0f2942] tracking-tight block leading-tight">
                CEE Result Checker
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Nepal Entrance Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(link.path)
                    ? 'text-blue-700 bg-blue-50/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Admin Dashboard CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to={isAuthenticated ? '/admin/dashboard' : '/admin/login'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#0f2942] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isAuthenticated ? 'Admin Dashboard' : 'Admin Login'}</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive(link.path)
                  ? 'text-blue-700 bg-blue-50 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100">
            <Link
              to={isAuthenticated ? '/admin/dashboard' : '/admin/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0f2942] hover:bg-[#163b5f]"
            >
              <Lock className="w-4 h-4" />
              <span>{isAuthenticated ? 'Go to Admin Dashboard' : 'Admin Portal Login'}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
