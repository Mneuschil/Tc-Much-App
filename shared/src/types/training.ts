// ─── Training System (spec section 11) ──────────────────────────────

// Spec: "attendance (yes/no)", "deadline (5h before)", "reminder if no response"
export interface TrainingAttendance {
  id: string;
  eventId: string;
  userId: string;
  attending: boolean | null; // null = no response yet
  deadlineAt: string;        // 5h before event start
  createdAt: string;
  updatedAt: string;
}
