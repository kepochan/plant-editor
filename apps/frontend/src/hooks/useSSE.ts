import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/useEditorStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useSSE() {
  const { diagramId, fetchDiagram, fetchComments, fetchVersions, version } = useEditorStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const versionRef = useRef(version);

  // Keep versionRef updated
  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  useEffect(() => {
    if (!diagramId) return;

    // Create EventSource connection
    const eventSource = new EventSource(
      `${API_URL}/diagrams/${diagramId}/events`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Always refresh comments (they might have been marked as processed)
        fetchComments();
        // Only refresh diagram if the version is newer than what we have
        if (data.version > versionRef.current) {
          fetchDiagram();
          fetchVersions();
        }
      } catch (error) {
        console.error('SSE parse error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Reconnect after 5 seconds
      setTimeout(() => {
        eventSource.close();
      }, 5000);
    };

    eventSourceRef.current = eventSource;

    // Cleanup on unmount or diagramId change
    return () => {
      eventSource.close();
    };
  }, [diagramId, fetchDiagram, fetchComments, fetchVersions]);
}
