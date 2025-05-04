import { useState } from 'react';
import { simulate } from '../utils/simulator'; // 새로 추가한 함수
import type { Step } from '../types/ast';

export function useSimulator() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [current, setCurrent] = useState(0);

  const run = (code: string) => {
    const newSteps = simulate(code);
    setSteps(newSteps);
    setCurrent(0);
  };

  const nextStep = () => {
    setCurrent((prev) => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => {
    setCurrent((prev) => Math.max(prev - 1, 0));
  };

  const reset = () => {
    setSteps([]);
    setCurrent(0);
  };

  const executedSteps = steps.slice(0, current);

  return {
    steps,
    executedSteps,
    current,
    run,
    nextStep,
    prevStep,
    reset,
  };
}
