// ─── Forms (spec section 14) ────────────────────────────────────────

export enum FormType {
  COURT_DAMAGE = 'COURT_DAMAGE',
  MEDIA_UPLOAD = 'MEDIA_UPLOAD',
}

export enum Urgency {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum FormSubmissionStatus {
  SUBMITTED = 'submitted',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
}

// Spec section 14: Court Damage Report fields
export interface CourtDamageData {
  courtNumber: string;
  description: string;
  photoUrl: string;
  urgency: Urgency;
}

// Spec section 14: Media Upload fields
export interface MediaUploadData {
  mediaUrls: string[];
  category: string;
  tag: string;
}

export interface FormSubmission {
  id: string;
  type: FormType;
  data: CourtDamageData | MediaUploadData;
  clubId: string;
  submittedById: string;
  todoId: string | null;
  status: FormSubmissionStatus;
  createdAt: string;
  updatedAt: string;
}
