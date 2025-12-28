import { useState, useMemo } from 'react';
import { MessageSquare, Trash2, Send, X, Check } from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';
import { VersionAccordion } from './VersionAccordion';

export function CommentsPanel() {
  const {
    comments,
    versions,
    version: currentVersion,
    selectedLines,
    addComment,
    deleteComment,
    markCommentAsProcessed,
    clearComments,
    setSelectedLines,
    restoreVersion,
    theme,
  } = useEditorStore();
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedLines) return;
    await addComment(newComment.trim());
    setNewComment('');
  };

  // Group comments by version
  const { pendingComments, commentsByVersion } = useMemo(() => {
    const pending = comments.filter((c) => !c.processed);
    const byVersion: Record<number, typeof comments> = {};

    comments
      .filter((c) => c.processed && c.processedInVersion != null)
      .forEach((c) => {
        const v = c.processedInVersion!;
        if (!byVersion[v]) byVersion[v] = [];
        byVersion[v].push(c);
      });

    return { pendingComments: pending, commentsByVersion: byVersion };
  }, [comments]);

  const bgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const inputBgClass = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';
  const mutedClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`h-full flex flex-col ${bgClass}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${borderClass} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <MessageSquare size={18} />
          <span className="font-medium">Commentaires</span>
        </div>
        {comments.length > 0 && (
          <button
            onClick={clearComments}
            className="text-red-500 hover:text-red-600 text-sm"
            title="Supprimer tous les commentaires"
          >
            Tout effacer
          </button>
        )}
      </div>

      {/* Add Comment Form */}
      {selectedLines && (
        <div className={`px-4 py-3 border-b ${borderClass}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-500">
              Lignes {selectedLines.start}-{selectedLines.end} selectionnees
            </span>
            <button
              onClick={() => setSelectedLines(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className={`flex-1 px-3 py-2 rounded text-sm ${inputBgClass} border ${borderClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Pending Comments */}
        {pendingComments.length > 0 && (
          <div>
            <h3 className={`text-sm font-medium mb-2 ${mutedClass}`}>
              En attente de traitement ({pendingComments.length})
            </h3>
            <div className="space-y-2">
              {[...pendingComments].reverse().map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded border ${borderClass} ${inputBgClass}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-blue-500 font-medium">
                      Lignes {comment.startLine}-{comment.endLine}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => markCommentAsProcessed(comment.id)}
                        className="text-gray-400 hover:text-green-500"
                        title="Marquer comme traite"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm mb-2">{comment.text}</p>
                  {comment.codeSnapshot && (
                    <pre className={`text-xs p-2 rounded ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'} overflow-x-auto`}>
                      {comment.codeSnapshot}
                    </pre>
                  )}
                  <span className={`text-xs ${mutedClass} mt-2 block`}>
                    {new Date(comment.createdAt).toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Versions with treated comments */}
        {versions.length > 0 && (
          <div>
            <h3 className={`text-sm font-medium mb-2 ${mutedClass}`}>
              Historique des versions ({versions.length})
            </h3>
            <div className="space-y-2">
              {versions.map((version) => (
                <VersionAccordion
                  key={version.id}
                  version={version}
                  comments={commentsByVersion[version.versionNumber] || []}
                  isCurrent={version.versionNumber === currentVersion}
                  onRestore={restoreVersion}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {comments.length === 0 && versions.length === 0 && (
          <p className={`text-sm text-center ${mutedClass}`}>
            Selectionnez des lignes dans l'editeur pour ajouter des commentaires
          </p>
        )}
      </div>
    </div>
  );
}
