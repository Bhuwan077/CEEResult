import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, X, Sparkles, Layers } from 'lucide-react';
import { api } from '../services/api';

export default function PdfUploader({ examination, isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [forceOcr, setForceOcr] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  if (!isOpen || !examination) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a valid PDF file (.pdf).');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selected);
      setUploadResult(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || uploading) return;

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const res = await api.uploadResultPdf(examination.id, file, forceOcr);
      setUploadResult(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload and process PDF.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Upload Examination Result PDF</h3>
            <p className="text-xs text-slate-500">
              Exam: {examination.examination_name} ({examination.examination_year})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Success Report */}
        {uploadResult && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Processing Complete!</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white/80 border border-emerald-100">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">PDF Type</span>
                <span className="font-semibold text-slate-900">
                  {uploadResult.is_searchable ? 'Searchable' : 'Scanned/OCR'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 border border-emerald-100">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Records</span>
                <span className="font-bold text-slate-900">{uploadResult.total_records}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 border border-emerald-100">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Verified</span>
                <span className="font-bold text-emerald-700">{uploadResult.verified_records}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 border border-emerald-100">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Flagged</span>
                <span className={`font-bold ${uploadResult.flagged_records > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                  {uploadResult.flagged_records}
                </span>
              </div>
            </div>
            <p className="text-xs text-emerald-800">
              Records are currently in <span className="font-semibold">Reviewing</span> state. Please review and approve records before publishing to public search.
            </p>
          </div>
        )}

        {!uploadResult && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* File Dropzone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 sm:p-8 text-center transition bg-slate-50/50 hover:bg-blue-50/20">
              <input
                type="file"
                id="pdf-file-input"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="pdf-file-input" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 rounded-2xl bg-blue-100/70 text-blue-700 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-blue-700 hover:underline">
                    Click to browse PDF
                  </span>
                  <span className="text-slate-500 text-sm"> or drag and drop</span>
                </div>
                <p className="text-xs text-slate-400">
                  Accepts searchable or scanned CEE merit list PDFs (up to 50MB)
                </p>
              </label>

              {file && (
                <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200 inline-flex items-center gap-2.5 text-xs font-medium text-slate-700 shadow-2xs">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="max-w-xs truncate">{file.name}</span>
                  <span className="text-slate-400">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              )}
            </div>

            {/* Force OCR Option */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" /> Force OCR Processing
                </span>
                <p className="text-slate-500 text-[11px]">
                  Ignore embedded digital text layer and run full raster Tesseract OCR.
                </p>
              </div>
              <input
                type="checkbox"
                checked={forceOcr}
                onChange={(e) => setForceOcr(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || uploading}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0f2942] hover:bg-[#163b5f] disabled:opacity-50 transition flex items-center gap-2 shadow-md"
              >
                {uploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing PDF & Extracting Records...</span>
                  </>
                ) : (
                  <span>Upload & Process Result</span>
                )}
              </button>
            </div>
          </form>
        )}

        {uploadResult && (
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0f2942] hover:bg-[#163b5f] transition"
            >
              Done & Review Records
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
