/**
 * Response metadata utilities for Saudi Law MCP.
 */

import type Database from '@ansvar/mcp-sqlite';

export interface ResponseMetadata {
  data_source: string;
  jurisdiction: string;
  disclaimer: string;
  freshness?: string;
}

export interface ToolResponse<T> {
  results: T;
  _metadata: ResponseMetadata;
}

export function generateResponseMetadata(
  db: InstanceType<typeof Database>,
): ResponseMetadata {
  let freshness: string | undefined;
  try {
    const row = db.prepare(
      "SELECT value FROM db_metadata WHERE key = 'built_at'"
    ).get() as { value: string } | undefined;
    if (row) freshness = row.value;
  } catch {
    // Ignore
  }

  return {
    data_source: 'Saudi Bureau of Experts Legal Portal (laws.boe.gov.sa)',
    jurisdiction: 'SA',
    disclaimer:
      'This data is sourced from the Saudi Bureau of Experts legal portal. ' +
      'Authoritative versions are maintained by the Saudi Bureau of Experts at the Council of Ministers. ' +
      'Always verify with the official portal (laws.boe.gov.sa).',
    freshness,
  };
}
