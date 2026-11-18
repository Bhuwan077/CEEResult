/**
 * Unified API Client for Nepal CEE Result Checker
 */

import { authService } from './auth';

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const headers = { ...options.headers };

  // If payload is not FormData, set Content-Type to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Inject Bearer token if available
  const token = authService.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = data?.detail || data?.error || res.statusText || 'Request failed';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Public Student Search
  searchResult: async (symbolNumber, examinationId = null) => {
    return request('/search', {
      method: 'POST',
      body: JSON.stringify({
        symbol_number: symbolNumber.trim(),
        examination_id: examinationId || undefined,
      }),
    });
  },

  // Public Examinations
  getPublishedExaminations: async () => {
    return request('/examinations');
  },

  // Admin Authentication
  adminLogin: async (username, password) => {
    return request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  getAdminProfile: async () => {
    return request('/admin/me');
  },

  // Admin Examination Management
  getAdminExaminations: async () => {
    return request('/admin/examinations');
  },

  createExamination: async (examData) => {
    return request('/admin/examinations', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  },

  // PDF Upload & Processing
  uploadResultPdf: async (examinationId, file, forceOcr = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('force_ocr', forceOcr ? 'true' : 'false');

    return request(`/admin/examinations/${examinationId}/upload`, {
      method: 'POST',
      body: formData,
    });
  },

  // Examination Records Review & Correction
  getExaminationRecords: async (examinationId) => {
    return request(`/admin/examinations/${examinationId}/records`);
  },

  updateStudentRecord: async (recordId, updates) => {
    return request(`/admin/records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  importRecords: async (examinationId, records, publishNow = false) => {
    return request(`/admin/examinations/${examinationId}/import`, {
      method: 'POST',
      body: JSON.stringify({
        examination_id: examinationId,
        records,
        publish_now: publishNow,
      }),
    });
  },

  // Publication Toggle & Dataset Operations
  updatePublicationStatus: async (examinationId, status) => {
    return request(`/admin/examinations/${examinationId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  deleteExamination: async (examinationId) => {
    return request(`/admin/examinations/${examinationId}`, {
      method: 'DELETE',
    });
  },
};
