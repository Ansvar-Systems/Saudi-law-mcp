# Privacy & Client Confidentiality

**IMPORTANT READING FOR LEGAL PROFESSIONALS**

This document addresses privacy and confidentiality considerations when using this Tool, with particular attention to professional obligations under Saudi Arabian bar association rules.

---

## Executive Summary

**Key Risks:**
- Queries through Claude API flow via Anthropic cloud infrastructure
- Query content may reveal client matters and privileged information
- Saudi Bar Association (هيئة المحامين السعوديين — HaM) rules require strict confidentiality and data processing controls

**Safe Use Options:**
1. **General Legal Research**: Use Tool for non-client-specific queries
2. **Local npm Package**: Install `@ansvar/saudi-law-mcp` locally — database queries stay on your machine
3. **Remote Endpoint**: Vercel Streamable HTTP endpoint — queries transit Vercel infrastructure
4. **On-Premise Deployment**: Self-host with local LLM for privileged matters

---

## Data Flows and Infrastructure

### MCP (Model Context Protocol) Architecture

This Tool uses the **Model Context Protocol (MCP)** to communicate with AI clients:

```
User Query -> MCP Client (Claude Desktop/Cursor/API) -> Anthropic Cloud -> MCP Server -> Database
```

### Deployment Options

#### 1. Local npm Package (Most Private)

```bash
npx @ansvar/saudi-law-mcp
```

- Database is local SQLite file on your machine
- No data transmitted to external servers (except to AI client for LLM processing)
- Full control over data at rest

#### 2. Remote Endpoint (Vercel)

```
Endpoint: https://saudi-law-mcp.vercel.app/mcp
```

- Queries transit Vercel infrastructure
- Tool responses return through the same path
- Subject to Vercel's privacy policy

### What Gets Transmitted

When you use this Tool through an AI client:

- **Query Text**: Your search queries and tool parameters
- **Tool Responses**: Statute text (نصوص الأنظمة), provision content, search results
- **Metadata**: Timestamps, request identifiers

**What Does NOT Get Transmitted:**
- Files on your computer
- Your full conversation history (depends on AI client configuration)

---

## Professional Obligations (Saudi Arabia)

### Saudi Bar Association Rules

Lawyers (محامون) in Saudi Arabia are bound by professional confidentiality rules under the Law of the Legal Profession (نظام المحاماة) and its implementing regulations, administered by the Saudi Bar Association (هيئة المحامين السعوديين — HaM).

#### Duty of Confidentiality

- All client communications are privileged
- Client identity may be confidential in sensitive matters
- Case strategy and legal analysis are protected
- Information that could identify clients or matters must be safeguarded
- Breach of confidentiality may result in disciplinary proceedings before the HaM

### Saudi Arabia Data Protection Law

Saudi Arabia's Personal Data Protection Law (PDPL — نظام حماية البيانات الشخصية) and its implementing regulations impose data handling obligations. When using services that process client data:

- You are responsible as the data controller (المتحكم)
- AI service providers (Anthropic, Vercel) may be data processors on your behalf
- A data processing agreement may be required under the PDPL
- The National Data Management Office (NDMO) and Saudi Data and AI Authority (SDAIA) oversee compliance
- Data localisation requirements may apply to certain categories of personal data

---

## Risk Assessment by Use Case

### LOW RISK: General Legal Research

**Safe to use through any deployment:**

```
Example: "What does Article 5 of the Saudi Labor Law say about employment contracts?"
```

- No client identity involved
- No case-specific facts
- Publicly available legal information

### MEDIUM RISK: Anonymized Queries

**Use with caution:**

```
Example: "What are the penalties under the Anti-Money Laundering Law (نظام مكافحة غسل الأموال)?"
```

- Query pattern may reveal you are working on a financial crime matter
- Anthropic/Vercel logs may link queries to your API key

### HIGH RISK: Client-Specific Queries

**DO NOT USE through cloud AI services:**

- Remove ALL identifying details
- Use the local npm package with a self-hosted LLM
- Or use commercial legal databases (Westlaw Gulf, LexisNexis Middle East) with proper data processing agreements

---

## Data Collection by This Tool

### What This Tool Collects

**Nothing.** This Tool:

- Does NOT log queries
- Does NOT store user data
- Does NOT track usage
- Does NOT use analytics
- Does NOT set cookies

The database is read-only. No user data is written to disk.

### What Third Parties May Collect

- **Anthropic** (if using Claude): Subject to [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)
- **Vercel** (if using remote endpoint): Subject to [Vercel Privacy Policy](https://vercel.com/legal/privacy-policy)

---

## Recommendations

### For Solo Practitioners / Small Firms

1. Use local npm package for maximum privacy
2. General research: Cloud AI is acceptable for non-client queries
3. Client matters: Use commercial legal databases (Westlaw Gulf, LexisNexis Middle East) with proper agreements

### For Large Firms / Corporate Legal Departments

1. Negotiate Data Processing Agreements with AI service providers consistent with PDPL requirements
2. Consider on-premise deployment with self-hosted LLM
3. Train staff on safe vs. unsafe query patterns
4. Document AI tool usage policies for professional compliance
5. Assess data localisation requirements under PDPL for sensitive client data

### For Government / Public Sector

1. Use self-hosted deployment, no external APIs
2. Follow Saudi government IT security requirements and National Cybersecurity Authority (NCA) guidelines
3. Air-gapped option available for classified matters

---

## Questions and Support

- **Privacy Questions**: Open issue on [GitHub](https://github.com/Ansvar-Systems/Saudi-law-mcp/issues)
- **Anthropic Privacy**: Contact privacy@anthropic.com
- **HaM Guidance**: Consult Saudi Bar Association (هيئة المحامين السعوديين) ethics guidance on AI tool use

---

**Last Updated**: 2026-03-06
**Tool Version**: 1.0.0
