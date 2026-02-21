# Saudi Law MCP

Saudi law database for cybersecurity compliance via Model Context Protocol (MCP).

## Features

- **Full-text search** across legislation provisions (FTS5 with BM25 ranking)
- **Article-level retrieval** for specific legal provisions
- **Citation validation** to prevent hallucinated references
- **Currency checks** to verify if laws are still in force

## Quick Start

### Claude Code (Remote)
```bash
claude mcp add saudi-law --transport http https://saudi-law-mcp.vercel.app/mcp
```

### Local (npm)
```bash
npx @ansvar/saudi-law-mcp
```

## Data Sources

Official legislation ingested from the Saudi Bureau of Experts portal (`laws.boe.gov.sa`) covering the full searchable corpus of Saudi laws and regulations available on the portal at ingestion time.

## Corpus State (2026-02-21)

- Source catalog size (BOE searchable portal): **536** laws
- Seed files ingested: **536** (`001` to `536`, no gaps)
- Database documents: **536**
- Database provisions: **15,954**
- Database definitions: **278**
- English titles available (`title_en`): **289** documents
- Character-level source verification: **3/3 provisions matched** official BOE text

### Scope Notes

- Coverage is 100% of laws publicly listed and accessible in the BOE searchable catalog at ingestion time.
- Some portal records contain no parseable article blocks in source HTML; these are retained as zero-provision documents without fabrication.

## License

Apache-2.0
