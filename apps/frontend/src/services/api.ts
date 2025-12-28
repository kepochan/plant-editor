import type {
  DiagramResponse,
  CommentsResponse,
  CommentsByVersionResponse,
  Comment,
  DiagramListItem,
  DiagramVersion,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY || 'dev-api-key';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // ===== New REST API =====

  // Diagrams
  listDiagrams: (search?: string): Promise<DiagramListItem[]> =>
    fetchApi(`/diagrams${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  createDiagram: (): Promise<DiagramListItem> =>
    fetchApi('/diagrams', { method: 'POST' }),

  getDiagramById: (id: string): Promise<DiagramResponse> =>
    fetchApi(`/diagrams/${id}`),

  deleteDiagram: (id: string): Promise<{ success: boolean; message: string }> =>
    fetchApi(`/diagrams/${id}`, { method: 'DELETE' }),

  renameDiagram: (id: string, name: string): Promise<{ success: boolean; name: string }> =>
    fetchApi(`/diagrams/${id}/name`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  updateDiagramCode: (id: string, code: string): Promise<DiagramResponse> =>
    fetchApi(`/diagrams/${id}/code`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  // Versions
  getVersions: (diagramId: string): Promise<DiagramVersion[]> =>
    fetchApi(`/diagrams/${diagramId}/versions`),

  restoreVersion: (diagramId: string, versionNumber: number): Promise<DiagramResponse> =>
    fetchApi(`/diagrams/${diagramId}/restore/${versionNumber}`, { method: 'POST' }),

  // Comments (new API)
  getCommentsByDiagram: (diagramId: string): Promise<CommentsResponse> =>
    fetchApi(`/diagrams/${diagramId}/comments`),

  getCommentsByVersion: (diagramId: string): Promise<CommentsByVersionResponse> =>
    fetchApi(`/diagrams/${diagramId}/comments/by-version`),

  addCommentToDiagram: (
    diagramId: string,
    text: string,
    startLine: number,
    endLine: number,
    author?: string
  ): Promise<Comment> =>
    fetchApi(`/diagrams/${diagramId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, startLine, endLine, author }),
    }),

  deleteCommentFromDiagram: (
    diagramId: string,
    commentId: string
  ): Promise<{ success: boolean; message: string }> =>
    fetchApi(`/diagrams/${diagramId}/comments/${commentId}`, {
      method: 'DELETE',
    }),

  clearCommentsFromDiagram: (
    diagramId: string
  ): Promise<{ success: boolean; message: string }> =>
    fetchApi(`/diagrams/${diagramId}/comments`, {
      method: 'DELETE',
    }),

  markCommentProcessedInDiagram: (
    diagramId: string,
    commentId: string
  ): Promise<{ success: boolean; comment: Comment; message: string }> =>
    fetchApi(`/diagrams/${diagramId}/comments/${commentId}/processed`, {
      method: 'PATCH',
    }),

  // ===== Legacy API (backward compatibility) =====

  getDiagram: (sessionId: string): Promise<DiagramResponse> =>
    fetchApi(`/diagram?sessionId=${sessionId}`),

  updateDiagram: (
    sessionId: string,
    code: string
  ): Promise<DiagramResponse> =>
    fetchApi('/diagram', {
      method: 'POST',
      body: JSON.stringify({ sessionId, code }),
    }),

  getComments: (sessionId: string): Promise<CommentsResponse> =>
    fetchApi(`/comments?sessionId=${sessionId}`),

  addComment: (
    sessionId: string,
    text: string,
    startLine: number,
    endLine: number,
    author?: string
  ): Promise<Comment> =>
    fetchApi('/comments', {
      method: 'POST',
      body: JSON.stringify({ sessionId, text, startLine, endLine, author }),
    }),

  deleteComment: (
    sessionId: string,
    commentId: string
  ): Promise<{ success: boolean; message: string }> =>
    fetchApi(`/comments/${commentId}?sessionId=${sessionId}`, {
      method: 'DELETE',
    }),

  clearComments: (
    sessionId: string
  ): Promise<{ success: boolean; message: string }> =>
    fetchApi(`/comments?sessionId=${sessionId}`, {
      method: 'DELETE',
    }),

  markCommentAsProcessed: (
    sessionId: string,
    commentId: string
  ): Promise<{ success: boolean; comment: Comment; message: string }> =>
    fetchApi(`/comments/${commentId}/processed?sessionId=${sessionId}`, {
      method: 'PATCH',
    }),
};

export { API_URL };
