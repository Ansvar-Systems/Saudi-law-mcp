/**
 * Rate-limited HTTP fetcher for Saudi BOE legislation pages.
 *
 * The BOE legal portal is available at https://laws.boe.gov.sa and serves
 * legislation as server-rendered HTML under /BoeLaws/Laws/LawDetails/{lawId}/{langId}.
 *
 * Notes:
 * - Requests are delayed by default (1.2s) to avoid hammering the server.
 * - Retries are applied for transient failures (429/5xx/network errors).
 * - Uses curl with -k because the execution environment cannot validate the
 *   portal certificate chain (UNABLE_TO_VERIFY_LEAF_SIGNATURE).
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const USER_AGENT = 'Ansvar-Law-MCP/1.0 (+https://github.com/Ansvar-Systems/Saudi-law-mcp)';
const MIN_DELAY_MS = 1200;
const MAX_BUFFER = 50 * 1024 * 1024;
const META_MARKER = '__ANSVAR_FETCH_META__';

let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < MIN_DELAY_MS) {
    await sleep(MIN_DELAY_MS - elapsed);
  }
  lastRequestAt = Date.now();
}

export interface FetchResult {
  status: number;
  body: string;
  contentType: string;
  url: string;
}

async function curlFetch(url: string): Promise<FetchResult> {
  const args = [
    '-skL',
    '--compressed',
    '-A', USER_AGENT,
    '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    '--write-out', `\n${META_MARKER}%{http_code}|%{url_effective}|%{content_type}`,
    url,
  ];

  const { stdout } = await execFileAsync('curl', args, {
    maxBuffer: MAX_BUFFER,
    encoding: 'utf8',
  });

  const markerIndex = stdout.lastIndexOf(`\n${META_MARKER}`);
  if (markerIndex < 0) {
    throw new Error(`Unable to parse curl response metadata for ${url}`);
  }

  const body = stdout.slice(0, markerIndex);
  const meta = stdout.slice(markerIndex + 1 + META_MARKER.length).trim();
  const [statusRaw, finalUrl = url, contentType = ''] = meta.split('|');
  const status = Number(statusRaw);

  if (!Number.isFinite(status)) {
    throw new Error(`Invalid HTTP status from curl for ${url}: ${statusRaw}`);
  }

  return {
    status,
    body,
    contentType,
    url: finalUrl,
  };
}

/**
 * Fetch a URL with mandatory rate limiting and retry strategy.
 */
export async function fetchWithRateLimit(url: string, maxRetries = 3): Promise<FetchResult> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    await rateLimit();

    try {
      const result = await curlFetch(url);

      if (result.status === 429 || result.status >= 500) {
        if (attempt < maxRetries) {
          const backoff = Math.pow(2, attempt + 1) * 1000;
          await sleep(backoff);
          attempt++;
          continue;
        }
      }

      if (result.status >= 400) {
        throw new Error(`HTTP ${result.status} for ${url}`);
      }

      return result;
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries) break;

      const backoff = Math.pow(2, attempt + 1) * 1000;
      await sleep(backoff);
      attempt++;
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Failed to fetch ${url} after ${maxRetries + 1} attempts: ${message}`);
}

export async function fetchLegislation(url: string): Promise<string> {
  const result = await fetchWithRateLimit(url);
  return result.body;
}
