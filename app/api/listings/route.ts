import { NextResponse } from "next/server";

const SOURCES = [
  {
    url: "https://raw.githubusercontent.com/cvrve/Summer2025-Internships/dev/README.md",
    type: "internship" as const,
    name: "cvrve",
  },
  {
    url: "https://raw.githubusercontent.com/speedyapply/2025-SWE-College-Jobs/refs/heads/main/README.md",
    type: "mixed" as const,
    name: "speedyapply",
  },
  {
    url: "https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/refs/heads/dev/README.md",
    type: "newgrad" as const,
    name: "simplify",
  },
];

const FAANG_PLUS = new Set([
  "google",
  "alphabet",
  "meta",
  "facebook",
  "amazon",
  "apple",
  "netflix",
  "microsoft",
  "nvidia",
  "tesla",
  "uber",
  "airbnb",
  "stripe",
  "coinbase",
  "robinhood",
  "databricks",
  "snowflake",
  "palantir",
  "salesforce",
  "adobe",
  "oracle",
  "linkedin",
  "twitter",
  "x",
  "snap",
  "snapchat",
  "spotify",
  "lyft",
  "doordash",
  "instacart",
  "pinterest",
  "reddit",
  "dropbox",
  "twitch",
  "tiktok",
  "bytedance",
  "openai",
  "anthropic",
  "deepmind",
  "waymo",
  "cruise",
  "github",
  "slack",
  "figma",
  "notion",
  "datadog",
  "crowdstrike",
  "cloudflare",
  "mongodb",
  "elastic",
  "hashicorp",
  "confluent",
  "roblox",
  "epic games",
  "riot games",
  "valve",
  "bloomberg",
  "citadel",
  "citadel securities",
  "two sigma",
  "jane street",
  "de shaw",
  "d.e. shaw",
  "hrt",
  "hudson river trading",
  "jump trading",
  "optiver",
  "sig",
  "susquehanna",
  "virtu",
  "capital one",
  "jpmorgan",
  "jp morgan",
  "goldman sachs",
  "morgan stanley",
  "paypal",
  "square",
  "block",
  "plaid",
  "visa",
  "mastercard",
  "american express",
  "amex",
  "intuit",
  "servicenow",
  "workday",
  "splunk",
  "vmware",
  "broadcom",
  "qualcomm",
  "amd",
  "intel",
  "ibm",
  "cisco",
  "samsung",
  "sony",
  "dell",
  "hp",
  "hewlett packard",
  "sap",
  "zoom",
  "docusign",
  "okta",
  "palo alto networks",
  "fortinet",
  "zscaler",
  "anduril",
  "scale ai",
  "cohere",
  "together ai",
  "perplexity",
  "vercel",
]);

export interface Listing {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  datePosted: string;
  salary: string;
  type: "internship" | "newgrad";
  source: string;
  isFaang: boolean;
  logoUrl: string;
}

function extractLink(cell: string): string {
  // Match markdown link: [text](url)
  const mdLink = cell.match(/\[([^\]]*)\]\(([^)]+)\)/);
  if (mdLink) return mdLink[2];

  // Match bare HTML link
  const htmlLink = cell.match(/href="([^"]+)"/);
  if (htmlLink) return htmlLink[1];

  // Match <a> tag with img inside
  const imgLink = cell.match(/<a[^>]*href="([^"]+)"[^>]*>/);
  if (imgLink) return imgLink[1];

  return "";
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // remove html tags
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // replace md links with text
    .replace(/[🛂🇺🇸🔒🔥🎓]/gu, "") // remove emoji flags
    .replace(/\*\*/g, "")
    .replace(/↳/g, "")
    .trim();
}

function getLogoUrl(company: string): string {
  return "";
}

function parseCvrveTable(markdown: string): Listing[] {
  const listings: Listing[] = [];
  const lines = markdown.split("\n");

  let inTable = false;
  let lastCompany = "";

  for (const line of lines) {
    // Detect if line starts with locked listing
    if (line.includes("🔒")) continue;

    if (line.startsWith("| Company") || line.startsWith("| ---")) {
      inTable = true;
      continue;
    }

    if (!inTable) continue;
    if (!line.startsWith("|")) {
      inTable = false;
      continue;
    }

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length < 4) continue;

    let company = cleanText(cells[0]);
    if (!company || company === "↳") {
      company = lastCompany;
    } else {
      lastCompany = company;
    }

    const role = cleanText(cells[1]);
    const location = cleanText(cells[2]);
    const url = extractLink(cells[3]);
    const datePosted = cleanText(cells[4] || "");

    if (!url) continue;

    const companyLower = company.toLowerCase();
    const isFaang = FAANG_PLUS.has(companyLower);

    listings.push({
      id: `cvrve-${listings.length}`,
      company,
      role,
      location,
      url,
      datePosted,
      salary: "",
      type: "internship",
      source: "cvrve",
      isFaang,
      logoUrl: getLogoUrl(company),
    });
  }

  return listings;
}

