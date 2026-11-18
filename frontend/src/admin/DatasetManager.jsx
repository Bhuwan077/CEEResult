import React, { useState } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export function CreateExamModal({ isOpen, onClose, onSuccess }) {
  const [examName, setExamName] = useState('');
  const [examYear, setExamYear] = useState('2024');
  const [program, setProgram] = useState('MBBS / BDS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!examName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const newExam = await api.createExamination({
        examination_name: examName.trim(),
        examination_year: examYear.trim(),
        program: program.trim(),
      });
      if (onSuccess) onSuccess(newExam);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create examination dataset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Create New Examination Dataset</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Examination Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. MECEE-BL 2024 (MBBS/BDS)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Year
              </label>
              <input
                type="text"
                required
                value={examYear}
                onChange={(e) => setExamYear(e.target.value)}
                placeholder="2024"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Program
              </label>
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900"
              >
                <option value="MBBS / BDS">MBBS / BDS</option>
                <option value="B.Sc Nursing / Allied">B.Sc Nursing / Allied</option>
                <option value="BAMS">BAMS</option>
                <option value="B.Pharm">B.Pharm</option>
                <option value="MD / MS">MD / MS (Postgraduate)</option>
                <option value="All Programs">All Programs</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !examName.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0f2942] hover:bg-[#163b5f] disabled:opacity-50 shadow-md"
            >
              {loading ? 'Creating...' : 'Create Dataset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DeleteExamModal({ examination, isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !examination) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.deleteExamination(examination.id);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to delete examination dataset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold text-slate-900">Delete Examination Dataset?</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Are you sure you want to permanently delete <span className="font-semibold text-slate-800">{examination.examination_name}</span>? All {examination.total_records} extracted candidate records will be permanently removed.
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 shadow-md flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
