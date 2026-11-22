// Builds the package, then runs the tests (node's test runner). Ignores extra
// arguments such as --coverage that the monorepo passes to every workspace.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args) => {
  return execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
};

run(process.execPath, ['scripts/build-catalog.mjs']);
run(process.execPath, [createRequire(import.meta.url).resolve('typescript/bin/tsc'), '-p', 'tsconfig.json']);
const tests = readdirSync(join(ROOT, 'test'))
  .filter((f) => {
    return f.endsWith('.test.mjs');
  })
  .map((f) => {
    return join('test', f);
  });
try {
  run(process.execPath, ['--test', ...tests]);
} catch {
  process.exit(1);
}
