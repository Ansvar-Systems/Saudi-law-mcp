/**
 * Parser utilities for Saudi legislation pages served by laws.boe.gov.sa.
 */

export interface SaudiLawSearchResult {
  law_id: string;
  title_ar: string;
  summary?: string;
  detail_url: string;
}

export interface SearchPageParseResult {
  total_results?: number;
  max_page_number: number;
  results: SaudiLawSearchResult[];
}

export interface SaudiLawDescriptor {
  id: string;
  file_stem: string;
  law_id: string;
  short_name: string;
  title_ar: string;
  title_en_fallback?: string;
  description?: string;
  detail_url: string;
}

export interface ParsedProvision {
  provision_ref: string;
  chapter?: string;
  section: string;
  title: string;
  content: string;
}

export interface ParsedDefinition {
  term: string;
  definition: string;
  source_provision?: string;
}

export interface ParsedLawSeed {
  id: string;
  type: 'statute';
  title: string;
  title_en?: string;
  short_name: string;
  status: 'in_force' | 'amended' | 'repealed' | 'not_yet_in_force';
  issued_date?: string;
  in_force_date?: string;
  url: string;
  description?: string;
  provisions: ParsedProvision[];
  definitions: ParsedDefinition[];
}

interface CoreOverride {
  id: string;
  file_stem: string;
  short_name: string;
  title_en_fallback?: string;
}

const CORE_LAW_OVERRIDES = new Map<string, CoreOverride>([
  ['b7cfae89-828e-4994-b167-adaa00e37188', { id: 'sa-pdpl', file_stem: 'personal-data-protection', short_name: 'PDPL', title_en_fallback: 'Personal Data Protection Law' }],
  ['25df73d6-0f49-4dc5-b010-a9a700f2ec1d', { id: 'sa-anti-cybercrime', file_stem: 'anti-cybercrime', short_name: 'Anti-Cyber Crime Law', title_en_fallback: 'Anti-Cyber Crime Law' }],
  ['ae610645-e094-48ef-814e-aeb4009d244f', { id: 'sa-telecommunications-ict', file_stem: 'telecommunications-ict', short_name: 'Telecommunications and ICT Law', title_en_fallback: 'Telecommunications and Information Technology Law' }],
  ['360de590-0286-4fa5-a243-aa9100c31979', { id: 'sa-ecommerce', file_stem: 'ecommerce', short_name: 'E-Commerce Law', title_en_fallback: 'E-Commerce Law' }],
  ['6f509360-2c39-4358-ae2a-a9a700f2ed16', { id: 'sa-electronic-transactions', file_stem: 'electronic-transactions', short_name: 'Electronic Transactions Law', title_en_fallback: 'Electronic Transactions Law' }],
  ['4a8842df-9cd1-4ee7-bf97-a9a700f180d4', { id: 'sa-anti-money-laundering', file_stem: 'anti-money-laundering', short_name: 'AML Law', title_en_fallback: 'Anti-Money Laundering Law' }],
  ['57694209-3eed-46c7-a5d8-a9ed012761d4', { id: 'sa-counter-terrorism-financing', file_stem: 'counter-terrorism-financing', short_name: 'CFT Law', title_en_fallback: 'Law on Combating Terrorism Crimes and Financing' }],
  ['63dc01a6-fc5c-4600-9171-a9a700f2d222', { id: 'sa-credit-information', file_stem: 'credit-information', short_name: 'Credit Information Law', title_en_fallback: 'Credit Information Law' }],
  ['f327464b-2f5a-475d-aa94-a9a700f2e817', { id: 'sa-cst-regulation', file_stem: 'cst-regulation', short_name: 'CST Regulation', title_en_fallback: 'Regulation of the Communications, Space and Technology Commission' }],
  ['cb98b088-6d6f-41a7-8633-acfc00b6db02', { id: 'sa-dga-regulation', file_stem: 'dga-regulation', short_name: 'DGA Regulation', title_en_fallback: 'Regulation of the Digital Government Authority' }],
]);

