import api from '../../../lib/api';
import { ENDPOINTS } from '../../../lib/endpoints';
import type { FormSubmission } from '@tennis-club/shared';

export const formService = {
  submitCourtDamage: (formData: FormData) =>
    api
      .post<{ data: FormSubmission }>(ENDPOINTS.forms.courtDamage, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data),

  getMyReports: () =>
    api
      .get<{ data: FormSubmission[] }>(ENDPOINTS.forms.courtDamage, { params: { mine: true } })
      .then((r) => r.data.data),

  submitMediaUpload: (formData: FormData) =>
    api
      .post<{ data: FormSubmission }>(ENDPOINTS.forms.mediaUpload, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data),

  getCourtDamageStatus: (formId: string) =>
    api
      .get<{ data: FormSubmission }>(ENDPOINTS.forms.courtDamageStatus(formId))
      .then((r) => r.data.data),
};
