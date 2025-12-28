import { Moon, Sun } from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';

export function ThemeToggle() {
  const { theme, toggleTheme } = useEditorStore();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded ${
        theme === 'dark'
          ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
      }`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
