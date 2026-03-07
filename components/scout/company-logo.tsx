"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface CompanyLogoProps {
  companyName: string;
  size?: number;
}

type CachedLogo = {
  url: string;
  ts: number;
};

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

const TTL_MS = 24 * 60 * 60 * 1000;
const CLIENT_ID = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID ?? "";

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

function makeKey(name: string): string {
  return `company-logo:${normalizeName(name)}`;
}

function buildLogoUrl(domain: string): string {
  const params = new URLSearchParams({
    c: CLIENT_ID,
  });
  return `https://cdn.brandfetch.io/domain/${encodeURIComponent(domain)}?${params.toString()}`;
}

function readCache(cacheKey: string): string | null {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;

    const { url, ts } = JSON.parse(raw) as CachedLogo;
    if (!url || typeof ts !== "number") return null;

    if (Date.now() - ts > TTL_MS) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return url;
  } catch {
    localStorage.removeItem(cacheKey);
    return null;
  }
}

function writeCache(cacheKey: string, url: string): void {
  try {
    const payload: CachedLogo = { url, ts: Date.now() };
    localStorage.setItem(cacheKey, JSON.stringify(payload));
  } catch {
    // Ignore storage quota and serialization errors.
  }
}

export function CompanyLogo({ companyName, size = 44 }: CompanyLogoProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const cacheKey = useMemo(() => makeKey(companyName), [companyName]);

  useEffect(() => {
    let cancelled = false;

    async function fetchLogo() {
      const cached = readCache(cacheKey);
      if (cached) {
        if (!cancelled) {
          setUrl(cached);
          setLoading(false);
        }
        return;
      }

      if (!CLIENT_ID) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          c: CLIENT_ID,
        });
        const res = await fetch(
          `https://api.brandfetch.io/v2/search/${encodeURIComponent(companyName)}?${params.toString()}`
        );
        const data = (await res.json()) as BrandSearchResult[] | { message?: string };
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No results");
        }

        const best = [...data]
          .filter((item) => item.domain)
          .sort((a, b) => {
            const aVerified = a.verified ? 1 : 0;
            const bVerified = b.verified ? 1 : 0;
            if (bVerified !== aVerified) return bVerified - aVerified;
            if (b.qualityScore !== a.qualityScore) return b.qualityScore - a.qualityScore;
            return b._score - a._score;
          })[0];

        if (!best?.domain) {
          throw new Error("No domain");
        }

        const nextUrl = buildLogoUrl(best.domain);
        if (!cancelled) {
          setUrl(nextUrl);
          writeCache(cacheKey, nextUrl);
        }
      } catch {
        if (!cancelled) {
          setUrl("");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    setUrl("");
    void fetchLogo();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, companyName]);

  if (loading) {
    return (
      <div
        className="animate-pulse rounded-md bg-muted"
        style={{ width: size, height: size }}
      />
    );
  }

  if (!url) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-secondary"
        style={{ width: size, height: size }}
      >
        <Building2 className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image
        src={url}
        alt={`${companyName} logo`}
        fill
        className="rounded-md object-contain"
        sizes={`${size}px`}
        unoptimized
        onError={() => setUrl("")}
      />
    </div>
  );
}
