import Editor from '@monaco-editor/react';
import { useState } from 'react';

interface CodeEditorProps {
  defaultCode?: string;
  onChange: (code: string) => void;
}

export default function CodeEditor({
  defaultCode = '',
  onChange,
}: CodeEditorProps) {
  const [value, setValue] = useState(defaultCode);

  const handleChange = (newCode: string | undefined) => {
    const safeCode = newCode ?? '';
    setValue(safeCode);
    onChange(safeCode);
  };

  return (
    <div
      style={{
        height: '400px',
        width: 'calc(100% - 1rem)',
        border: '1px solid #ccc',
        borderRadius: '8px',
      }}
    >
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={value}
        onChange={handleChange}
        theme="vs-dark"
      />
    </div>
  );
}
