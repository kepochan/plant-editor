import { useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEditorStore } from '../store/useEditorStore';
import { useSSE } from '../hooks/useSSE';
import { DiagramViewer } from './DiagramViewer';
import { CodeEditor } from './CodeEditor';
import { DiffViewer } from './DiffViewer';
import { CommentsPanel } from './CommentsPanel';
import { ExportButtons } from './ExportButtons';
import { ThemeToggle } from './ThemeToggle';
import {
  Code,
  Image,
  GitCompare,
  History,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
} from 'lucide-react';

export function Layout() {
  const { id } = useParams<{ id: string }>();

  const {
    theme,
    diagramId,
    name,
    isEditorVisible,
    isViewerVisible,
    isDiffVisible,
    isLoading,
    error,
    toggleEditor,
    toggleViewer,
    toggleDiff,
    toggleVersionsPanel,
    isVersionsPanelVisible,
    fetchDiagram,
    fetchComments,
    fetchVersions,
    setDiagramId,
    updateDiagram,
    code,
    scale,
    zoomIn,
    zoomOut,
    resetZoom,
    triggerFitToWidth,
    editorHeightPercent,
    setEditorHeightPercent,
    commentsPanelWidth,
    setCommentsPanelWidth,
  } = useEditorStore();

  // Set diagram ID from route and fetch data
  useEffect(() => {
    if (id && id !== diagramId) {
      setDiagramId(id);
    }
  }, [id, diagramId, setDiagramId]);

  // Subscribe to SSE for live updates
  useSSE();

  useEffect(() => {
    if (diagramId) {
      fetchDiagram();
      fetchComments();
      fetchVersions();
    }
  }, [diagramId, fetchDiagram, fetchComments, fetchVersions]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Refs for resize handling
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const isResizingVertical = useRef(false);
  const isResizingHorizontal = useRef(false);

  // Vertical resize handler (between viewer and editor)
  const handleVerticalResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingVertical.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingVertical.current || !mainContainerRef.current) return;
      const containerRect = mainContainerRef.current.getBoundingClientRect();
      const newPercent = ((e.clientY - containerRect.top) / containerRect.height) * 100;
      setEditorHeightPercent(100 - newPercent);
    };

    const handleMouseUp = () => {
      isResizingVertical.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [setEditorHeightPercent]);

  // Horizontal resize handler (comments panel width)
  const handleHorizontalResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingHorizontal.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingHorizontal.current) return;
      const newWidth = window.innerWidth - e.clientX;
      setCommentsPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingHorizontal.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [setCommentsPanelWidth]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="hover:opacity-80 transition-opacity"
              title="Retour à la liste des diagrammes"
            >
              <h1 className="text-lg font-bold">{name || 'PlantUML Editor'}</h1>
            </Link>
            <div className="flex gap-2">
              <button
                onClick={toggleViewer}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                  isViewerVisible
                    ? 'bg-blue-500 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Image size={16} />
                View
              </button>
              <button
                onClick={toggleEditor}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                  isEditorVisible
                    ? 'bg-blue-500 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Code size={16} />
                Code
              </button>
              <button
                onClick={toggleDiff}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                  isDiffVisible
                    ? 'bg-blue-500 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                <GitCompare size={16} />
                Diff
              </button>
              <button
                onClick={toggleVersionsPanel}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                  isVersionsPanelVisible
                    ? 'bg-blue-500 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                <History size={16} />
                Versions
              </button>
            </div>

            {/* Zoom Controls */}
            <div className={`flex items-center gap-1 px-2 border-l ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
              <button
                onClick={zoomOut}
                className={`p-1.5 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
              <button
                onClick={zoomIn}
                className={`p-1.5 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={resetZoom}
                className={`p-1.5 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="Reset (75%)"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={triggerFitToWidth}
                className={`p-1.5 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="Fit to width"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => updateDiagram()}
              disabled={isLoading || !code.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Render
            </button>

            <ExportButtons />
            <ThemeToggle />
          </div>
        </div>
        {error && (
          <div className="mt-2 text-red-500 text-sm">{error}</div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex h-[calc(100vh-60px)]">
        {/* Left Panel - Diagram & Editor */}
        <div ref={mainContainerRef} className="flex-1 flex flex-col overflow-hidden">
          {/* Diagram Viewer */}
          {isViewerVisible && (
            <div
              className="overflow-auto"
              style={{
                height: (isEditorVisible || isDiffVisible) ? `${100 - editorHeightPercent}%` : '100%',
              }}
            >
              <DiagramViewer />
            </div>
          )}

          {/* Vertical Resize Handle */}
          {isViewerVisible && (isEditorVisible || isDiffVisible) && (
            <div
              onMouseDown={handleVerticalResizeStart}
              className={`h-1 cursor-row-resize flex-shrink-0 hover:bg-blue-500 transition-colors ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
              }`}
            />
          )}

          {/* Editor Section */}
          {isEditorVisible && (
            <div
              className={`overflow-hidden ${!isViewerVisible ? 'flex-1' : ''}`}
              style={isViewerVisible ? { height: `${editorHeightPercent}%` } : undefined}
            >
              <CodeEditor />
            </div>
          )}

          {/* Diff Section */}
          {isDiffVisible && (
            <div
              className={`overflow-hidden ${!isViewerVisible ? 'flex-1' : ''}`}
              style={isViewerVisible ? { height: `${editorHeightPercent}%` } : undefined}
            >
              <DiffViewer />
            </div>
          )}

          {/* Empty state when nothing is visible */}
          {!isViewerVisible && !isEditorVisible && !isDiffVisible && (
            <div className={`flex-1 flex items-center justify-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              Activez View ou Code pour afficher le contenu
            </div>
          )}
        </div>

        {/* Horizontal Resize Handle */}
        {isVersionsPanelVisible && (
          <div
            onMouseDown={handleHorizontalResizeStart}
            className={`w-1 cursor-col-resize flex-shrink-0 hover:bg-blue-500 transition-colors ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
            }`}
          />
        )}

        {/* Right Panel - Comments & Versions */}
        {isVersionsPanelVisible && (
          <div
            className={`overflow-hidden flex-shrink-0`}
            style={{ width: `${commentsPanelWidth}px` }}
          >
            <CommentsPanel />
          </div>
        )}
      </main>
    </div>
  );
}
