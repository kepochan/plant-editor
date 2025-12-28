import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import { useRef, useCallback } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import type { editor } from 'monaco-editor';

export function CodeEditor() {
  const { code, setCode, theme, setSelectedLines, updateDiagram } = useEditorStore();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleBeforeMount: BeforeMount = (monaco) => {
    // Register PlantUML language
    monaco.languages.register({ id: 'plantuml' });

    monaco.languages.setMonarchTokensProvider('plantuml', {
      tokenizer: {
        root: [
          [/@@startuml|@@enduml/, 'keyword.control'],
          [/\b(participant|actor|boundary|control|entity|database|collections|queue|component|interface|class|enum|abstract|package|node|folder|frame|cloud|rectangle)\b/, 'keyword'],
          [/\b(as|note|end|autonumber|newpage|title|header|footer|legend)\b/, 'keyword'],
          [/\b(if|else|elseif|endif|loop|alt|opt|break|par|critical|group|box)\b/, 'keyword'],
          [/\b(left|right|up|down|over|of|on)\b/, 'keyword'],
          [/-->|->|<--|<-|<-->|<->/, 'operator'],
          [/"[^"]*"/, 'string'],
          [/'.*$/, 'comment'],
          [/#[A-Fa-f0-9]{6}\b/, 'number'],
          [/#[A-Za-z]+\b/, 'number'],
        ],
      },
    });

    // Define theme colors BEFORE mount to ensure correct theme on load
    monaco.editor.defineTheme('plantuml-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword.control', foreground: 'C586C0', fontStyle: 'bold' },
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'comment', foreground: '6A9955' },
        { token: 'number', foreground: 'B5CEA8' },
      ],
      colors: {},
    });

    monaco.editor.defineTheme('plantuml-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword.control', foreground: 'AF00DB', fontStyle: 'bold' },
        { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
        { token: 'string', foreground: 'A31515' },
        { token: 'operator', foreground: '000000' },
        { token: 'comment', foreground: '008000' },
        { token: 'number', foreground: '098658' },
      ],
      colors: {},
    });
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Handle selection for comments
    editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection;
      if (selection.startLineNumber !== selection.endLineNumber || selection.startColumn !== selection.endColumn) {
        setSelectedLines({
          start: selection.startLineNumber,
          end: selection.endLineNumber,
        });
      } else {
        setSelectedLines(null);
      }
    });

    // Ctrl+Enter to render
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      updateDiagram();
    });
  };

  const handleChange = useCallback(
    (value: string | undefined) => {
      setCode(value || '');
    },
    [setCode]
  );

  return (
    <div className="h-full">
      <Editor
        height="100%"
        defaultLanguage="plantuml"
        language="plantuml"
        value={code}
        onChange={handleChange}
        beforeMount={handleBeforeMount}
        onMount={handleEditorMount}
        theme={theme === 'dark' ? 'plantuml-dark' : 'plantuml-light'}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          tabSize: 2,
        }}
      />
    </div>
  );
}
