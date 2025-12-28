import { useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw, Clock, CheckCheck } from 'lucide-react';
import type { DiagramVersion, Comment } from '../types';

interface VersionAccordionProps {
  version: DiagramVersion;
  comments: Comment[];
  isCurrent: boolean;
  onRestore: (versionNumber: number) => void;
  theme: 'light' | 'dark';
}

export function VersionAccordion({
  version,
  comments,
  isCurrent,
  onRestore,
  theme,
}: VersionAccordionProps) {
  const [isOpen, setIsOpen] = useState(isCurrent);

  const borderClass = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const bgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const hoverBgClass = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const mutedClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const codeBgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';

  return (
    <div
      className={`border rounded-lg overflow-hidden ${borderClass} ${
        isCurrent ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 ${bgClass} ${hoverBgClass} transition-colors`}
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="font-medium">v{version.versionNumber}</span>
          {isCurrent && (
            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
              Actuelle
            </span>
          )}
          {comments.length > 0 && (
            <span className={`text-xs ${mutedClass}`}>
              ({comments.length} commentaire{comments.length > 1 ? 's' : ''})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs ${mutedClass} flex items-center gap-1`}>
            <Clock size={12} />
            {new Date(version.createdAt).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {!isCurrent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestore(version.versionNumber);
              }}
              className="text-blue-500 hover:text-blue-600 p-1 rounded hover:bg-blue-500/10"
              title="Restaurer cette version"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </button>

      {/* Content */}
      {isOpen && comments.length > 0 && (
        <div className={`border-t ${borderClass} p-2 space-y-2`}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-2 rounded ${codeBgClass} text-sm`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-blue-500">
                  Lignes {comment.startLine}-{comment.endLine}
                </span>
                <span className={`text-xs ${mutedClass} flex items-center gap-1`}>
                  <CheckCheck size={10} className="text-green-500" />
                  Traité
                </span>
              </div>
              <p className="line-through opacity-60">{comment.text}</p>
            </div>
          ))}
        </div>
      )}

      {isOpen && comments.length === 0 && (
        <div className={`border-t ${borderClass} p-3 text-center ${mutedClass} text-sm`}>
          Aucun commentaire traité dans cette version
        </div>
      )}
    </div>
  );
}
