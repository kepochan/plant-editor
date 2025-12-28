import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Edit2, Clock, MessageSquare, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import type { DiagramListItem } from '../types';

export function DiagramsListPage() {
  const navigate = useNavigate();
  const [diagrams, setDiagrams] = useState<DiagramListItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const theme = localStorage.getItem('plant-editor-theme') || 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const loadDiagrams = async () => {
    setIsLoading(true);
    try {
      const data = await api.listDiagrams(search || undefined);
      setDiagrams(data);
    } catch (error) {
      console.error('Failed to load diagrams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(loadDiagrams, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleCreate = async () => {
    try {
      const diagram = await api.createDiagram();
      navigate(`/diagram/${diagram.id}`);
    } catch (error) {
      console.error('Failed to create diagram:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Supprimer ce diagramme ?')) return;

    try {
      await api.deleteDiagram(id);
      setDiagrams(diagrams.filter(d => d.id !== id));
    } catch (error) {
      console.error('Failed to delete diagram:', error);
    }
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await api.renameDiagram(id, editingName.trim());
      setDiagrams(diagrams.map(d =>
        d.id === id ? { ...d, name: editingName.trim() } : d
      ));
    } catch (error) {
      console.error('Failed to rename diagram:', error);
    } finally {
      setEditingId(null);
    }
  };

  const bgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const cardBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const inputBgClass = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass}`}>
      {/* Header */}
      <header className={`border-b ${borderClass} ${cardBgClass} px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">PlantUML Editor</h1>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={20} />
            Nouveau diagramme
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${mutedClass}`} size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un diagramme..."
            className={`w-full pl-10 pr-4 py-3 rounded-lg ${inputBgClass} border ${borderClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : diagrams.length === 0 ? (
          <div className={`text-center py-12 ${mutedClass}`}>
            {search ? 'Aucun diagramme trouvé' : 'Aucun diagramme. Cliquez sur "Nouveau diagramme" pour commencer.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                onClick={() => navigate(`/diagram/${diagram.id}`)}
                className={`${cardBgClass} border ${borderClass} rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-colors group`}
              >
                {/* Preview */}
                <div className={`h-40 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center overflow-hidden`}>
                  {diagram.imageUrl ? (
                    <img
                      src={diagram.imageUrl}
                      alt={diagram.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className={mutedClass}>Pas de diagramme</span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  {editingId === diagram.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRename(diagram.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(diagram.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className={`w-full px-2 py-1 rounded ${inputBgClass} border ${borderClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  ) : (
                    <h3 className="font-medium truncate">{diagram.name}</h3>
                  )}

                  <div className={`mt-2 flex items-center gap-4 text-sm ${mutedClass}`}>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      v{diagram.currentVersion}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={14} />
                      {diagram.commentsCount}
                    </span>
                  </div>

                  <div className={`mt-2 text-xs ${mutedClass}`}>
                    {new Date(diagram.updatedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(diagram.id);
                        setEditingName(diagram.name);
                      }}
                      className={`p-2 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      title="Renommer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(diagram.id, e)}
                      className="p-2 rounded hover:bg-red-500/20 text-red-500"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                    <a
                      href={`/diagram/${diagram.id}`}
                      onClick={(e) => e.stopPropagation()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      title="Ouvrir dans un nouvel onglet"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
