export interface Comment {
  id: string;
  text: string;
  startLine: number;
  endLine: number;
  codeSnapshot: string;
  createdAt: string;
  author?: string;
  processed: boolean;
  processedInVersion?: number | null;
}

export interface HistoryEntry {
  code: string;
  timestamp: string;
  version: number;
}

export interface DiagramVersion {
  id: string;
  versionNumber: number;
  code: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface DiagramListItem {
  id: string;
  name: string;
  currentVersion: number;
  versionsCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  imageUrl: string | null;
}

export interface DiagramResponse {
  success?: boolean;
  id?: string;
  name?: string;
  code: string;
  imageUrl: string | null;
  svgUrl: string | null;
  previousCode: string | null;
  version: number;
  history?: HistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CommentsResponse {
  comments: Comment[];
}

export interface CommentsByVersionResponse {
  pending: Comment[];
  byVersion: Record<string, Comment[]>;
}
