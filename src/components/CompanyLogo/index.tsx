import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

interface CompanyLogoProps {
  companyName: string;
  size?: number;
}

type CachedLogo = { url: string; ts: number };

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

const TTL_MS = 24 * 60 * 60 * 1000; // 24h

const norm = (s: string) =>
  s.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").trim();

const makeKey = (name: string) => `company-logo:${norm(name)}`;

export default function CompanyLogo({ companyName, size = 48 }: CompanyLogoProps) {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const cacheKey = useMemo(() => makeKey(companyName), [companyName]);

  useEffect(() => {
    let cancelled = false;

    const readCache = (): string | null => {
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
        // If this key is corrupted, just clear it
        localStorage.removeItem(cacheKey);
        return null;
      }
    };

    const writeCache = (url: string) => {
      try {
        const payload: CachedLogo = { url, ts: Date.now() };
        localStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch {
        // ignore quota errors etc.
      }
    };

    const fetchLogo = async () => {
      // 1) cache hit?
      const cached = readCache();
      if (cached) {
        if (!cancelled) {
          setUrl(cached);
          setLoading(false);
        }
        return;
      }

      // 2) fetch
      try {
        const res = await fetch(
          `https://api.brandfetch.io/v2/search/${encodeURIComponent(companyName)}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.BRANDFETCH_TOKEN}`,
            },
          }
        );

        const data = (await res.json()) as BrandSearchResult[] | { message?: string };
        if (!Array.isArray(data) || data.length === 0) throw new Error("No results");

        // Prefer verified, then highest qualityScore, then original order
        const best = [...data]
          .filter((d) => d.icon)
          .sort((a, b) => {
            const va = a.verified ? 1 : 0;
            const vb = b.verified ? 1 : 0;
            if (vb !== va) return vb - va;
            if (b.qualityScore !== a.qualityScore) return b.qualityScore - a.qualityScore;
            return b._score - a._score;
          })[0];

        if (best?.icon) {
          if (!cancelled) {
            setUrl(best.icon);
            writeCache(best.icon);
          }
        }
      } catch {
        // Swallow and let fallback UI render
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    setUrl("");
    fetchLogo();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, companyName]);

  if (loading) {
    return <div className="animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" style={{ width: size, height: size }} />;
  }

  if (!url) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="rounded-full bg-gray-200 dark:bg-gray-700" style={{ width: size * 0.6, height: size * 0.6 }} />
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
        onError={() => setUrl("")}
        unoptimized
      />
    </div>
  );
}
