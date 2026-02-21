#!/usr/bin/env tsx
/**
 * Saudi Law MCP -- Real BOE ingestion pipeline.
 *
 * Source portal: https://laws.boe.gov.sa (Saudi Bureau of Experts)
 * Method: HTML scraping of official law detail pages
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchWithRateLimit } from './lib/fetcher.js';
import {
  TARGET_SAUDI_LAWS,
  extractAvailableLanguageIds,
  extractEnglishTitle,
  parseSaudiLawHtml,
  type ParsedLawSeed,
  type SaudiLawTarget,
} from './lib/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '../data/source');
const SEED_DIR = path.resolve(__dirname, '../data/seed');

interface CliArgs {
  limit: number | null;
  skipFetch: boolean;
}

interface IngestResult {
  id: string;
  title: string;
  status: 'OK' | 'SKIPPED' | 'ERROR';
  provisions: number;
  definitions: number;
  message?: string;
  url: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let skipFetch = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      const parsed = Number(args[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = parsed;
      }
      i++;
      continue;
    }

    if (args[i] === '--skip-fetch') {
      skipFetch = true;
    }
  }

  return { limit, skipFetch };
}

function lawDetailUrl(lawId: string, langId: 1 | 2): string {
  return `https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/${lawId}/${langId}`;
}

function orderPrefix(order: number): string {
  return String(order).padStart(2, '0');
}

function sourcePath(target: SaudiLawTarget, langId: 1 | 2): string {
  return path.join(SOURCE_DIR, `${orderPrefix(target.order)}-${target.id}-${langId === 1 ? 'ar' : 'en'}.html`);
}

function seedPath(target: SaudiLawTarget): string {
  return path.join(SEED_DIR, `${orderPrefix(target.order)}-${target.file_stem}.json`);
}

function ensureDirectories(): void {
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.mkdirSync(SEED_DIR, { recursive: true });
}

function clearOldSeedFiles(): void {
  const existing = fs.readdirSync(SEED_DIR).filter(file => file.endsWith('.json'));
  for (const file of existing) {
    fs.unlinkSync(path.join(SEED_DIR, file));
  }
}

async function fetchOrLoad(url: string, cacheFile: string, skipFetch: boolean): Promise<string> {
  if (skipFetch && fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile, 'utf8');
  }

  const response = await fetchWithRateLimit(url);
  fs.writeFileSync(cacheFile, response.body, 'utf8');
  return response.body;
}

async function ingestTarget(target: SaudiLawTarget, skipFetch: boolean): Promise<IngestResult> {
  const arUrl = lawDetailUrl(target.law_id, 1);

  try {
    const arabicHtml = await fetchOrLoad(arUrl, sourcePath(target, 1), skipFetch);
    const seed = parseSaudiLawHtml(arabicHtml, target);

    const availableLanguages = extractAvailableLanguageIds(arabicHtml);
    if (availableLanguages.includes(2)) {
      try {
        const englishHtml = await fetchOrLoad(lawDetailUrl(target.law_id, 2), sourcePath(target, 2), skipFetch);
        const englishTitle = extractEnglishTitle(englishHtml);
        if (englishTitle) {
          seed.title_en = englishTitle;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`  WARN ${target.id}: unable to fetch English variant (${message})`);
      }
    }

    if (!seed.provisions.length) {
      return {
        id: target.id,
        title: seed.title,
        status: 'ERROR',
        provisions: 0,
        definitions: 0,
        message: 'No provisions extracted from official page',
        url: seed.url,
      };
    }

    fs.writeFileSync(seedPath(target), `${JSON.stringify(seed, null, 2)}\n`, 'utf8');

    return {
      id: seed.id,
      title: seed.title,
      status: 'OK',
      provisions: seed.provisions.length,
      definitions: seed.definitions.length,
      url: seed.url,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      id: target.id,
      title: target.title_ar,
      status: 'ERROR',
      provisions: 0,
      definitions: 0,
      message,
      url: arUrl,
    };
  }
}

async function main(): Promise<void> {
  const { limit, skipFetch } = parseArgs();
  const targets = limit ? TARGET_SAUDI_LAWS.slice(0, limit) : TARGET_SAUDI_LAWS;

  console.log('Saudi Law MCP -- Real Data Ingestion');
  console.log('====================================');
  console.log('Source: https://laws.boe.gov.sa (Saudi Bureau of Experts)');
  console.log(`Targets: ${targets.length}`);
  if (skipFetch) {
    console.log('Mode: --skip-fetch (using cached source HTML when available)');
  }

  ensureDirectories();
  if (!skipFetch) {
    clearOldSeedFiles();
  }

  const results: IngestResult[] = [];

  for (const target of targets) {
    const prefix = `${orderPrefix(target.order)} ${target.id}`;
    process.stdout.write(`\n[${prefix}] Fetching and parsing...`);

    const result = await ingestTarget(target, skipFetch);
    results.push(result);

    if (result.status === 'OK') {
      console.log(` OK (${result.provisions} provisions, ${result.definitions} definitions)`);
      continue;
    }

    if (result.status === 'SKIPPED') {
      console.log(` SKIPPED (${result.message ?? ''})`);
      continue;
    }

    console.log(` ERROR (${result.message ?? 'unknown error'})`);
  }

  const successful = results.filter(r => r.status === 'OK');
  const failed = results.filter(r => r.status === 'ERROR');

  const totalProvisions = successful.reduce((sum, row) => sum + row.provisions, 0);
  const totalDefinitions = successful.reduce((sum, row) => sum + row.definitions, 0);

  console.log('\n' + '='.repeat(92));
  console.log('Ingestion Summary');
  console.log('='.repeat(92));
  console.log(`Succeeded: ${successful.length}`);
  console.log(`Failed:    ${failed.length}`);
  console.log(`Provisions extracted: ${totalProvisions}`);
  console.log(`Definitions extracted: ${totalDefinitions}`);
  console.log('');

  for (const row of results) {
    const status = row.status.padEnd(6, ' ');
    console.log(`${status} ${row.id.padEnd(34, ' ')} provisions=${String(row.provisions).padStart(4, ' ')}  ${row.url}`);
    if (row.message) {
      console.log(`       reason: ${row.message}`);
    }
  }

  if (!successful.length) {
    throw new Error('No laws were ingested successfully.');
  }
}

main().catch(error => {
  console.error('\nFatal ingestion error:', error);
  process.exit(1);
});
