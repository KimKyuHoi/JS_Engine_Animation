import { parse } from '@babel/parser';
import type {
  File,
  Node,
  FunctionDeclaration,
  Identifier,
  StringLiteral,
  NumericLiteral,
  MemberExpression,
  ObjectExpression,
  ExpressionStatement,
  VariableDeclaration,
  AssignmentExpression,
} from '@babel/types';
import type { Step } from '../types/ast';

/**
 * JS 엔진 동작을 시뮬레이션하여 단계별 Step[]을 반환합니다.
 */
export function simulate(code: string): Step[] {
  const ast: File = parse(code, {
    sourceType: 'script',
    plugins: ['jsx'],
  }) as File;
  const steps: Step[] = [];

  /** 상태 모델 */
  interface VarEntry {
    initialized: boolean;
    value?: any;
  }
  interface Env {
    vars: Record<string, VarEntry>;
    outer: Env | null;
  }
  interface SimulatorState {
    callStack: string[];
    heap: Record<string, FunctionDeclaration>;
    envStack: Env[];
  }
  const state: SimulatorState = { callStack: [], heap: {}, envStack: [] };

  /** Step 생성 헬퍼 */
  let idCounter = 0;
  const createId = () => `step-${idCounter++}`;
  const createStep = (type: Step['type'], detail: string, data: any = {}) => {
    steps.push({ id: createId(), type, detail, data });
  };

  /** 환경 헬퍼 */
  const currentEnv = (): Env => state.envStack[state.envStack.length - 1]!;
  const lookupVar = (name: string): VarEntry | null => {
    let env: Env | null = currentEnv();
    while (env) {
      if (Object.prototype.hasOwnProperty.call(env.vars, name))
        return env.vars[name];
      env = env.outer;
    }
    return null;
  };

  // 1) Global Context
  createStep(
    'CreateGlobalContext',
    'Global 실행 컨텍스트 생성 및 Call Stack에 push'
  );
  state.callStack.push('Global');
  state.envStack.push({ vars: {}, outer: null });

  // 2) 호이스팅: 함수 선언, var, let/const
  for (const node of ast.program.body) {
    if (node.type === 'FunctionDeclaration') {
      const name = node.id!.name;
      createStep('AllocateHeapObject', `함수 '${name}'를 Heap에 저장`, {
        name,
      });
      state.heap[name] = node;
      createStep('ReferenceVariable', `함수 '${name}'를 VariableEnv에 등록`, {
        name,
      });
      currentEnv().vars[name] = { initialized: true, value: node };
    }
    if (node.type === 'VariableDeclaration') {
      for (const decl of node.declarations) {
        const name = (decl.id as Identifier).name;
        if (node.kind === 'var') {
          createStep(
            'DeclareVariable',
            `var '${name}' 호이스팅: Global Env에 등록(undefined)`,
            { name }
          );
          currentEnv().vars[name] = { initialized: true, value: undefined };
        } else {
          createStep(
            'DeclareVariable',
            `${node.kind} '${name}' 호이스팅: TDZ 상태`,
            { name }
          );
          currentEnv().vars[name] = { initialized: false };
        }
      }
    }
  }

  // 3) 표현식 평가
  const evaluateExpression = (node: Node): any => {
    switch (node.type) {
      case 'StringLiteral':
        return (node as StringLiteral).value;
      case 'NumericLiteral':
        return (node as NumericLiteral).value;
      case 'ObjectExpression': {
        // 생성
        const obj: Record<string, any> = {};
        const objId = createId();
        createStep('AllocateHeapObject', `Object literal 생성`, {
          objectId: objId,
        });
        // 프로퍼티 초기화
        (node as ObjectExpression).properties.forEach((prop: any) => {
          if (prop.key.type === 'Identifier') {
            const key = prop.key.name;
            const val = evaluateExpression(prop.value as Node);
            obj[key] = val;
            createStep('AssignValue', `Object 프로퍼티 '${key}' 초기화`, {
              objectId: objId,
              key,
              value: val,
            });
          }
        });
        return obj;
      }
      case 'Identifier': {
        const name = (node as Identifier).name;
        const entry = lookupVar(name);
        if (!entry) {
          createStep(
            'ThrowReferenceError',
            `ReferenceError: '${name}' is not defined`
          );
          return undefined;
        }
        if (!entry.initialized) {
          createStep(
            'ThrowReferenceError',
            `ReferenceError: Cannot access '${name}' before initialization`
          );
          return undefined;
        }
        return entry.value;
      }
      case 'MemberExpression': {
        const me = node as MemberExpression;
        const obj = evaluateExpression(me.object as Node);
        const prop = (me.property as Identifier).name;
        createStep('ExecuteExpression', `MemberExpression '${prop}' 접근`, {
          object: me.object,
          property: prop,
        });
        const value = obj && obj[prop];
        return value;
      }
      default:
        return undefined;
    }
  };

  // 4) 문장 실행
  const evaluateStatement = (node: Node) => {
    if (node.type === 'VariableDeclaration') {
      for (const decl of (node as VariableDeclaration).declarations) {
        const name = (decl.id as Identifier).name;
        if (decl.init) {
          const val = evaluateExpression(decl.init as Node);
          createStep('AssignValue', `${node.kind} '${name}' 할당: ${val}`, {
            name,
            value: val,
          });
          currentEnv().vars[name] = { initialized: true, value: val };
        }
      }
    } else if (node.type === 'ExpressionStatement') {
      const expr = (node as ExpressionStatement).expression as any;
      // 대입 문 (d = c, c.greeting = 'Hello')
      if (expr.type === 'AssignmentExpression') {
        const left = expr.left;
        const rightVal = evaluateExpression(expr.right as Node);
        if (left.type === 'Identifier') {
          const name = (left as Identifier).name;
          createStep('AssignValue', `변수 '${name}'에 값 할당: ${rightVal}`, {
            name,
            value: rightVal,
          });
          currentEnv().vars[name] = { initialized: true, value: rightVal };
        } else if (left.type === 'MemberExpression') {
          const me = left as MemberExpression;
          const obj = evaluateExpression(me.object as Node);
          const prop = (me.property as Identifier).name;
          createStep(
            'AssignValue',
            `객체 프로퍼티 '${prop}' 변경: ${rightVal}`,
            { property: prop, value: rightVal }
          );
          obj[prop] = rightVal;
        }
      }
      // 함수 호출 or console.log
      else if (expr.type === 'CallExpression') {
        if (expr.callee.type === 'MemberExpression') {
          createStep('ExecuteExpression', `console.log() 실행`);
          const arg = expr.arguments[0] as Node;
          const val = evaluateExpression(arg);
          createStep('LogOutput', `로그 출력: ${val}`, { value: val });
        } else if (expr.callee.type === 'Identifier') {
          const fnName = (expr.callee as Identifier).name;
          createStep(
            'ExecuteExpression',
            `CallExpression '${fnName}()' 실행 준비`,
            { name: fnName }
          );
          createStep(
            'CreateExecutionContext',
            `함수 '${fnName}' 실행 컨텍스트 생성 및 push`,
            { name: fnName }
          );
          state.callStack.push(fnName);
          state.envStack.push({ vars: {}, outer: currentEnv() });
          createStep(
            'CreateLexicalEnvironment',
            `함수 '${fnName}' 내부 LexicalEnv 생성`,
            { name: fnName }
          );

          // 함수 내부 호이스팅
          const fnDecl = state.heap[fnName];
          fnDecl.body.body.forEach((s) => {
            if (s.type === 'VariableDeclaration') {
              (s as VariableDeclaration).declarations.forEach((d) => {
                const n = (d.id as Identifier).name;
                if ((s as VariableDeclaration).kind === 'var') {
                  createStep(
                    'DeclareVariable',
                    `var '${n}' 함수 Env 호이스팅`,
                    { name: n }
                  );
                  currentEnv().vars[n] = {
                    initialized: true,
                    value: undefined,
                  };
                } else {
                  createStep(
                    'DeclareVariable',
                    `${
                      (s as VariableDeclaration).kind
                    } '${n}' 함수 Env TDZ 등록`,
                    { name: n }
                  );
                  currentEnv().vars[n] = { initialized: false };
                }
              });
            }
          });
          fnDecl.body.body.forEach((s) => evaluateStatement(s));
          state.callStack.pop();
          state.envStack.pop();
          createStep(
            'DestroyExecutionContext',
            `함수 '${fnName}' 실행 종료 및 pop`,
            { name: fnName }
          );
        }
      }
    }
  };

  // 5) 전역 실행 시작
  ast.program.body.forEach((node) => {
    if (node.type !== 'FunctionDeclaration') evaluateStatement(node);
  });

  return steps;
}
