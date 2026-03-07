import { NextResponse } from "next/server";

interface BrandSearchResult {
  brandId: string;
  domain: string;
}

interface BrandFormat {
  src: string;
  format: string;
  width: number | null;
  height: number | null;
}

interface BrandLogo {
  theme: string;
  formats: BrandFormat[];
  type: string;
}

interface BrandDetails {
  logos?: BrandLogo[];
}

interface CachedAsset {
  assetUrl: string | null;
  expiresAt: number;
}

const SUCCESS_TTL_MS = 24 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 60 * 60 * 1000;
const assetCache = new Map<string, CachedAsset>();
const inFlight = new Map<string, Promise<string | null>>();

function cacheKey(company: string): string {
  return company.trim().toLowerCase();
}

function getCachedAsset(company: string): string | null | undefined {
  const entry = assetCache.get(cacheKey(company));
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    assetCache.delete(cacheKey(company));
    return undefined;
  }
  return entry.assetUrl;
}

function pickAssetUrl(brand: BrandDetails): string | null {
  const logos = brand.logos ?? [];
  const typeOrder = ["icon", "symbol", "logo"];
  const formatOrder = ["png", "webp", "jpeg", "jpg", "svg"];

  for (const type of typeOrder) {
    const candidates = logos.filter((logo) => logo.type === type);
    for (const format of formatOrder) {
      for (const logo of candidates) {
        const match = logo.formats.find((item) => item.src && item.format === format);
        if (match?.src) return match.src;
      }
    }
    for (const logo of candidates) {
      const match = logo.formats.find((item) => item.src);
      if (match?.src) return match.src;
    }
  }

  for (const logo of logos) {
    const match = logo.formats.find((item) => item.src);
    if (match?.src) return match.src;
  }

  return null;
}

async function lookupAssetUrl(company: string, token: string): Promise<string | null> {
  const cachedAsset = getCachedAsset(company);
  if (cachedAsset !== undefined) return cachedAsset;

  const key = cacheKey(company);
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = fetch(`https://api.brandfetch.io/v2/search/${encodeURIComponent(company)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 3600 },
  })
    .then(async (res) => {
      if (!res.ok) return null;

      const results = (await res.json()) as BrandSearchResult[] | { message?: string };
      if (!Array.isArray(results) || results.length === 0) return null;

      const firstMatch = results[0];
      if (!firstMatch?.domain) return null;

      const brandRes = await fetch(
        `https://api.brandfetch.io/v2/brands/${encodeURIComponent(firstMatch.domain)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          next: { revalidate: 3600 },
        }
      );
      if (!brandRes.ok) return null;

      const brand = (await brandRes.json()) as BrandDetails;
      return pickAssetUrl(brand);
    })
    .catch(() => null)
    .then((assetUrl) => {
      assetCache.set(key, {
        assetUrl,
        expiresAt: Date.now() + (assetUrl ? SUCCESS_TTL_MS : FAILURE_TTL_MS),
      });
      inFlight.delete(key);
      return assetUrl;
    });

  inFlight.set(key, request);
  return request;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company")?.trim();
  if (!company) {
    return new NextResponse(null, { status: 400 });
  }

  const token = process.env.BRANDFETCH_CLIENT_ID;
  if (!token) {
    return new NextResponse(null, { status: 404 });
  }

  const assetUrl = await lookupAssetUrl(company, token);
  if (!assetUrl) {
    return new NextResponse(null, {
      status: 404,
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  }

  try {
    const imageRes = await fetch(assetUrl, {
      cache: "no-store",
    });
    if (!imageRes.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const contentType = imageRes.headers.get("content-type") ?? "image/png";
    const buffer = await imageRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Type": contentType,
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
