import { NextResponse } from "next/server";

interface BrandSearchResult {
  brandId: string;
  claimed: boolean;
  domain: string;
  name: string;
  icon: string;
  _score: number;
  qualityScore: number;
  verified?: boolean;
}

/** Brandfetch search API returns { icon, name, domain, ... }[]. Icon URLs expire after 24h. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company")?.trim();
  if (!company) {
    return NextResponse.json(
      { error: "Missing company query parameter" },
      { status: 400 }
    );
  }

  const token = process.env.BRANDFETCH_CLIENT_ID;
  if (!token) {
    return NextResponse.json({ logoUrl: null });
  }

  try {
    const res = await fetch(
      `https://api.brandfetch.io/v2/search/${encodeURIComponent(company)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) return NextResponse.json({ logoUrl: null });

    const data = (await res.json()) as BrandSearchResult[] | { message?: string };
    let best: BrandSearchResult | undefined;
    if (Array.isArray(data)) {
      best = data
        .filter((d) => d.icon)
        .sort((a, b) => {
          const va = a.verified ? 1 : 0;
          const vb = b.verified ? 1 : 0;
          if (vb !== va) return vb - va;
          if (b.qualityScore !== a.qualityScore) return b.qualityScore - a.qualityScore;
          return b._score - a._score;
        })[0];
    }

    return NextResponse.json({ logoUrl: best?.icon ?? null });
  } catch {
    return NextResponse.json({ logoUrl: null });
  }
}
