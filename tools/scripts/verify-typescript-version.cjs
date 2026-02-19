#!/usr/bin/env node

const { execSync } = require('node:child_process');

function fail(message) {
  console.error(`\n[verify-typescript] ${message}\n`);
  process.exit(1);
}

function parse(version) {
  return version.split('.').map((n) => Number(n));
}

function inRange(version) {
  const [major, minor] = parse(version);
  return major === 5 && minor >= 9;
}

let version = '';

try {
  version = execSync('pnpm exec tsc -v', { stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim()
    .replace(/^Version\s+/, '');
} catch {
  fail('Não foi possível obter a versão do TypeScript com "pnpm exec tsc -v". Rode "pnpm install" e tente novamente.');
}

if (!inRange(version)) {
  fail(
    [
      `Versão do TypeScript incompatível detectada: ${version}.`,
      'Angular 21 exige TypeScript >= 5.9 e < 6.0.',
      'Rode os comandos abaixo para corrigir:',
      '  1) pnpm install --force',
      '  2) pnpm exec tsc -v',
      '  3) pnpm nx build web',
    ].join('\n')
  );
}

console.log(`[verify-typescript] OK: TypeScript ${version}`);
