#!/usr/bin/env tsx
/**
 * Full verification script: compares every ingested provision in DB against
 * freshly fetched official BOE source pages (character-by-character).
 */

import Database from 'better-sqlite3';
import { fetchWithRateLimit } from './lib/fetcher.js';
import { TARGET_SAUDI_LAWS, parseSaudiLawHtml } from './lib/parser.js';

interface DbProvision {
  section: string;
  content: string;
}

function buildLawUrl(lawId: string): string {
  return `https://laws.boe.gov.sa/BoeLaws/Laws/LawDetails/${lawId}/1`;
}

function normalizeKey(section: string): string {
  return String(section).trim();
}

async function main(): Promise<void> {
  const db = new Database('data/database.db', { readonly: true });

  let lawsVerified = 0;
  let provisionsChecked = 0;
  let mismatches = 0;
  const mismatchRows: Array<{ lawId: string; section: string; reason: string }> = [];

  console.log('Saudi Law MCP -- Full Provision Verification');
  console.log('============================================');

  for (const law of TARGET_SAUDI_LAWS) {
    const url = buildLawUrl(law.law_id);

    process.stdout.write(`\n[${law.id}] Fetching official source...`);
    const fetched = await fetchWithRateLimit(url);
    const parsed = parseSaudiLawHtml(fetched.body, law);

    const officialBySection = new Map(parsed.provisions.map(p => [normalizeKey(p.section), p.content]));

    const dbRows = db.prepare(
      'SELECT section, content FROM legal_provisions WHERE document_id = ? ORDER BY CAST(section as INTEGER), section'
    ).all(law.id) as DbProvision[];

    let lawMismatches = 0;

    for (const row of dbRows) {
      provisionsChecked++;

      const section = normalizeKey(row.section);
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

    // detect official sections missing from DB
    for (const section of officialBySection.keys()) {
      const exists = dbRows.some(r => normalizeKey(r.section) === section);
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
  console.log(`Laws verified:        ${lawsVerified}/${TARGET_SAUDI_LAWS.length}`);
  console.log(`Provisions checked:   ${provisionsChecked}`);
  console.log(`Mismatches:           ${mismatches}`);

  if (mismatchRows.length > 0) {
    console.log('\nFirst mismatches:');
    for (const row of mismatchRows.slice(0, 20)) {
      console.log(`- ${row.lawId} section ${row.section}: ${row.reason}`);
    }
    process.exit(1);
  }

  console.log('\nFULL MATCH: 100% provision coverage verified against official source.');
}

main().catch(error => {
  console.error('Fatal verification error:', error);
  process.exit(1);
});
