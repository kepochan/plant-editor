import ReactDiffViewer from 'react-diff-viewer-continued';
import { useEditorStore } from '../store/useEditorStore';

export function DiffViewer() {
  const { code, previousCode, theme } = useEditorStore();

  if (!previousCode) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>No previous version to compare. Make changes and render to see diff.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <ReactDiffViewer
        oldValue={previousCode}
        newValue={code}
        splitView={true}
        useDarkTheme={theme === 'dark'}
        leftTitle="Previous Version"
        rightTitle="Current Version"
        styles={{
          contentText: {
            fontSize: '13px',
            fontFamily: 'monospace',
          },
        }}
      />
    </div>
  );
}
