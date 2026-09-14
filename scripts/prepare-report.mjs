import { cp, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const report = new URL('../reports/allure-current/', import.meta.url);
const summary = JSON.parse(await readFile(new URL('widgets/summary.json', report), 'utf8'));
assert.ok(summary.statistic.total > 0, 'Refusing to prepare an empty Allure report');
await writeFile(new URL('provenance.json', report), JSON.stringify({
  commit: process.env.GITHUB_SHA ?? 'local',
  runId: process.env.GITHUB_RUN_ID ?? 'local',
  generatedAt: new Date().toISOString(),
  tests: summary.statistic,
}, null, 2));
await cp(new URL('../evidence/qa-evidence.json', import.meta.url), new URL('qa-evidence.json', report));

// Keep the old, curated showcase explicitly separate from current CI results.
await cp(new URL('../reports/allure/', import.meta.url), new URL('archive/', report), { recursive: true });