function parseSpeedyApplyTable(markdown: string): Listing[] {
  const listings: Listing[] = [];
  const lines = markdown.split("\n");

  let inTable = false;
  let currentSection: "internship" | "newgrad" = "internship";
  let hasSalaryCol = false;

  for (const line of lines) {
    if (line.includes("🔒")) continue;

    // Detect sections
    if (
      line.toLowerCase().includes("internship") &&
      line.startsWith("#")
    ) {
      currentSection = "internship";
      inTable = false;
      continue;
    }
    if (
      line.toLowerCase().includes("new grad") &&
      line.startsWith("#")
    ) {
      currentSection = "newgrad";
      inTable = false;
      continue;
    }

    if (line.startsWith("| Company") || line.startsWith("| ---")) {
      inTable = true;
      hasSalaryCol = line.toLowerCase().includes("salary");
      continue;
    }

    if (!inTable) continue;
    if (!line.startsWith("|")) {
      inTable = false;
      continue;
    }

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length < 4) continue;

    const company = cleanText(cells[0]);
    const role = cleanText(cells[1]);
    const location = cleanText(cells[2]);

    let salary = "";
    let url = "";
    let datePosted = "";

    if (hasSalaryCol && cells.length >= 5) {
      salary = cleanText(cells[3]);
      url = extractLink(cells[4]);
      datePosted = cleanText(cells[5] || "");
    } else {
      url = extractLink(cells[3]);
      datePosted = cleanText(cells[4] || "");
    }

    if (!url || !company) continue;

    const companyLower = company.toLowerCase();
    const isFaang = FAANG_PLUS.has(companyLower);

    listings.push({
      id: `speedy-${listings.length}`,
      company,
      role,
      location,
      url,
      datePosted,
      salary,
      type: currentSection,
      source: "speedyapply",
      isFaang,
      logoUrl: getLogoUrl(company),
    });
  }

  return listings;
}

function extractApplyUrl(applicationCell: string): string {
  // Application cell has Apply link first, then Simplify link. We want the apply link (not simplify.jobs).
  const hrefRegex = /href="(https?:\/\/[^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(applicationCell)) !== null) {
    const url = match[1];
    if (!url.includes("simplify.jobs")) return url;
  }
  return "";
}

function parseSimplifyTable(markdown: string): Listing[] {
  const listings: Listing[] = [];
  let lastCompany = "";

  // Simplify repo uses HTML tables. Only parse active roles (before "Inactive roles").
  const inactiveIndex = markdown.indexOf("Inactive roles");
  const activeContent =
    inactiveIndex > 0 ? markdown.slice(0, inactiveIndex) : markdown;

  // Match each <tr>...</tr> row (non-greedy, multiline)
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(activeContent)) !== null) {
    const rowHtml = rowMatch[1];
    if (rowHtml.includes("🔒")) continue;

    // Extract cell contents: <td>...</td> (non-greedy)
    const cellRegex = /<td>([\s\S]*?)<\/td>/g;
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cellMatch[1]);
    }

    if (cells.length < 5) continue;

    // Skip header row
    const firstCell = cleanText(cells[0]).toLowerCase();
    if (firstCell === "company" || firstCell === "role") continue;

    let company = cleanText(cells[0]);
    if (!company || company === "↳") {
      company = lastCompany;
    } else {
      lastCompany = company;
    }

    const role = cleanText(cells[1]);
    const location = cleanText(cells[2]);
    const url = extractApplyUrl(cells[3]);
    const datePosted = cleanText(cells[4]);

    if (!url || !company) continue;

    const companyLower = company.toLowerCase();
    const isFaang = FAANG_PLUS.has(companyLower);

    listings.push({
      id: `simplify-${listings.length}`,
      company,
      role,
      location,
      url,
      datePosted,
      salary: "",
      type: "newgrad",
      source: "simplify",
      isFaang,
      logoUrl: getLogoUrl(company),
    });
  }

  return listings;
}

// Simple in-memory cache
let cachedListings: Listing[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

async function fetchAllListings(): Promise<Listing[]> {
  const now = Date.now();
  if (cachedListings && now - cacheTime < CACHE_DURATION) {
    return cachedListings;
  }

  const results = await Promise.allSettled(
    SOURCES.map(async (source) => {
      const response = await fetch(source.url, {
        next: { revalidate: 1800 },
      });
      if (!response.ok) throw new Error(`Failed to fetch ${source.name}`);
      const markdown = await response.text();

      switch (source.name) {
        case "cvrve":
          return parseCvrveTable(markdown);
        case "speedyapply":
          return parseSpeedyApplyTable(markdown);
        case "simplify":
          return parseSimplifyTable(markdown);
        default:
          return [];
      }
    })
  );

  const allListings: Listing[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allListings.push(...result.value);
    }
  }

  // Deduplicate by company + role combination
  const seen = new Set<string>();
  const deduped = allListings.filter((listing) => {
    const key = `${listing.company.toLowerCase()}-${listing.role.toLowerCase()}-${listing.location.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  cachedListings = deduped;
  cacheTime = now;

  return deduped;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const typeFilter = searchParams.get("type") || "all"; // all, internship, newgrad
    const faangOnly = searchParams.get("faang") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "20");

    let listings = await fetchAllListings();

    // Apply filters
    if (search) {
      listings = listings.filter(
        (l) =>
          l.company.toLowerCase().includes(search) ||
          l.role.toLowerCase().includes(search) ||
          l.location.toLowerCase().includes(search)
      );
    }

    if (typeFilter !== "all") {
      listings = listings.filter((l) => l.type === typeFilter);
    }

    if (faangOnly) {
      listings = listings.filter((l) => l.isFaang);
    }

    const total = listings.length;
    const start = (page - 1) * perPage;
    const paginatedListings = listings.slice(start, start + perPage);

    return NextResponse.json({
      listings: paginatedListings,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
