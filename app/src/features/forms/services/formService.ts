import api from '../../../lib/api';
import type { FormSubmission } from '@tennis-club/shared';

export const formService = {
  submitCourtDamage: (formData: FormData) =>
    api.post<{ data: FormSubmission }>('/forms/court-damage', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data),

  getMyReports: () =>
    api.get<{ data: FormSubmission[] }>('/forms/court-damage', { params: { mine: true } })
      .then(r => r.data.data),

  submitMediaUpload: (formData: FormData) =>
    api.post<{ data: FormSubmission }>('/forms/media-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data),

  getCourtDamageStatus: (formId: string) =>
    api.get<{ data: FormSubmission }>(`/forms/court-damage/${formId}/status`)
      .then(r => r.data.data),
};
