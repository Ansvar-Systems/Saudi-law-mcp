#!/usr/bin/env tsx
/**
 * Verifies DB provisions against fresh official BOE law pages.
 *
 * Default: verify all law documents in DB.
 * Options:
 *   --limit N      verify only first N laws
 */

import Database from 'better-sqlite3';
import { fetchWithRateLimit } from './lib/fetcher.js';
import { parseSaudiLawHtml, type SaudiLawDescriptor } from './lib/parser.js';

interface DbLaw {
  id: string;
  title: string;
  short_name: string | null;
  title_en: string | null;
  description: string | null;
  url: string | null;
}

interface DbProvision {
  section: string;
  content: string;
}

function parseArgs(): { limit: number | null } {
  const args = process.argv.slice(2);
  let limit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      const parsed = Number(args[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = parsed;
      }
      i++;
    }
  }

  return { limit };
}

function lawIdFromUrl(url: string): string | null {
  const match = url.match(/\/LawDetails\/([0-9a-f-]{36})\//i);
  return match ? match[1].toLowerCase() : null;
}

function normalizeSection(section: string): string {
  return String(section).trim();
}

async function main(): Promise<void> {
  const { limit } = parseArgs();
  const db = new Database('data/database.db', { readonly: true });

  const laws = db
    .prepare('SELECT id, title, short_name, title_en, description, url FROM legal_documents ORDER BY id')
    .all() as DbLaw[];

  const candidates = laws
    .filter(law => law.url && lawIdFromUrl(law.url) !== null)
    .slice(0, limit ?? laws.length);

  let lawsVerified = 0;
  let provisionsChecked = 0;
  let mismatches = 0;
  const mismatchRows: Array<{ lawId: string; section: string; reason: string }> = [];

  console.log('Saudi Law MCP -- Corpus Verification');
  console.log('====================================');
  console.log(`Target laws: ${candidates.length}`);

  for (const law of candidates) {
    const lawId = lawIdFromUrl(law.url!);
    if (!lawId) continue;

    process.stdout.write(`\n[${law.id}] Fetching official source...`);
    const fetched = await fetchWithRateLimit(law.url!);

    const descriptor: SaudiLawDescriptor = {
      id: law.id,
      file_stem: `law-${lawId}`,
      law_id: lawId,
      short_name: law.short_name ?? law.title,
      title_ar: law.title,
      title_en_fallback: law.title_en ?? undefined,
      description: law.description ?? undefined,
      detail_url: law.url!,
    };

    const parsed = parseSaudiLawHtml(fetched.body, descriptor);

    const officialBySection = new Map(parsed.provisions.map(p => [normalizeSection(p.section), p.content]));

    const dbRows = db.prepare(
      'SELECT section, content FROM legal_provisions WHERE document_id = ? ORDER BY CAST(section as INTEGER), section'
    ).all(law.id) as DbProvision[];

    let lawMismatches = 0;

    for (const row of dbRows) {
      provisionsChecked++;
      const section = normalizeSection(row.section);
      const official = officialBySection.get(section);

      if (official === undefined) {
        mismatches++;
        lawMismatches++;
        mismatchRows.push({ lawId: law.id, section, reason: 'missing_in_official_parse' });
        continue;
      }

      if (official !== row.content) {
        mismatches++;
        lawMismatches++;
        mismatchRows.push({ lawId: law.id, section, reason: 'char_mismatch' });
      }
    }

    for (const section of officialBySection.keys()) {
      const exists = dbRows.some(r => normalizeSection(r.section) === section);
      if (!exists) {
        mismatches++;
        lawMismatches++;
        mismatchRows.push({ lawId: law.id, section, reason: 'missing_in_db' });
      }
    }

    lawsVerified++;
    console.log(` OK (db=${dbRows.length}, official=${officialBySection.size}, mismatches=${lawMismatches})`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('Verification Summary');
  console.log('='.repeat(80));
  console.log(`Laws verified:        ${lawsVerified}/${candidates.length}`);
  console.log(`Provisions checked:   ${provisionsChecked}`);
  console.log(`Mismatches:           ${mismatches}`);

  if (mismatchRows.length > 0) {
    console.log('\nFirst mismatches:');
    for (const row of mismatchRows.slice(0, 25)) {
      console.log(`- ${row.lawId} section ${row.section}: ${row.reason}`);
    }
    process.exit(1);
  }

  console.log('\nFULL MATCH for verified scope.');
}

main().catch(error => {
  console.error('Fatal verification error:', error);
  process.exit(1);
});
