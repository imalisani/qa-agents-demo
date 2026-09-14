import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const rawDirectory = new URL('../evidence/raw/', import.meta.url);
const suiteNames = ['functional', 'integration', 'security', 'data'];
const testCounts = {
  total: 0, passed: 0, failed: 0, skipped: 0,
  api: 0, ui: 0, accessibility: 0, data: 0, integration: 0, security: 0, unit: 0,
};
const gates = {};
const foundEvidence = new Set();

async function readOptional(url) {
  try {
    return await readFile(url, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

function categoryFor(spec) {
  const title = spec.title.toLowerCase();
  const file = spec.file.replaceAll('\\', '/').toLowerCase();
  const inDirectory = (directory) => file.startsWith(`${directory}/`) || file.includes(`/${directory}/`);
  if (title.includes('[security]') || inDirectory('security')) return 'security';
  if (title.includes('[integration]') || inDirectory('integration')) return 'integration';
  if (title.includes('[data]') || inDirectory('data')) return 'data';
  if (inDirectory('a11y')) return 'accessibility';
  if (inDirectory('api') || file.endsWith('duplicate-refund.spec.ts')) return 'api';
  if (file.endsWith('partial-refund.spec.ts') && title.includes('rf-t03')) return 'api';
  return 'ui';
}

function collectSpecs(suite, destination) {
  destination.push(...(suite.specs ?? []));
  for (const child of suite.suites ?? []) collectSpecs(child, destination);
}

for (const suiteName of suiteNames) {
  const text = await readOptional(new URL(`${suiteName}.json`, rawDirectory));
  if (!text) continue;
  foundEvidence.add(suiteName);
  const report = JSON.parse(text);
  const specs = [];
  for (const suite of report.suites ?? []) collectSpecs(suite, specs);
  let suiteTotal = 0;
  let suiteFailed = 0;
  for (const spec of specs) {
    for (const executedTest of spec.tests ?? []) {
      suiteTotal += 1;
      testCounts.total += 1;
      testCounts[categoryFor(spec)] += 1;
      if (executedTest.status === 'unexpected') {
        suiteFailed += 1;
        testCounts.failed += 1;
      } else if (executedTest.status === 'skipped') {
        testCounts.skipped += 1;
      } else {
        testCounts.passed += 1;
      }
    }
  }
  gates[suiteName] = { status: suiteFailed === 0 ? 'passed' : 'failed', tests: suiteTotal, failed: suiteFailed };
}

let branchCoverage = null;
const unitOutput = await readOptional(new URL('unit-tests.txt', rawDirectory));
if (unitOutput) {
  foundEvidence.add('unit');
  const total = Number(unitOutput.match(/(?:^|\n).*tests\s+(\d+)/)?.[1] ?? 0);
  const passed = Number(unitOutput.match(/(?:^|\n).*pass\s+(\d+)/)?.[1] ?? 0);
  const failed = Number(unitOutput.match(/(?:^|\n).*fail\s+(\d+)/)?.[1] ?? 0);
  const coverage = unitOutput.match(/all files\s*\|\s*[\d.]+\s*\|\s*([\d.]+)/i);
  branchCoverage = coverage ? Number(coverage[1]) : null;
  testCounts.unit = total;
  testCounts.total += total;
  testCounts.passed += passed;
  testCounts.failed += failed;
  gates.unit = { status: failed === 0 && total > 0 ? 'passed' : 'failed', tests: total, failed };
}

let performance = {
  profile: null, p95Ms: null, errorRate: null, throughputRps: null,
  requests: null, checksRate: null, guardrail: 'p95 < 500 ms; HTTP failure rate < 1%; checks > 99%',
  guardrailType: 'demo/CI guardrail, not a product SLO',
};
const k6Output = await readOptional(new URL('k6-summary.json', rawDirectory));
if (k6Output) {
  foundEvidence.add('performance');
  const summary = JSON.parse(k6Output);
  const metrics = summary.metrics ?? {};
  performance = {
    ...performance,
    profile: summary.profile,
    p95Ms: metrics.http_req_duration?.values?.['p(95)'] ?? null,
    errorRate: metrics.http_req_failed?.values?.rate ?? null,
    throughputRps: metrics.http_reqs?.values?.rate ?? null,
    requests: metrics.http_reqs?.values?.count ?? null,
    checksRate: metrics.checks?.values?.rate ?? null,
  };
  const thresholdStates = Object.values(metrics)
    .flatMap((metric) => Object.values(metric.thresholds ?? {}))
    .map((threshold) => threshold.ok);
  const thresholdsPassed = thresholdStates.length === 3 && thresholdStates.every(Boolean);
  gates.performance = { status: thresholdsPassed ? 'passed' : 'failed', profile: summary.profile };
}

const required = (process.env.REQUIRED_EVIDENCE ?? '')
  .split(',').map((value) => value.trim()).filter(Boolean);
const missing = required.filter((name) => !foundEvidence.has(name));
const failedGates = Object.values(gates).filter((gate) => gate.status === 'failed').length;
const completeEvidence = ['unit', 'functional', 'integration', 'security', 'data', 'performance']
  .every((name) => foundEvidence.has(name));
const status = missing.length > 0 || failedGates > 0
  ? 'failed'
  : completeEvidence ? 'passed' : 'partial';
let commit = process.env.GITHUB_SHA;
if (!commit) {
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    commit = 'unavailable';
  }
}

const evidence = {
  schemaVersion: 1,
  status,
  commit,
  runId: process.env.GITHUB_RUN_ID ?? 'local',
  generatedAt: new Date().toISOString(),
  source: 'generated from available unit, Playwright, PostgreSQL, and k6 execution outputs',
  tests: testCounts,
  coverage: { branches: branchCoverage, gateMinimum: 90 },
  performance,
  gates,
  missingRequiredEvidence: missing,
  limitations: [
    'Performance values describe the current runner and are not a production SLO.',
    'The external refund provider is simulated and deterministic.',
    'Authentication and authorization are outside the current demo scope.',
  ],
};

await mkdir(new URL('../evidence/', import.meta.url), { recursive: true });
await writeFile(new URL('../evidence/qa-evidence.json', import.meta.url), `${JSON.stringify(evidence, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
if (status === 'failed') process.exitCode = 1;
