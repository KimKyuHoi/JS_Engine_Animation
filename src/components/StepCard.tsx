import type { Step } from '../types/ast';

interface StepCardProps {
  step: Step;
}

const typeColors: Record<string, string> = {
  CreateContext: '#e3f2fd',
  PushStack: '#bbdefb',
  PopStack: '#ffcdd2',
  DeclareVariable: '#c8e6c9',
  InitializeVariable: '#dcedc8',
  AssignValue: '#fff9c4',
  ExecuteExpression: '#f0f4c3',
  RegisterWebAPI: '#ffe0b2',
  AddMacroTask: '#ffe082',
  AddMicroTask: '#d1c4e9',
  EventLoopCheck: '#b2dfdb',
  MoveToCallStack: '#ffccbc',
};

export const StepCard = ({ step }: StepCardProps) => {
  const bgColor = typeColors[step.type] || '#f5f5f5';

  return (
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: '6px',
        padding: '0.75rem',
        backgroundColor: bgColor,
        fontFamily: 'monospace',
      }}
    >
      <strong>[{step.type}]</strong> – {step.detail}
      {step.data && (
        <pre
          style={{
            marginTop: '0.5rem',
            fontSize: '0.85rem',
            color: '#333',
            background: '#fff',
            padding: '0.5rem',
            borderRadius: '4px',
            overflowX: 'auto',
          }}
        >
          {JSON.stringify(step.data, null, 2)}
        </pre>
      )}
    </div>
  );
};
