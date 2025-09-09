import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { marked } from "marked";

export const runtime = "nodejs";

type JobType = "internship" | "newgrad";

type Listing = {
  company: string;
  title: string;
  location: string;
  link: string;
  datePosted: string;
  salary: string;
  jobType: JobType;
  source: "scout" | "speedyapply" | "simplify";
};

const FETCH_TIMEOUT_MS = 15_000;
const HEADERS: HeadersInit = {
  "User-Agent": "jobs-aggregator/1.0",
};

function withTimeout(url: string, opts: RequestInit = {}, ms = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, headers: { ...(opts.headers || {}), ...HEADERS }, signal: controller.signal })
    .finally(() => clearTimeout(id));
}

async function fetchMarkdown(url: string): Promise<string> {
  const res = await withTimeout(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  return res.text();
}

async function mdTo$Tables(md: string) {
  const html = await marked(md);
  return cheerio.load(html)("table");
} 

/** Normalize strings to de-dup and make stable keys. */
const norm = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, " ").replace(/[^\w\s-]/g, "");

/** Parse flexible date strings into a Date (fallback to epoch 0 if unknown). */
function parseFlexibleDate(s: string): Date {
  const str = s.trim();

  // 1) GitHub lists often have "Xd" age
  const mD = str.match(/(\d+)\s*d/i);
  if (mD) {
    const d = new Date();
    d.setDate(d.getDate() - Number(mD[1]));
    return d;
  }

  // 2) Today / Yesterday
  if (/^today$/i.test(str)) {
    return new Date();
  }
  if (/^yesterday$/i.test(str)) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }

  // 3) Try Date.parse on common formats (MM/DD/YYYY, Month D, YYYY, YYYY-MM-DD)
  const t = Date.parse(str);
  if (!Number.isNaN(t)) return new Date(t);

  // 4) Try already-formatted US date like 09/01/2025 pieces
  const mUS = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mUS) {
    const [_, mm, dd, yyyy] = mUS;
    return new Date(Number(yyyy.length === 2 ? `20${yyyy}` : yyyy), Number(mm) - 1, Number(dd));
  }

  // Unknown, epoch start so it sorts last
  return new Date(0);
}

/** Canonicalize to MM/DD/YYYY if possible; otherwise keep original */
function toUSDateString(s: string): string {
  const d = parseFlexibleDate(s);
  if (d.getTime() === 0) return s;
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

/** Safe absolute URLs (GitHub readmes sometimes have relative links). */
function absolutize(url: string | undefined): string {
  if (!url) return "";
  try {
    // If valid absolute URL, this works
    return new URL(url).toString();
  } catch {
    // Not absolute; just return as-is (most are absolute)
    return url;
  }
}

function removeEmojis(text: string): string {
  const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
  return text.replace(emojiRegex, '');
}

/** Strong de-dupe: company+title+domain (if present); otherwise company+title */
function dedupe(list: Listing[]): Listing[] {
  const seen = new Set<string>();
  const out: Listing[] = [];
  for (const it of list) {
    const domain = new URL(it.link || "https://example.com").hostname.replace(/^www\./, "");
    const key = `${norm(it.company)}|${norm(it.title)}|${domain}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(it);
    }
  }
  return out;
}

/** Sort newest first; unknown dates to the bottom */
function sortByDateDesc(list: Listing[]): Listing[] {
  return [...list].sort((a, b) => {
    const ta = parseFlexibleDate(a.datePosted).getTime();
    const tb = parseFlexibleDate(b.datePosted).getTime();
    return tb - ta;
  });
}

/** ------------ Source Parsers ------------ **/

async function fetchScoutListings(): Promise<Listing[]> {
  const url = "https://raw.githubusercontent.com/cvrve/Summer2025-Internships/dev/README.md";
  const md = await fetchMarkdown(url);
  const tables = await mdTo$Tables(md);
  const rows = tables.find("tbody tr");
  const out: Listing[] = [];

  let prevCompany = "";

  rows.each((_, el) => {
    const $row = cheerio.load(el);
    let company = $row("td").eq(0).text().trim();
    if (company === "↳") company = prevCompany;
    else if (company) prevCompany = company;
    company = removeEmojis(company);

    const title = $row("td").eq(1).text().trim();
    const location = $row("td").eq(2).text().trim();
    const link = absolutize($row("td").eq(3).find("a").attr("href"));
    const age = $row("td").eq(4).text().trim();
    const datePosted = toUSDateString(age);

    if (!company || !title || !link) return;
    out.push({
      company,
      title,
      location,
      link,
      datePosted,
      salary: "",
      jobType: "internship",
      source: "scout",
    });
  });

  return out;
}

async function fetchSpeedyApplyListings(): Promise<Listing[]> {
  const url = "https://raw.githubusercontent.com/speedyapply/2025-SWE-College-Jobs/refs/heads/main/README.md";
  const md = await fetchMarkdown(url);
  const tables = await mdTo$Tables(md);
  const out: Listing[] = [];

  tables.each((_, table) => {
    const $t = cheerio.load(table);
    $t("tbody tr").each((_, el) => {
      const $row = $t(el);
      const company = removeEmojis($row.find("td").eq(0).text().trim());
      const title = $row.find("td").eq(1).text().trim();
      const location = $row.find("td").eq(2).text().trim();

      let link = "";
      let salary = "";
      let age = "";

      const td3 = $row.find("td").eq(3).text();
      if (td3.includes("$")) {
        salary = $row.find("td").eq(3).text().trim();
        link = absolutize($row.find("td").eq(4).find("a").attr("href"));
        age = $row.find("td").eq(5).text().trim();
      } else {
        link = absolutize($row.find("td").eq(3).find("a").attr("href"));
        age = $row.find("td").eq(4).text().trim();
      }

      const datePosted = toUSDateString(age);

      if (company && title && link) {
        out.push({
          company,
          title,
          location,
          link,
          datePosted,
          salary,
          jobType: "internship",
          source: "speedyapply",
        });
      }
    });
  });

  return out;
}

async function fetchSimplifyNewGradListings(): Promise<Listing[]> {
  const url = "https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/refs/heads/dev/README.md";
  const md = await fetchMarkdown(url);
  const tables = await mdTo$Tables(md);
  const rows = tables.find("tbody tr");
  const out: Listing[] = [];

  rows.each((_, el) => {
    const $row = cheerio.load(el);
    const tds = $row("td");

    const company = removeEmojis(tds.eq(0).text().trim());
    const title = tds.eq(1).text().trim();
    const location = tds.eq(2).text().trim();
    const salary = tds.eq(3).text().trim();
    const link = absolutize($row("td a").attr("href"));
    const age = tds.eq(4).text().trim();
    const datePosted = toUSDateString(age);

    if (company && title && link) {
      out.push({
        company,
        title,
        location,
        link,
        datePosted,
        salary,
        jobType: "newgrad",
        source: "simplify",
      });
    }
  });

  return out;
}

/** ------------ Route Handler ------------ **/
export async function GET() {
  try {
    const [scout, speedy, simplify] = await Promise.all([
      fetchScoutListings(),
      fetchSpeedyApplyListings(),
      fetchSimplifyNewGradListings(),
    ]);

    const merged = sortByDateDesc(dedupe([...scout, ...speedy, ...simplify]));

    return NextResponse.json({
      listings: merged,
      metadata: {
        total: merged.length,
        sources: {
          scout: scout.length,
          speedyApply: speedy.length,
          simplify: simplify.length,
        },
      },
    });
  } catch (err) {
    console.error("Error fetching listings:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch data",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
