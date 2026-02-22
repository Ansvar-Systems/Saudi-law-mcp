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


---

## Important Disclaimers

### Not Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from official government publications. However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Coverage may be incomplete** — verify critical provisions against primary sources
> - **Verify all citations** against the official legal portal before relying on them professionally
> - Laws change — check the `about` tool for database freshness date

### Client Confidentiality

When using the remote endpoint, queries are processed by third-party infrastructure
(Vercel, Claude API). For privileged or confidential legal matters, use the local
npm package or on-premise deployment.

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [PRIVACY.md](PRIVACY.md)

---

## Open Law

This server is part of **Ansvar Open Law** — free, structured access to legislation
from 70+ jurisdictions worldwide via the Model Context Protocol.

**Browse all jurisdictions ->** [ansvar.eu/open-law](https://ansvar.eu/open-law)

## Ansvar MCP Network

Ansvar Open Law is part of the broader **Ansvar MCP Network** — 80+ servers covering
global legislation, EU/US compliance frameworks, and cybersecurity standards.

| Category | Coverage |
|----------|----------|
| **Legislation** | 70+ jurisdictions worldwide |
| **EU Compliance** | 49 regulations, 2,693 articles |
| **US Compliance** | 15 federal & state regulations |
| **Security Frameworks** | 261 frameworks, 1,451 controls |
| **Cybersecurity** | 200K+ CVEs, STRIDE patterns, sanctions |

**Explore the full network ->** [ansvar.ai/mcp](https://ansvar.ai/mcp)

---

Built by [Ansvar Systems](https://ansvar.eu) | [ansvar.eu/open-law](https://ansvar.eu/open-law)
