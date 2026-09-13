import { mkdir, rm } from 'node:fs/promises';

// Only this generated result directory is cleared; curated history and video stay intact.
const results = new URL('../allure-results/current/', import.meta.url);
await rm(results, { recursive: true, force: true });
await mkdir(results, { recursive: true });
