import { create } from 'zustand';
import type { Comment, DiagramVersion } from '../types';
import { api } from '../services/api';

interface EditorState {
  // Diagram
  diagramId: string | null;
  name: string;
  code: string;
  previousCode: string | null;
  imageUrl: string | null;
  svgUrl: string | null;
  version: number;

  // Versions
  versions: DiagramVersion[];

  // Comments
  comments: Comment[];

  // UI state
  isEditorVisible: boolean;
  isViewerVisible: boolean;
  isDiffVisible: boolean;
  isVersionsPanelVisible: boolean;
  selectedLines: { start: number; end: number } | null;
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark';

  // Panel sizes (percentages)
  editorHeightPercent: number;
  commentsPanelWidth: number;

  // Zoom state
  scale: number;
  fitToWidthTrigger: number;

  // Actions
  setDiagramId: (id: string) => void;
  setCode: (code: string) => void;
  setScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  triggerFitToWidth: () => void;
  updateDiagram: () => Promise<void>;
  fetchDiagram: () => Promise<void>;
  fetchComments: () => Promise<void>;
  fetchVersions: () => Promise<void>;
  restoreVersion: (versionNumber: number) => Promise<void>;
  addComment: (text: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  markCommentAsProcessed: (id: string) => Promise<void>;
  clearComments: () => Promise<void>;
  toggleEditor: () => void;
  toggleViewer: () => void;
  toggleDiff: () => void;
  toggleVersionsPanel: () => void;
  setSelectedLines: (lines: { start: number; end: number } | null) => void;
  setEditorHeightPercent: (percent: number) => void;
  setCommentsPanelWidth: (width: number) => void;
  toggleTheme: () => void;
  copyCode: () => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  diagramId: null,
  name: '',
  code: '',
  previousCode: null,
  imageUrl: null,
  svgUrl: null,
  version: 0,
  versions: [],
  comments: [],
  isEditorVisible: false,
  isViewerVisible: true,
  isDiffVisible: false,
  isVersionsPanelVisible: true,
  selectedLines: null,
  isLoading: false,
  error: null,
  theme: (localStorage.getItem('plant-editor-theme') as 'light' | 'dark') || 'dark',
  editorHeightPercent: 50,
  commentsPanelWidth: 320,
  scale: 0.75,
  fitToWidthTrigger: 0,

  // Actions
  setDiagramId: (id) => set({ diagramId: id }),

  setCode: (code) => set({ code }),

  setScale: (scale) => set({ scale: Math.max(0.25, Math.min(3, scale)) }),
  zoomIn: () => set((state) => ({ scale: Math.min(state.scale + 0.25, 3) })),
  zoomOut: () => set((state) => ({ scale: Math.max(state.scale - 0.25, 0.25) })),
  resetZoom: () => set({ scale: 0.75 }),
  triggerFitToWidth: () => set((state) => ({ fitToWidthTrigger: state.fitToWidthTrigger + 1 })),

  updateDiagram: async () => {
    const { diagramId, code } = get();
    if (!diagramId || !code.trim()) return;

    set({ isLoading: true, error: null });
    try {
      const response = await api.updateDiagramCode(diagramId, code);
      set({
        imageUrl: response.imageUrl,
        svgUrl: response.svgUrl,
        previousCode: response.previousCode,
        version: response.version,
        isLoading: false,
      });
      // Refresh versions after update
      get().fetchVersions();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update diagram',
        isLoading: false,
      });
    }
  },

  fetchDiagram: async () => {
    const { diagramId } = get();
    if (!diagramId) return;

    set({ isLoading: true, error: null });
    try {
      const response = await api.getDiagramById(diagramId);
      set({
        name: response.name || '',
        code: response.code,
        imageUrl: response.imageUrl,
        svgUrl: response.svgUrl,
        previousCode: response.previousCode,
        version: response.version,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch diagram',
        isLoading: false,
      });
    }
  },

  fetchComments: async () => {
    const { diagramId } = get();
    if (!diagramId) return;

    try {
      const response = await api.getCommentsByDiagram(diagramId);
      set({ comments: response.comments });
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  },

  fetchVersions: async () => {
    const { diagramId } = get();
    if (!diagramId) return;

    try {
      const versions = await api.getVersions(diagramId);
      set({ versions });
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    }
  },

  restoreVersion: async (versionNumber) => {
    const { diagramId } = get();
    if (!diagramId) return;

    set({ isLoading: true, error: null });
    try {
      const response = await api.restoreVersion(diagramId, versionNumber);
      set({
        code: response.code,
        imageUrl: response.imageUrl,
        svgUrl: response.svgUrl,
        previousCode: response.previousCode,
        version: response.version,
        isLoading: false,
      });
      // Refresh versions after restore
      get().fetchVersions();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to restore version',
        isLoading: false,
      });
    }
  },

  addComment: async (text) => {
    const { diagramId, selectedLines } = get();
    if (!diagramId || !selectedLines) return;

    try {
      const comment = await api.addCommentToDiagram(
        diagramId,
        text,
        selectedLines.start,
        selectedLines.end
      );
      set((state) => ({
        comments: [...state.comments, comment],
        selectedLines: null,
      }));
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  },

  deleteComment: async (id) => {
    const { diagramId } = get();
    if (!diagramId) return;

    try {
      await api.deleteCommentFromDiagram(diagramId, id);
      set((state) => ({
        comments: state.comments.filter((c) => c.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  },

  markCommentAsProcessed: async (id) => {
    const { diagramId } = get();
    if (!diagramId) return;

    try {
      await api.markCommentProcessedInDiagram(diagramId, id);
      set((state) => ({
        comments: state.comments.map((c) =>
          c.id === id ? { ...c, processed: true, processedInVersion: state.version } : c
        ),
      }));
    } catch (error) {
      console.error('Failed to mark comment as processed:', error);
    }
  },

  clearComments: async () => {
    const { diagramId } = get();
    if (!diagramId) return;

    try {
      await api.clearCommentsFromDiagram(diagramId);
      set({ comments: [] });
    } catch (error) {
      console.error('Failed to clear comments:', error);
    }
  },

  toggleEditor: () => set((state) => ({
    isEditorVisible: !state.isEditorVisible,
    isDiffVisible: !state.isEditorVisible ? false : state.isDiffVisible,
  })),

  toggleViewer: () => set((state) => ({
    isViewerVisible: !state.isViewerVisible,
  })),

  toggleVersionsPanel: () => set((state) => ({
    isVersionsPanelVisible: !state.isVersionsPanelVisible,
  })),

  toggleDiff: () => set((state) => ({
    isDiffVisible: !state.isDiffVisible,
    isEditorVisible: !state.isDiffVisible ? false : state.isEditorVisible,
  })),

  setSelectedLines: (lines) => set({ selectedLines: lines }),

  setEditorHeightPercent: (percent) => set({ editorHeightPercent: Math.max(20, Math.min(80, percent)) }),

  setCommentsPanelWidth: (width) => set({ commentsPanelWidth: Math.max(200, Math.min(600, width)) }),

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('plant-editor-theme', newTheme);
    set({ theme: newTheme });
  },

  copyCode: () => {
    const { code } = get();
    navigator.clipboard.writeText(code);
  },

  reset: () => {
    set({
      diagramId: null,
      name: '',
      code: '',
      previousCode: null,
      imageUrl: null,
      svgUrl: null,
      version: 0,
      versions: [],
      comments: [],
      selectedLines: null,
    });
  },
}));
