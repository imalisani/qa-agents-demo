import { spawn } from 'node:child_process';
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const unitDirectory = fileURLToPath(new URL('../unit-tests/', import.meta.url));
const files = (await readdir(unitDirectory))
  .filter((file) => file.endsWith('.test.mjs'))
  .map((file) => fileURLToPath(new URL(`../unit-tests/${file}`, import.meta.url)));
const arguments_ = [
  '--test',
  '--experimental-test-coverage',
  '--test-coverage-include=app/refund-store.mjs',
  '--test-coverage-include=app/refund-provider-simulator.mjs',
  '--test-coverage-branches=90',
  ...files,
];

const child = spawn(process.execPath, arguments_, { cwd: root, windowsHide: true });
let output = '';
child.stdout.on('data', (chunk) => {
  output += chunk;
  process.stdout.write(chunk);
});
child.stderr.on('data', (chunk) => {
  output += chunk;
  process.stderr.write(chunk);
});

const exitCode = await new Promise((resolve, reject) => {
  child.once('error', reject);
  child.once('close', resolve);
});
await mkdir(new URL('../evidence/raw/', import.meta.url), { recursive: true });
await writeFile(new URL('../evidence/raw/unit-tests.txt', import.meta.url), output);
process.exitCode = exitCode;
