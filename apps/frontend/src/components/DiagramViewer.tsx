import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';

export function DiagramViewer() {
  const { imageUrl, isLoading, scale, setScale, fitToWidthTrigger } = useEditorStore();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle fit to width when triggered from store
  useEffect(() => {
    if (fitToWidthTrigger > 0 && containerRef.current && imageRef.current) {
      const containerWidth = containerRef.current.clientWidth - 32;
      const imageWidth = imageRef.current.naturalWidth;
      if (imageWidth > 0) {
        const newScale = Math.min(containerWidth / imageWidth, 3);
        setScale(newScale);
        setPosition({ x: 0, y: 0 });
      }
    }
  }, [fitToWidthTrigger, setScale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(scale + delta);
    }
  };

  // Reset position when image changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, [imageUrl]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : imageUrl ? (
        <div
          className="inline-block min-w-full min-h-full p-4"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="PlantUML Diagram"
            className="max-w-none"
            draggable={false}
          />
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500">
          <p>No diagram to display. Write PlantUML code and click Render.</p>
        </div>
      )}
    </div>
  );
}
