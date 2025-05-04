import { useState } from 'react';
import CodeEditor from './components/Editor';
import { useSimulator } from './hooks/useSimulator';
import { StepCard } from './components/StepCard';

function App() {
  const [code, setCode] = useState('// 여기에 코드를 작성해보세요');

  const { steps, executedSteps, current, run, nextStep, prevStep, reset } =
    useSimulator();

  const handleRun = () => {
    run(code); // 코드 실행 흐름 초기화 및 시뮬레이션 실행
  };

  return (
    <div style={{ padding: '1rem', width: 'calc(100vw - 2rem)' }}>
      <h1>JS 시뮬레이터</h1>
      <CodeEditor onChange={setCode} />

      <div style={{ marginTop: '1rem' }}>
        <button onClick={handleRun}>실행하기</button>
        <button onClick={nextStep}>다음</button>
        <button onClick={prevStep}>이전</button>
        <button onClick={reset}>초기화</button>
      </div>

      <h4>▶️ 실행된 Step 목록</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {executedSteps.map((step) => (
          <StepCard key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}

export default App;
