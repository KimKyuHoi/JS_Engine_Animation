import { parse } from '@babel/parser';
import type { File } from '@babel/types';

export function parseCode(code: string): File | null {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx'],
    });

    // console.log(ast);
    return ast;
  } catch (err) {
    console.error('❌ Babel parse error:', err);
    return null;
  }
}