const EXACT_ORDINALS = new Map<string, number>([
  ['الأولى', 1],
  ['الاولى', 1],
  ['الأول', 1],
  ['الاول', 1],
  ['الثانية', 2],
  ['الثالثة', 3],
  ['الرابعة', 4],
  ['الخامسة', 5],
  ['السادسة', 6],
  ['السابعة', 7],
  ['الثامنة', 8],
  ['التاسعة', 9],
  ['العاشرة', 10],
  ['الحادية عشرة', 11],
  ['الحادي عشر', 11],
  ['الثانية عشرة', 12],
  ['الثالثة عشرة', 13],
  ['الرابعة عشرة', 14],
  ['الخامسة عشرة', 15],
  ['السادسة عشرة', 16],
  ['السابعة عشرة', 17],
  ['الثامنة عشرة', 18],
  ['التاسعة عشرة', 19],
  ['العشرون', 20],
  ['الثلاثون', 30],
  ['الاربعون', 40],
  ['الأربعون', 40],
  ['الخمسون', 50],
  ['الستون', 60],
  ['السبعون', 70],
  ['الثمانون', 80],
  ['التسعون', 90],
  ['المائة', 100],
  ['المئة', 100],
]);

const ONES = new Map<string, number>([
  ['الأولى', 1],
  ['الاولى', 1],
  ['الحادية', 1],
  ['الأول', 1],
  ['الاول', 1],
  ['الثانية', 2],
  ['الثالثة', 3],
  ['الرابعة', 4],
  ['الخامسة', 5],
  ['السادسة', 6],
  ['السابعة', 7],
  ['الثامنة', 8],
  ['التاسعة', 9],
]);

const TENS = new Map<string, number>([
  ['العشرون', 20],
  ['الثلاثون', 30],
  ['الاربعون', 40],
  ['الأربعون', 40],
  ['الخمسون', 50],
  ['الستون', 60],
  ['السبعون', 70],
  ['الثمانون', 80],
  ['التسعون', 90],
]);

function toAsciiDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, ch => String(ch.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, ch => String(ch.charCodeAt(0) - 1776));
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)));
}

function stripTags(input: string): string {
  return input.replace(/<[^>]+>/g, ' ');
}

function normalizeWhitespace(input: string): string {
  return input
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<\/ul>/gi, '\n');

  const decoded = decodeHtmlEntities(withBreaks);
  const stripped = stripTags(decoded);

  return normalizeWhitespace(
    stripped
      .replace(/\n\s*\n/g, '\n')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/\n{3,}/g, '\n\n'),
  );
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  if (pathOrUrl.startsWith('/')) {
    return `https://laws.boe.gov.sa${pathOrUrl}`;
  }

  return `https://laws.boe.gov.sa/${pathOrUrl}`;
}

function deriveShortName(title: string): string {
  const cleaned = normalizeWhitespace(
    title
      .replace(/^نظام\s+/, '')
      .replace(/^تنظيم\s+/, '')
      .replace(/^اللائحة\s+/, ''),
  );

  if (!cleaned) return normalizeWhitespace(title);
  return cleaned.length > 90 ? `${cleaned.slice(0, 90).trim()}...` : cleaned;
}

function extractSystemInfoValue(html: string, labelAr: string): string | undefined {
  const pattern = new RegExp(
    `<label[^>]*>\\s*${escapeRegExp(labelAr)}\\s*<\\/label>[\\s\\S]*?<span>\\s*([\\s\\S]*?)\\s*<\\/span>`,
    'i',
  );

  const match = html.match(pattern);
  if (!match) return undefined;

  return normalizeWhitespace(htmlToText(match[1]));
}

function parseGregorianDate(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const normalized = toAsciiDigits(input);

  const directMatch = normalized.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!directMatch) return undefined;

  const day = directMatch[1];
  const month = directMatch[2];
  const year = directMatch[3];
  return `${year}-${month}-${day}`;
}

function mapStatus(raw: string | undefined): ParsedLawSeed['status'] {
  if (!raw) return 'in_force';

  const value = raw.toLowerCase();

  if (value.includes('لاغ') || value.includes('ملغ') || value.includes('repeal')) {
    return 'repealed';
  }

  if (value.includes('مسودة') || value.includes('draft') || value.includes('not yet')) {
    return 'not_yet_in_force';
  }

  if (value.includes('تحت') || value.includes('amend')) {
    return 'amended';
  }

  return 'in_force';
}

