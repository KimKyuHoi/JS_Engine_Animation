// 🧠 Step Type 정의
export type StepType =
  | 'CreateGlobalContext'
  | 'AllocateHeapObject'
  | 'ReferenceVariable'
  | 'CreateExecutionContext'
  | 'DestroyExecutionContext'
  | 'CreateLexicalEnvironment'
  | 'DeclareVariable'
  | 'CheckVariableAccess'
  | 'AssignValue'
  | 'LogOutput'
  | 'RegisterWebAPI'
  | 'AddMacroTask'
  | 'AddMicroTask'
  | 'MoveTaskToStack'
  | 'ThrowReferenceError'
  | 'ExecuteExpression';

export interface Step {
  id: string;
  type: StepType;
  detail: string;
  data?: any;
}

// 🧱 상태 모델 정의
type EnvEntry = {
  initialized: boolean;
  value?: any;
};

export interface SimulatorState {
  callStack: string[];
  memoryHeap: Record<string, any>;
  variableEnv: Record<string, EnvEntry>;
  lexicalEnv: Record<string, EnvEntry>;
  microTaskQueue: string[];
  macroTaskQueue: string[];
}

export const initialSimulatorState: SimulatorState = {
  callStack: [],
  memoryHeap: {},
  variableEnv: {},
  lexicalEnv: {},
  microTaskQueue: [],
  macroTaskQueue: [],
};

// 🎯 기본 Step 생성 도우미
let idCounter = 0;
export const createId = () => `step-${idCounter++}`;

export function createStep(
  type: StepType,
  detail: string,
  data: any = {}
): Step {
  return {
    id: createId(),
    type,
    detail,
    data,
  };
}
