#!/usr/bin/env tsx
/**
 * Saudi Law MCP -- Full-corpus BOE ingestion pipeline.
 *
 * Source portal: https://laws.boe.gov.sa
 * Method: crawl paginated BOE search results, fetch each law detail page,
 * parse provisions, and generate seed JSON files.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchWithRateLimit } from './lib/fetcher.js';
import {
  buildLawDescriptor,
  extractAvailableLanguageIds,
  extractEnglishTitle,
  parseSaudiLawHtml,
  parseSearchPage,
  type ParsedLawSeed,
  type SaudiLawDescriptor,
  type SaudiLawSearchResult,
} from './lib/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '../data/source');
const SEED_DIR = path.resolve(__dirname, '../data/seed');
const SEARCH_CACHE_DIR = path.join(SOURCE_DIR, 'search');
const LAW_CACHE_DIR = path.join(SOURCE_DIR, 'laws');
const CATALOG_PATH = path.join(SOURCE_DIR, 'law-catalog.json');

const SEARCH_URL_BASE = 'https://laws.boe.gov.sa/BoeLaws/Laws/Search';

interface CliArgs {
  limitPages: number | null;
  limitLaws: number | null;
  startLaw: number;
  skipFetch: boolean;
  resume: boolean;
  fetchEnglish: boolean;
  refreshCatalog: boolean;
  logEvery: number;
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

  let limitPages: number | null = null;
  let limitLaws: number | null = null;
  let startLaw = 1;
  let skipFetch = false;
  let resume = false;
  let fetchEnglish = true;
  let refreshCatalog = false;
  let logEvery = 25;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--limit-pages' && args[i + 1]) {
      const parsed = Number(args[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        limitPages = parsed;
      }
      i++;
      continue;
    }

    if (arg === '--limit-laws' && args[i + 1]) {
      const parsed = Number(args[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        limitLaws = parsed;
      }
      i++;
      continue;
    }

    if (arg === '--skip-fetch') {
      skipFetch = true;
      continue;
    }

    if (arg === '--resume') {
      resume = true;
      continue;
    }

    if (arg === '--start-law' && args[i + 1]) {
      const parsed = Number(args[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        startLaw = parsed;
      }
      i++;
      continue;
    }

    if (arg === '--log-every' && args[i + 1]) {
      const parsed = Number(args[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        logEvery = parsed;
      }
      i++;
      continue;
    }

    if (arg === '--refresh-catalog') {
      refreshCatalog = true;
      continue;
    }

    if (arg === '--no-en') {
      fetchEnglish = false;
    }
  }

  return { limitPages, limitLaws, startLaw, skipFetch, resume, fetchEnglish, refreshCatalog, logEvery };
}

function ensureDirectories(): void {
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.mkdirSync(SEED_DIR, { recursive: true });
  fs.mkdirSync(SEARCH_CACHE_DIR, { recursive: true });
  fs.mkdirSync(LAW_CACHE_DIR, { recursive: true });
}

function clearSeedFiles(): void {
  const existing = fs.readdirSync(SEED_DIR).filter(file => file.endsWith('.json'));
  for (const file of existing) {
    fs.unlinkSync(path.join(SEED_DIR, file));
  }
}

function pageCachePath(pageNumber: number): string {
  return path.join(SEARCH_CACHE_DIR, `search-page-${String(pageNumber).padStart(3, '0')}.html`);
}

function lawCachePath(lawId: string, lang: 1 | 2): string {
  return path.join(LAW_CACHE_DIR, `${lawId}-${lang === 1 ? 'ar' : 'en'}.html`);
}

function buildSearchUrl(pageNumber: number): string {
  const params = new URLSearchParams({
    PageNumber: String(pageNumber),
    LanguageId: '1',
    FolderId: '',
    PartId: '',
    Name: '',
    SearchTypeId: '0',
    Query: ' ',
    LawStatusId: '',
    IssueDateFrom: '',
    IssueDateTo: '',
    PublishDateFrom: '',
    PublishDateTo: '',
    returnUrl: '',
    TitlesOnly: 'True',
    MatchSearchResult: 'False',
    SortDirection: 'DES',
    IsDisplayWithUpdated: '',
  });

  return `${SEARCH_URL_BASE}?${params.toString()}`;
}

function detailUrl(lawId: string, lang: 1 | 2): string {
  return `https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/${lawId}/${lang}`;
}

function orderPrefix(index: number, width: number): string {
  return String(index).padStart(width, '0');
}

function seedPath(index: number, width: number, law: SaudiLawDescriptor): string {
  return path.join(SEED_DIR, `${orderPrefix(index, width)}-${law.file_stem}.json`);
}

async function fetchOrLoad(url: string, cacheFile: string, skipFetch: boolean): Promise<string> {
  if (skipFetch && fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile, 'utf8');
  }

  const response = await fetchWithRateLimit(url);
  fs.writeFileSync(cacheFile, response.body, 'utf8');
  return response.body;
}

function writeCatalog(entries: SaudiLawSearchResult[]): void {
  fs.writeFileSync(
    CATALOG_PATH,
    `${JSON.stringify(entries, null, 2)}\n`,
    'utf8',
  );
}

function readCatalog(): SaudiLawSearchResult[] | null {
  if (!fs.existsSync(CATALOG_PATH)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')) as SaudiLawSearchResult[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function discoverAllLaws(limitPages: number | null, skipFetch: boolean): Promise<SaudiLawSearchResult[]> {
  const firstPageHtml = await fetchOrLoad(buildSearchUrl(1), pageCachePath(1), skipFetch);
  const firstPage = parseSearchPage(firstPageHtml);

  const inferredPages = firstPage.total_results
    ? Math.ceil(firstPage.total_results / 20)
    : firstPage.max_page_number;

  const totalPages = Math.max(firstPage.max_page_number, inferredPages, 1);
  const crawlPages = limitPages ? Math.min(limitPages, totalPages) : totalPages;

  const collected: SaudiLawSearchResult[] = [];
  const seen = new Set<string>();

  function ingestPageResults(results: SaudiLawSearchResult[]): void {
    for (const row of results) {
      if (seen.has(row.law_id)) continue;
      seen.add(row.law_id);
      collected.push(row);
    }
  }

  ingestPageResults(firstPage.results);

  for (let page = 2; page <= crawlPages; page++) {
    process.stdout.write(`\rDiscovering laws: page ${page}/${crawlPages}`);
    const html = await fetchOrLoad(buildSearchUrl(page), pageCachePath(page), skipFetch);
    const parsed = parseSearchPage(html);
    ingestPageResults(parsed.results);
  }

  if (crawlPages > 1) {
    process.stdout.write('\n');
  }

  writeCatalog(collected);
  return collected;
}

async function ingestLaw(
  law: SaudiLawDescriptor,
  seedFile: string,
  args: CliArgs,
): Promise<IngestResult> {
  if (args.resume && fs.existsSync(seedFile)) {
    const existing = JSON.parse(fs.readFileSync(seedFile, 'utf8')) as ParsedLawSeed;
    return {
      id: existing.id,
      title: existing.title,
      status: 'SKIPPED',
      provisions: existing.provisions.length,
      definitions: existing.definitions.length,
      message: 'existing seed reused (--resume)',
      url: existing.url,
    };
  }

  try {
    const arHtml = await fetchOrLoad(detailUrl(law.law_id, 1), lawCachePath(law.law_id, 1), args.skipFetch);
    const parsed = parseSaudiLawHtml(arHtml, law);

    if (args.fetchEnglish) {
      const languageIds = extractAvailableLanguageIds(arHtml);
      if (languageIds.includes(2)) {
        try {
          const enHtml = await fetchOrLoad(detailUrl(law.law_id, 2), lawCachePath(law.law_id, 2), args.skipFetch);
          const englishTitle = extractEnglishTitle(enHtml);
          if (englishTitle) {
            parsed.title_en = englishTitle;
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.warn(`\n  WARN ${law.id}: English page fetch failed (${msg})`);
        }
      }
    }

    fs.writeFileSync(seedFile, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');

    return {
      id: parsed.id,
      title: parsed.title,
      status: 'OK',
      provisions: parsed.provisions.length,
      definitions: parsed.definitions.length,
      url: parsed.url,
      message: parsed.provisions.length === 0 ? 'No article blocks parsed' : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      id: law.id,
      title: law.title_ar,
      status: 'ERROR',
      provisions: 0,
      definitions: 0,
      message,
      url: law.detail_url,
    };
  }
}

async function main(): Promise<void> {
  const args = parseArgs();

  ensureDirectories();

  if (!args.resume && !args.skipFetch) {
    clearSeedFiles();
  }

  console.log('Saudi Law MCP -- Full Corpus Ingestion');
  console.log('======================================');
  console.log('Portal: https://laws.boe.gov.sa');
  console.log(`Mode: ${args.resume ? 'resume' : 'fresh'}`);
  if (args.skipFetch) console.log('Using --skip-fetch cache mode');
  console.log(`Start law: ${args.startLaw}`);

  let discovered: SaudiLawSearchResult[] | null = null;
  if (!args.refreshCatalog && (args.resume || args.skipFetch)) {
    discovered = readCatalog();
    if (discovered) {
      console.log(`Loaded cached catalog: ${discovered.length} laws`);
    }
  }

  if (!discovered) {
    discovered = await discoverAllLaws(args.limitPages, args.skipFetch);
  }

  const startIndex = Math.max(0, args.startLaw - 1);
  const endIndex = args.limitLaws ? startIndex + args.limitLaws : undefined;
  const selected = discovered.slice(startIndex, endIndex);
  const laws = selected.map(buildLawDescriptor);

  console.log(`Discovered laws: ${discovered.length}`);
  console.log(`Target laws:     ${laws.length} (from index ${startIndex + 1})`);

  const width = Math.max(3, String(discovered.length).length);

  const results: IngestResult[] = [];

  for (let i = 0; i < laws.length; i++) {
    const law = laws[i];
    const seq = startIndex + i + 1;
    const seedFile = seedPath(seq, width, law);

    process.stdout.write(`\rIngesting ${orderPrefix(seq, width)}/${discovered.length}: ${law.id}                     `);
    const result = await ingestLaw(law, seedFile, args);
    results.push(result);

    const shouldLog =
      result.status === 'ERROR' ||
      i === 0 ||
      i === laws.length - 1 ||
      (i + 1) % args.logEvery === 0;

    if (shouldLog) {
      process.stdout.write('\n');
      const extra = result.status === 'ERROR'
        ? `ERROR (${result.message ?? 'unknown error'})`
        : `${result.status} (${result.provisions} provisions)`;
      console.log(`[${orderPrefix(seq, width)}/${discovered.length}] ${law.id}: ${extra}`);
    }
  }

  process.stdout.write('\n');

  const ok = results.filter(r => r.status === 'OK');
  const skipped = results.filter(r => r.status === 'SKIPPED');
  const failed = results.filter(r => r.status === 'ERROR');

  const totalProvisions = results.reduce((sum, r) => sum + r.provisions, 0);
  const totalDefinitions = results.reduce((sum, r) => sum + r.definitions, 0);

  console.log('\n' + '='.repeat(96));
  console.log('Ingestion Summary');
  console.log('='.repeat(96));
  console.log(`Succeeded:  ${ok.length}`);
  console.log(`Skipped:    ${skipped.length}`);
  console.log(`Failed:     ${failed.length}`);
  console.log(`Provisions: ${totalProvisions}`);
  console.log(`Definitions:${totalDefinitions}`);

  if (failed.length > 0) {
    console.log('\nFailures (first 20):');
    for (const row of failed.slice(0, 20)) {
      console.log(`- ${row.id}: ${row.message}`);
    }
  }

  if (ok.length === 0 && skipped.length === 0) {
    throw new Error('No laws were ingested successfully.');
  }
}

main().catch(error => {
  console.error('\nFatal ingestion error:', error);
  process.exit(1);
});