function extractLawTitle(html: string): string | undefined {
  const match = html.match(/<h1 class="system_title mb-5">\s*([\s\S]*?)\s*<\/h1>/i);
  if (!match) return undefined;
  return normalizeWhitespace(htmlToText(match[1]));
}

function extractBriefDescription(html: string): string | undefined {
  const match = html.match(/<div class="col system_brief">[\s\S]*?<div class="HTMLContainer">([\s\S]*?)<\/div>/i);
  if (!match) return undefined;

  const text = normalizeWhitespace(htmlToText(match[1]));
  if (!text) return undefined;
  return text.length > 900 ? `${text.slice(0, 900).trim()}...` : text;
}

function normalizeOrdinalRaw(rawHeading: string): string {
  return normalizeWhitespace(
    toAsciiDigits(
      rawHeading
        .replace(/المادة/gi, '')
        .replace(/[():\-–—]/g, ' ')
        .replace(/[\u064B-\u065F\u0670]/g, ''),
    ),
  );
}

function parseArabicOrdinal(heading: string): number | undefined {
  const normalized = normalizeOrdinalRaw(heading);
  if (!normalized) return undefined;

  if (EXACT_ORDINALS.has(normalized)) {
    return EXACT_ORDINALS.get(normalized);
  }

  const compoundMatch = normalized.match(/^(.+?)\s+و\s+(.+)$/);
  if (compoundMatch) {
    const onesPart = compoundMatch[1].trim();
    const tensPart = compoundMatch[2].trim();
    const ones = ONES.get(onesPart);
    const tens = TENS.get(tensPart);

    if (ones && tens) {
      return ones + tens;
    }
  }

  if (ONES.has(normalized)) return ONES.get(normalized);
  if (TENS.has(normalized)) return TENS.get(normalized);

  return undefined;
}

function parseSectionNumber(heading: string, fallbackIndex: number): string {
  const arabicDigits = toAsciiDigits(heading);

  const numericMatch = arabicDigits.match(/(\d+)/);
  if (numericMatch) {
    return String(parseInt(numericMatch[1], 10));
  }

  const englishMatch = heading.match(/Article\s+(\d+)/i);
  if (englishMatch) {
    return String(parseInt(englishMatch[1], 10));
  }

  const arabicOrdinal = parseArabicOrdinal(heading);
  if (arabicOrdinal) {
    return String(arabicOrdinal);
  }

  return String(fallbackIndex);
}

function extractDefinitionsFromArticle(
  articleHtml: string,
  sourceProvision: string,
  definitions: ParsedDefinition[],
  seenTerms: Set<string>,
): void {
  const listItemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;

  while ((match = listItemRegex.exec(articleHtml)) !== null) {
    const text = normalizeWhitespace(htmlToText(match[1]));
    if (!text || text.length < 8) continue;

    const separatorIndex = text.indexOf(':');
    if (separatorIndex < 0) continue;

    const term = normalizeWhitespace(text.slice(0, separatorIndex).replace(/^-+/, ''));
    const definition = normalizeWhitespace(text.slice(separatorIndex + 1));

    if (term.length < 2 || term.length > 160 || definition.length < 6) continue;

    const dedupeKey = term.toLowerCase();
    if (seenTerms.has(dedupeKey)) continue;
    seenTerms.add(dedupeKey);

    definitions.push({
      term,
      definition,
      source_provision: sourceProvision,
    });
  }
}

function dedupeProvisions(provisions: ParsedProvision[]): ParsedProvision[] {
  const byRef = new Map<string, ParsedProvision>();

  for (const provision of provisions) {
    const existing = byRef.get(provision.provision_ref);
    if (!existing || provision.content.length > existing.content.length) {
      byRef.set(provision.provision_ref, provision);
    }
  }

  return Array.from(byRef.values()).sort((a, b) => Number(a.section) - Number(b.section));
}

