# Saudi Law MCP Server

**The Nass (نظام) alternative for the AI age.**

[![npm version](https://badge.fury.io/js/@ansvar%2Fsaudi-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/saudi-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/Saudi-law-mcp?style=social)](https://github.com/Ansvar-Systems/Saudi-law-mcp)
[![CI](https://github.com/Ansvar-Systems/Saudi-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/Saudi-law-mcp/actions/workflows/ci.yml)
[![Daily Data Check](https://github.com/Ansvar-Systems/Saudi-law-mcp/actions/workflows/check-updates.yml/badge.svg)](https://github.com/Ansvar-Systems/Saudi-law-mcp/actions/workflows/check-updates.yml)
[![Database](https://img.shields.io/badge/database-pre--built-green)](https://github.com/Ansvar-Systems/Saudi-law-mcp)
[![Provisions](https://img.shields.io/badge/provisions-15%2C954-blue)](https://github.com/Ansvar-Systems/Saudi-law-mcp)

Query **536 Saudi statutes (أنظمة)** -- from the Personal Data Protection Law (نظام حماية البيانات الشخصية) and the Cybercrime Law to the Labor Law (نظام العمل) and Commercial Law -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing Saudi legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

Saudi legal research means navigating nass.gov.sa, boe.gov.sa (Umm Al-Qura), and SDAIA's regulatory portal -- often across Arabic and English versions with no guaranteed parity. Whether you're:

- A **lawyer** validating citations before the Commercial Court or the Board of Grievances (ديوان المظالم)
- A **compliance officer** checking PDPL obligations or NCA cybersecurity requirements
- A **legal tech developer** building tools on Saudi law
- A **researcher** tracing Vision 2030 regulatory reform across 536 statutes

...you shouldn't need dozens of browser tabs and manual cross-referencing. Ask Claude. Get the exact provision. With context.

This MCP server makes Saudi law **searchable, cross-referenceable, and AI-readable**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://saudi-law-mcp.vercel.app/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add saudi-law --transport http https://saudi-law-mcp.vercel.app/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "saudi-law": {
      "type": "url",
      "url": "https://saudi-law-mcp.vercel.app/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "saudi-law": {
      "type": "http",
      "url": "https://saudi-law-mcp.vercel.app/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/saudi-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "saudi-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/saudi-law-mcp"]
    }
  }
}
```

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "saudi-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/saudi-law-mcp"]
    }
  }
}
```

## Example Queries

Once connected, just ask naturally:

- *"What does the Personal Data Protection Law say about consent requirements?"*
- *"Is the Cybercrime Law (نظام مكافحة الجرائم المعلوماتية) still in force?"*
- *"Find provisions about data breach notification in Saudi law"*
- *"What international frameworks does the PDPL align with?"*
- *"What does Article 9 of the Labor Law say about employment contracts?"*
- *"البحث عن نظام حماية البيانات الشخصية"*
- *"نظام مكافحة الجرائم المعلوماتية -- ما هي العقوبات المنصوص عليها؟"*
- *"نظام العمل -- ما هي متطلبات إنهاء الخدمة؟"*
- *"البحث في الأنظمة السعودية عن متطلبات الأمن السيبراني"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Statutes (أنظمة)** | 536 statutes | Royal Decrees and Ministerial Resolutions from nass.gov.sa and boe.gov.sa |
| **Provisions (مواد)** | 15,954 articles | Full-text searchable with FTS5 |
| **Database Size** | Pre-built SQLite | Optimized, portable |
| **Freshness Checks** | Automated | Drift detection against official sources |

**Verified data only** -- every citation is validated against official sources (nass.gov.sa, Umm Al-Qura). Zero LLM-generated content.

---

## Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from nass.gov.sa (Nass system) and boe.gov.sa (Umm Al-Qura official gazette)
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains statute text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by statute identifier + article number
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
nass.gov.sa / boe.gov.sa --> Parse --> SQLite --> FTS5 snippet() --> MCP response
                              ^                        ^
                       Provision parser         Verbatim database query
```

### Traditional Research vs. This MCP

| Traditional Approach | This MCP Server |
|---------------------|-----------------|
| Search nass.gov.sa by نظام name | Search by plain language: *"data protection consent"* or *"حماية البيانات"* |
| Navigate multi-article statutes manually | Get the exact provision with context |
| Manual cross-referencing between statutes | `build_legal_stance` aggregates across sources |
| "Is this نظام still in force?" -- check manually | `check_currency` tool -- answer in seconds |
| Find international alignment -- dig through external sources | `get_eu_basis` -- linked frameworks instantly |
| No API, no integration | MCP protocol -- AI-native |

**Traditional:** Search nass.gov.sa --> Download PDF --> Ctrl+F --> Cross-reference --> Repeat

**This MCP:** *"What are the data subject rights under the PDPL and how do they compare to GDPR?"* --> Done.

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 full-text search across 15,954 provisions with BM25 ranking. Supports Arabic and English, quoted phrases, boolean operators |
| `get_provision` | Retrieve specific provision by نظام identifier + article number (e.g., "PDPL" + "Article 4") |
| `check_currency` | Check if a statute is in force, amended, or repealed |
| `validate_citation` | Validate citation against database -- zero-hallucination check |
| `build_legal_stance` | Aggregate citations from multiple statutes for a legal topic |
| `format_citation` | Format citations per Saudi conventions (full/short/pinpoint) |
| `list_sources` | List all available statutes with metadata, coverage scope, and data provenance |
| `about` | Server info, capabilities, dataset statistics, and coverage summary |

### International Law Alignment Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get EU or international frameworks that a Saudi statute aligns with |
| `get_saudi_implementations` | Find Saudi laws aligning with an international framework or treaty |
| `search_eu_implementations` | Search international instruments with Saudi alignment counts |
| `get_provision_eu_basis` | Get international law references for a specific provision |
| `validate_eu_compliance` | Check alignment status of Saudi statutes against international standards |

---

## International Law Alignment

Saudi Arabia is not an EU member state, but several Saudi laws have significant international alignment:

- **PDPL (Personal Data Protection Law)** -- issued by Royal Decree M/19 (2021), implemented by SDAIA -- draws from GDPR principles including data subject rights, purpose limitation, and cross-border transfer controls. SDAIA has engaged with EU adequacy frameworks
- **Cybercrime Law (نظام مكافحة الجرائم المعلوماتية)** aligns with Budapest Convention principles and the Arab Convention on Combating Information Technology Offences
- **AML/CFT legislation** aligns with FATF standards; Saudi Arabia is a FATF member
- **Competition Law** reflects international competition law principles and WTO commitments

Saudi Arabia participates in **GCC (Gulf Cooperation Council)** legal frameworks -- GCC decisions and unified economic agreements shape domestic legislation. Saudi Arabia is also active in **Arab League** legal harmonisation efforts, the **G20** regulatory agenda, and **WTO** trade law obligations.

The international alignment tools allow you to explore these relationships -- checking which Saudi provisions correspond to international requirements, and vice versa.

> **Note:** Cross-references reflect alignment relationships. Saudi law operates within an Islamic legal tradition (Sharia) alongside civil and commercial codes shaped by Vision 2030 reforms. Royal Decrees are primary legislative instruments; Ministerial Resolutions implement them.

---

## Data Sources & Freshness

All content is sourced from authoritative Saudi legal databases:

- **[Nass (نظام)](https://nass.gov.sa/)** -- Bureau of Experts at the Council of Ministers, official statute system
- **[Umm Al-Qura](https://boe.gov.sa/)** -- Official Gazette, primary promulgation record

### Data Provenance

| Field | Value |
|-------|-------|
| **Authority** | Bureau of Experts at the Council of Ministers (Nass), Official Gazette (Umm Al-Qura) |
| **Languages** | Arabic (primary); English translations available for key statutes |
| **Coverage** | Royal Decrees, Ministerial Resolutions, and implementing regulations |
| **Source** | nass.gov.sa, boe.gov.sa (laws.boe.gov.sa) |

### Automated Freshness Checks

A [GitHub Actions workflow](.github/workflows/check-updates.yml) monitors official sources for changes:

| Check | Method |
|-------|--------|
| **Statute amendments** | Drift detection against known provision anchors |
| **New statutes** | Comparison against Nass statute index |
| **Repealed statutes** | Status change detection |

**Verified data only** -- every citation is validated against official sources. Zero LLM-generated content.

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from official Saudi government sources. However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Court case coverage is not included** -- do not rely solely on this for case law research; consult the Board of Grievances (ديوان المظالم) and Commercial Court records directly
> - **Verify critical citations** against primary sources before filing
> - **Arabic is the authoritative language** -- English translations, where ingested, are for reference only; the Arabic text governs
> - **Sharia-based adjudication** -- Saudi courts may apply Islamic jurisprudence (fiqh) alongside codified statutes; this tool covers codified statutes only

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [SECURITY.md](SECURITY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment. Consult the Saudi Bar Association (هيئة المحامين السعوديين) guidelines on AI use in legal practice.

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/Saudi-law-mcp
cd Saudi-law-mcp
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Data Management

```bash
npm run ingest                    # Ingest statutes from official sources
npm run build:db                  # Rebuild SQLite database
npm run drift:detect              # Run drift detection against anchors
npm run check-updates             # Check for source updates
```

### Performance

- **Search Speed:** <100ms for most FTS5 queries
- **Reliability:** 100% ingestion success rate across 536 statutes

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. `npx @ansvar/eu-regulations-mcp`

### [@ansvar/us-regulations-mcp](https://github.com/Ansvar-Systems/US_Compliance_MCP)
**Query US federal and state compliance laws** -- HIPAA, CCPA, SOX, GLBA, FERPA, and more. `npx @ansvar/us-regulations-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

**70+ national law MCPs** covering Bahrain, Egypt, Kuwait, Oman, Qatar, UAE, and more.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- Court case law expansion (Board of Grievances, Commercial Courts)
- English translation coverage for key statutes
- SDAIA PDPL implementing regulations and guidance
- GCC (Gulf Cooperation Council) unified legislation integration
- Historical statute versions and amendment tracking

---

## Roadmap

- [x] Core statute database with FTS5 search
- [x] Full corpus ingestion (536 statutes, 15,954 provisions)
- [x] International law alignment tools
- [x] Vercel Streamable HTTP deployment
- [x] npm package publication
- [ ] Court case law (Board of Grievances, Commercial Courts)
- [ ] English translation coverage expansion
- [ ] SDAIA PDPL guidance documents
- [ ] GCC unified legislation integration
- [ ] Historical statute versions (amendment tracking)

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{saudi_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {Saudi Law MCP Server: AI-Powered Legal Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/Saudi-law-mcp},
  note = {536 Saudi statutes with 15,954 provisions}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** Kingdom of Saudi Arabia (public domain government works)
- **International Metadata:** Public domain

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the global market. This MCP server started as our internal reference tool -- turns out everyone building compliance tools has the same research frustrations.

So we're open-sourcing it. Navigating 536 statutes in Arabic and English shouldn't require a law degree.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
