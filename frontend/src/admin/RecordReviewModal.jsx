import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, CheckCircle, Search, Edit2, Save, 
  ExternalLink, FileText, Check, ShieldAlert, Filter, Eye
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RecordReviewModal({ examination, isOpen, onClose, onRecordsUpdated }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all', 'flagged', 'verified'
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen && examination) {
      loadRecords();
    }
  }, [isOpen, examination]);

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await api.getExaminationRecords(examination.id);
      setRecords(data.records || []);
    } catch (err) {
      console.error('Failed to load examination records:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !examination) return null;

  // Filter records
  const filteredRecords = records.filter((r) => {
    // Filter by flagged / verified
    if (filterType === 'flagged' && !r.is_flagged_for_review) return false;
    if (filterType === 'verified' && r.is_flagged_for_review) return false;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const symbol = (r.symbol_number || '').toLowerCase();
      const name = (r.student_name || '').toLowerCase();
      return symbol.includes(q) || name.includes(q);
    }
    return true;
  });

  const totalCount = records.length;
  const flaggedCount = records.filter((r) => r.is_flagged_for_review).length;
  const verifiedCount = totalCount - flaggedCount;

  const startEdit = (rec) => {
    setEditingRecordId(rec.id);
    setEditForm({
      symbol_number: rec.symbol_number,
      student_name: rec.student_name || '',
      score: rec.score !== null ? rec.score : '',
      rank: rec.rank !== null ? rec.rank : '',
      qualification_status: rec.qualification_status || 'Qualified',
      category: rec.category || '',
      is_flagged_for_review: rec.is_flagged_for_review,
      review_notes: rec.review_notes || ''
    });
  };

  const cancelEdit = () => {
    setEditingRecordId(null);
    setEditForm({});
  };

  const handleSaveEdit = async (recordId) => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const payload = {
        symbol_number: editForm.symbol_number.trim(),
        student_name: editForm.student_name.trim() || null,
        score: editForm.score !== '' ? parseFloat(editForm.score) : null,
        rank: editForm.rank !== '' ? parseInt(editForm.rank, 10) : null,
        qualification_status: editForm.qualification_status,
        category: editForm.category.trim() || null,
        is_flagged_for_review: editForm.is_flagged_for_review,
        review_notes: editForm.review_notes.trim() || null
      };

      const res = await api.updateStudentRecord(recordId, payload);
      // Update local state
      setRecords((prev) => prev.map((r) => (r.id === recordId ? res.record : r)));
      setEditingRecordId(null);
      setStatusMsg({ type: 'success', text: `Record ${payload.symbol_number} updated and saved.` });
      if (onRecordsUpdated) onRecordsUpdated();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save record changes.' });
    } finally {
      setSaving(false);
    }
  };

  const markAsVerified = async (rec) => {
    try {
      const payload = {
        ...rec,
        is_flagged_for_review: false,
        review_notes: null
      };
      const res = await api.updateStudentRecord(rec.id, payload);
      setRecords((prev) => prev.map((r) => (r.id === rec.id ? res.record : r)));
      setStatusMsg({ type: 'success', text: `Symbol ${rec.symbol_number} verified successfully.` });
      if (onRecordsUpdated) onRecordsUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-6xl w-full h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                Review & Verify Candidate Records
              </h3>
              <StatusBadge status={examination.publication_status} type="publication" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {examination.examination_name} ({examination.examination_year}) • Source PDF: {examination.source_pdf_filename || 'Uploaded PDF'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {examination.source_pdf_url && (
              <a
                href={examination.source_pdf_url}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>View Source PDF</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div className={`px-6 py-2 text-xs font-semibold flex items-center justify-between ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
          }`}>
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Filters & Statistics Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Metrics summary */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Records ({totalCount})
            </button>
            <button
              onClick={() => setFilterType('flagged')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                filterType === 'flagged'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Needs Review ({flaggedCount})</span>
            </button>
            <button
              onClick={() => setFilterType('verified')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                filterType === 'verified'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verified ({verifiedCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbol or name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-20">
              <LoadingSpinner text="Loading candidate records..." />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              No student records found matching the active filter.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5">Symbol No</th>
                    <th className="py-3 px-3.5">Candidate Name</th>
                    <th className="py-3 px-3.5 text-center">Score</th>
                    <th className="py-3 px-3.5 text-center">Rank</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5">Category</th>
                    <th className="py-3 px-3.5">OCR / Flags</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredRecords.map((rec) => {
                    const isEditing = editingRecordId === rec.id;
                    const isFlagged = rec.is_flagged_for_review;

                    return (
                      <tr
                        key={rec.id}
                        className={`transition ${
                          isFlagged
                            ? 'bg-amber-50/40 hover:bg-amber-50/70'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Symbol Number */}
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900 tracking-wider">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.symbol_number}
                              onChange={(e) => setEditForm({ ...editForm, symbol_number: e.target.value })}
                              className="font-mono bg-white border border-blue-400 rounded px-2 py-1 text-xs w-24"
                            />
                          ) : (
                            rec.symbol_number
                          )}
                        </td>

                        {/* Name */}
                        <td className="py-3 px-3.5 font-medium text-slate-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.student_name}
                              onChange={(e) => setEditForm({ ...editForm, student_name: e.target.value })}
                              className="bg-white border border-blue-400 rounded px-2 py-1 text-xs w-44"
                            />
                          ) : (
                            rec.student_name || <span className="text-slate-400 italic">Unpublished</span>
                          )}
                        </td>

                        {/* Score */}
                        <td className="py-3 px-3.5 text-center font-mono font-semibold">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.score}
                              onChange={(e) => setEditForm({ ...editForm, score: e.target.value })}
                              className="bg-white border border-blue-400 rounded px-1.5 py-1 text-xs w-16 text-center"
                            />
                          ) : (
                            rec.score !== null ? Number(rec.score).toFixed(2) : '-'
                          )}
                        </td>

                        {/* Rank */}
                        <td className="py-3 px-3.5 text-center font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editForm.rank}
                              onChange={(e) => setEditForm({ ...editForm, rank: e.target.value })}
                              className="bg-white border border-blue-400 rounded px-1.5 py-1 text-xs w-16 text-center"
                            />
                          ) : (
                            rec.rank !== null ? `#${rec.rank}` : '-'
                          )}
                        </td>

                        {/* Qualification Status */}
                        <td className="py-3 px-3.5">
                          {isEditing ? (
                            <select
                              value={editForm.qualification_status}
                              onChange={(e) => setEditForm({ ...editForm, qualification_status: e.target.value })}
                              className="bg-white border border-blue-400 rounded px-2 py-1 text-xs"
                            >
                              <option value="Qualified">Qualified</option>
                              <option value="Not Qualified">Not Qualified</option>
                              <option value="Eligible">Eligible</option>
                              <option value="Withheld">Withheld</option>
                            </select>
                          ) : (
                            <StatusBadge status={rec.qualification_status} />
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3.5 text-slate-600">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="bg-white border border-blue-400 rounded px-2 py-1 text-xs w-28"
                            />
                          ) : (
                            rec.category || '-'
                          )}
                        </td>

                        {/* Flags / Notes */}
                        <td className="py-3 px-3.5 max-w-xs">
                          {isFlagged ? (
                            <div className="flex items-start gap-1.5 text-[11px] text-amber-800">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">{rec.review_notes || 'Flagged for review'}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right space-x-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(rec.id)}
                                disabled={saving}
                                className="px-2.5 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 text-xs inline-flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" /> Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 text-xs"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {isFlagged && (
                                <button
                                  onClick={() => markAsVerified(rec)}
                                  className="px-2 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 inline-flex items-center gap-1"
                                  title="Approve / Clear flag"
                                >
                                  <Check className="w-3 h-3" /> Verify
                                </button>
                              )}
                              <button
                                onClick={() => startEdit(rec)}
                                className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                                title="Edit Record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
          <div className="text-xs text-slate-500">
            {flaggedCount > 0 ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                {flaggedCount} record(s) currently flagged. Review and verify before publishing.
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                All {totalCount} records are verified and ready for publication.
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-2xs"
          >
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
}