function findMatchingDivEnd(html: string, openDivIndex: number): number {
  const divTagRegex = /<\/?div\b[^>]*>/gi;
  divTagRegex.lastIndex = openDivIndex;

  let depth = 0;
  let started = false;
  let match: RegExpExecArray | null;

  while ((match = divTagRegex.exec(html)) !== null) {
    const tag = match[0].toLowerCase();

    if (!started) {
      if (!tag.startsWith('<div')) continue;
      started = true;
    }

    if (tag.startsWith('</div')) {
      depth--;
    } else {
      depth++;
    }

    if (started && depth === 0) {
      return divTagRegex.lastIndex;
    }
  }

  return -1;
}

function collectClassDivBlocks(html: string, classFragment: string): string[] {
  const blocks: string[] = [];
  const openRegex = new RegExp(`<div\\b[^>]*class="[^"]*${escapeRegExp(classFragment)}[^"]*"[^>]*>`, 'gi');

  let match: RegExpExecArray | null;
  while ((match = openRegex.exec(html)) !== null) {
    const start = match.index;
    const end = findMatchingDivEnd(html, start);
    if (end <= start) continue;

    blocks.push(html.slice(start, end));
    openRegex.lastIndex = end;
  }

  return blocks;
}

function stripFirstClassDiv(blockHtml: string, classFragment: string): string {
  const openRegex = new RegExp(`<div\\b[^>]*class="[^"]*${escapeRegExp(classFragment)}[^"]*"[^>]*>`, 'i');
  const match = openRegex.exec(blockHtml);
  if (!match) return blockHtml;

  const start = match.index;
  const end = findMatchingDivEnd(blockHtml, start);
  if (end <= start) return blockHtml;

  return `${blockHtml.slice(0, start)}${blockHtml.slice(end)}`;
}

function extractFirstHtmlContainer(blockHtml: string): string | undefined {
  const openRegex = /<div\b[^>]*class="HTMLContainer"[^>]*>/i;
  const match = openRegex.exec(blockHtml);
  if (!match) return undefined;

  const start = match.index;
  const openTagEnd = start + match[0].length;
  const end = findMatchingDivEnd(blockHtml, start);
  if (end <= openTagEnd) return undefined;

  return blockHtml.slice(openTagEnd, end - 6);
}

function extractArticleBlocks(html: string): Array<{ heading: string; contentHtml: string }> {
  const blocks = collectClassDivBlocks(html, 'article_item');
  const articles: Array<{ heading: string; contentHtml: string }> = [];

  for (const articleBlock of blocks) {
    const headingMatch = articleBlock.match(/<h3 class="center">\s*([^<]+?)\s*<\/h3>/i);
    if (!headingMatch) continue;

    const heading = normalizeWhitespace(htmlToText(headingMatch[1]));
    const headingLower = heading.toLowerCase();
    if (!heading.startsWith('المادة') && !headingLower.startsWith('article')) {
      continue;
    }

    const withoutButtons = stripFirstClassDiv(articleBlock, 'article_btns');
    const contentHtml = extractFirstHtmlContainer(withoutButtons);
    if (!contentHtml) continue;

    articles.push({ heading, contentHtml });
  }

  return articles;
}

function parseTotalResults(html: string): number | undefined {
  const match = html.match(/عدد النتائج[\s\S]*?<span>\s*([0-9٠-٩]+)\s*<\/span>/i);
  if (!match) return undefined;

  const parsed = Number(toAsciiDigits(match[1]));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseMaxPageNumber(html: string): number {
  const pageMatches = Array.from(html.matchAll(/PageNumber=(\d+)/g));
  if (!pageMatches.length) return 1;

  let max = 1;
  for (const match of pageMatches) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > max) {
      max = parsed;
    }
  }

  return max;
}

