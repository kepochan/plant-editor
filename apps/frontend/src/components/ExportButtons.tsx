import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';

export function ExportButtons() {
  const { imageUrl, svgUrl, code, copyCode, theme } = useEditorStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (url: string | null, filename: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const buttonClass = `flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
    theme === 'dark'
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
  } disabled:opacity-50`;

  return (
    <div className="flex gap-1">
      <button
        onClick={handleCopy}
        disabled={!code}
        className={buttonClass}
        title="Copy code"
      >
        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
      </button>
      <button
        onClick={() => handleDownload(imageUrl, 'diagram.png')}
        disabled={!imageUrl}
        className={buttonClass}
        title="Download PNG"
      >
        <Download size={16} />
        PNG
      </button>
      <button
        onClick={() => handleDownload(svgUrl, 'diagram.svg')}
        disabled={!svgUrl}
        className={buttonClass}
        title="Download SVG"
      >
        <Download size={16} />
        SVG
      </button>
    </div>
  );
}
