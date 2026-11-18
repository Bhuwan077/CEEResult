import React, { useState, useEffect } from 'react';
import { 
  Plus, Upload, CheckCircle2, AlertTriangle, FileText, 
  Trash2, Eye, LogOut, RefreshCw, Globe, Shield, BookOpen
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import PdfUploader from './PdfUploader';
import RecordReviewModal from './RecordReviewModal';
import { CreateExamModal, DeleteExamModal } from './DatasetManager';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [examinations, setExaminations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeUploadExam, setActiveUploadExam] = useState(null);
  const [activeReviewExam, setActiveReviewExam] = useState(null);
  const [activeDeleteExam, setActiveDeleteExam] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    loadExaminations();
  }, []);

  async function loadExaminations() {
    setLoading(true);
    try {
      const data = await api.getAdminExaminations();
      setExaminations(data);
    } catch (err) {
      console.error('Failed to load examinations:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleTogglePublish = async (exam) => {
    const newStatus = exam.publication_status === 'published' ? 'draft' : 'published';
    
    // Safety check: if publishing and there are flagged records, warn admin
    if (newStatus === 'published' && exam.flagged_records > 0) {
      const proceed = window.confirm(
        `This dataset currently has ${exam.flagged_records} record(s) flagged for manual verification. Are you sure you want to publish without resolving these flags?`
      );
      if (!proceed) return;
    }

    try {
      await api.updatePublicationStatus(exam.id, newStatus);
      loadExaminations();
    } catch (err) {
      alert(err.message || 'Failed to update publication status.');
    }
  };

  // Metrics computation
  const totalDatasets = examinations.length;
  const totalRecords = examinations.reduce((acc, curr) => acc + (curr.total_records || 0), 0);
  const totalVerified = examinations.reduce((acc, curr) => acc + (curr.verified_records || 0), 0);
  const totalFlagged = examinations.reduce((acc, curr) => acc + (curr.flagged_records || 0), 0);

  return (
    <div className="flex-1 bg-slate-100/60 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Bar with Admin Profile */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Controller Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f2942] tracking-tight">
              CEE Examination Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Logged in as <strong className="text-slate-800">{user?.full_name || 'CEE Administrator'}</strong> ({user?.username})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0f2942] hover:bg-[#163b5f] transition shadow-md shadow-slate-900/10"
            >
              <Plus className="w-4 h-4" />
              <span>New Examination Dataset</span>
            </button>

            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 transition shadow-2xs"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Datasets</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">{totalDatasets}</p>
            <p className="text-[11px] text-slate-400">CEE entrance programs</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Records</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono">{totalRecords}</p>
            <p className="text-[11px] text-slate-400">Indexed student scores</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Records</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">{totalVerified}</p>
            <p className="text-[11px] text-slate-400">Clean & confidence checked</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Flagged for Review
            </span>
            <p className={`text-2xl sm:text-3xl font-extrabold font-mono ${totalFlagged > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {totalFlagged}
            </p>
            <p className="text-[11px] text-slate-400">Require human sign-off</p>
          </div>
        </div>

        {/* Examinations Table Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Examination Result Datasets</h2>
              <p className="text-xs text-slate-500">
                Upload official PDFs, inspect OCR confidence, verify records, and toggle public visibility.
              </p>
            </div>
            <button
              onClick={loadExaminations}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Refresh datasets"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-20">
              <LoadingSpinner text="Loading examinations..." />
            </div>
          ) : examinations.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-600">No examination datasets created yet.</p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0f2942]"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Dataset</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">Examination</th>
                    <th className="py-3.5 px-5">Program</th>
                    <th className="py-3.5 px-5">Source PDF</th>
                    <th className="py-3.5 px-5 text-center">Records</th>
                    <th className="py-3.5 px-5">Publication Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {examinations.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50/70 transition">
                      {/* Examination Title & Year */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-sm">{exam.examination_name}</div>
                        <div className="text-[11px] text-slate-400">Year: {exam.examination_year}</div>
                      </td>

                      {/* Program */}
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-800">{exam.program}</span>
                      </td>

                      {/* Source PDF */}
                      <td className="py-4 px-5">
                        {exam.source_pdf_filename ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-700 max-w-[180px] truncate block">
                              <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                              {exam.source_pdf_filename}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-600">
                              {exam.is_searchable_pdf ? 'Text Layer' : 'Scanned (OCR)'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No PDF Uploaded</span>
                        )}
                      </td>

                      {/* Records Count Breakdown */}
                      <td className="py-4 px-5 text-center">
                        <div className="font-bold font-mono text-slate-900 text-sm">
                          {exam.total_records}
                        </div>
                        <div className="text-[10px] text-slate-400 space-x-1">
                          <span className="text-emerald-700 font-semibold">{exam.verified_records} OK</span>
                          {exam.flagged_records > 0 && (
                            <span className="text-amber-600 font-semibold">• {exam.flagged_records} Flagged</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={exam.publication_status} type="publication" />
                          <button
                            onClick={() => handleTogglePublish(exam)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                              exam.publication_status === 'published'
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {exam.publication_status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-5 text-right space-x-2">
                        <button
                          onClick={() => setActiveUploadExam(exam)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 shadow-2xs"
                          title="Upload or Replace PDF"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>

                        <button
                          onClick={() => setActiveReviewExam(exam)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-2xs ${
                            exam.flagged_records > 0
                              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                          title="Review and Correct Records"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review ({exam.total_records})</span>
                        </button>

                        <button
                          onClick={() => setActiveDeleteExam(exam)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Dataset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateExamModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => loadExaminations()}
      />

      <PdfUploader
        examination={activeUploadExam}
        isOpen={!!activeUploadExam}
        onClose={() => setActiveUploadExam(null)}
        onSuccess={() => loadExaminations()}
      />

      <RecordReviewModal
        examination={activeReviewExam}
        isOpen={!!activeReviewExam}
        onClose={() => setActiveReviewExam(null)}
        onRecordsUpdated={() => loadExaminations()}
      />

      <DeleteExamModal
        examination={activeDeleteExam}
        isOpen={!!activeDeleteExam}
        onClose={() => setActiveDeleteExam(null)}
        onSuccess={() => loadExaminations()}
      />
    </div>
  );
}