export function parseSearchPage(html: string): SearchPageParseResult {
  const results: SaudiLawSearchResult[] = [];
  const seen = new Set<string>();

  const linkRegex = /<a class="result-keyword-title" href="([^"]*\/BoeLaws\/Laws\/LawDetails\/([0-9a-f-]{36})\/1)">([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const lawId = match[2].toLowerCase();
    const title = normalizeWhitespace(htmlToText(match[3]));
    if (!lawId || !title || seen.has(lawId)) continue;

    const nearby = html.slice(match.index, match.index + 2500);
    const summaryMatch = nearby.match(/<p class="result-keyword-desc">([\s\S]*?)<\/p>/i);
    const summary = summaryMatch ? normalizeWhitespace(htmlToText(summaryMatch[1])) : undefined;

    results.push({
      law_id: lawId,
      title_ar: title,
      summary,
      detail_url: absoluteUrl(href),
    });

    seen.add(lawId);
  }

  return {
    total_results: parseTotalResults(html),
    max_page_number: parseMaxPageNumber(html),
    results,
  };
}

export function buildLawDescriptor(search: SaudiLawSearchResult): SaudiLawDescriptor {
  const override = CORE_LAW_OVERRIDES.get(search.law_id);

  if (override) {
    return {
      id: override.id,
      file_stem: override.file_stem,
      law_id: search.law_id,
      short_name: override.short_name,
      title_ar: search.title_ar,
      title_en_fallback: override.title_en_fallback,
      description: search.summary,
      detail_url: search.detail_url,
    };
  }

  return {
    id: `sa-law-${search.law_id}`,
    file_stem: `law-${search.law_id}`,
    law_id: search.law_id,
    short_name: deriveShortName(search.title_ar),
    title_ar: search.title_ar,
    description: search.summary,
    detail_url: search.detail_url,
  };
}

export function extractAvailableLanguageIds(html: string): number[] {
  const match = html.match(/<select[^>]*id="ddlLawLanguages"[^>]*>([\s\S]*?)<\/select>/i);
  if (!match) return [1];

  const ids = new Set<number>();
  const optionRegex = /<option[^>]*value="(\d+)"[^>]*>/gi;
  let optionMatch: RegExpExecArray | null;

  while ((optionMatch = optionRegex.exec(match[1])) !== null) {
    const parsed = Number(optionMatch[1]);
    if (Number.isFinite(parsed)) {
      ids.add(parsed);
    }
  }

  return ids.size > 0 ? Array.from(ids).sort((a, b) => a - b) : [1];
}

export function extractEnglishTitle(html: string): string | undefined {
  const title = extractLawTitle(html);
  if (!title) return undefined;
  return /[A-Za-z]/.test(title) ? title : undefined;
}

export function parseSaudiLawHtml(html: string, law: SaudiLawDescriptor): ParsedLawSeed {
  const title = extractLawTitle(html) ?? law.title_ar;
  const description = extractBriefDescription(html) ?? law.description;

  const issuedDate = parseGregorianDate(extractSystemInfoValue(html, 'تاريخ الإصدار'));
  const publicationDate = parseGregorianDate(extractSystemInfoValue(html, 'تاريخ النشر'));
  const status = mapStatus(extractSystemInfoValue(html, 'الحالة'));

  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];
  const seenDefinitionTerms = new Set<string>();

  let index = 0;
  for (const article of extractArticleBlocks(html)) {
    index++;
    const heading = article.heading;
    const articleHtml = article.contentHtml;
    const content = normalizeWhitespace(htmlToText(articleHtml));

    if (!heading || !content || content.length < 8) continue;

    const section = parseSectionNumber(heading, index);
    const provisionRef = `art${section}`;

    provisions.push({
      provision_ref: provisionRef,
      section,
      title: heading,
      content,
    });

    if (section === '1' || heading.includes('المادة الأولى') || heading.toLowerCase().includes('article 1')) {
      extractDefinitionsFromArticle(articleHtml, provisionRef, definitions, seenDefinitionTerms);
    }
  }

  const dedupedProvisions = dedupeProvisions(provisions);

  return {
    id: law.id,
    type: 'statute',
    title,
    title_en: law.title_en_fallback,
    short_name: law.short_name,
    status,
    issued_date: issuedDate,
    in_force_date: publicationDate ?? issuedDate,
    url: law.detail_url,
    description,
    provisions: dedupedProvisions,
    definitions,
  };
}
