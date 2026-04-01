// ─── File System (spec section 13) ──────────────────────────────────

export interface File {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  channelId: string | null;
  folderId: string | null;
  clubId: string;
  uploadedById: string;
  createdAt: string;
}

// Spec: "folder creation (board/admin only)"
export interface FileFolder {
  id: string;
  name: string;
  channelId: string | null;
  clubId: string;
  createdById: string;
  createdAt: string;
}
