"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type LogoCacheContextValue = {
  logoMap: Record<string, string | null>;
  fetchCompanies: (companies: string[]) => void;
};

const LogoCacheContext = createContext<LogoCacheContextValue | null>(null);

const cache = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

function cacheKey(company: string): string {
  return company.toLowerCase().trim();
}

async function fetchLogo(company: string): Promise<string | null> {
  const key = cacheKey(company);
  if (cache.has(key)) return cache.get(key) ?? null;

  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = fetch(
    `/api/logo?company=${encodeURIComponent(company)}`
  )
    .then((r) => r.json())
    .then((d: { logoUrl?: string | null }) => {
      const url =
        typeof d.logoUrl === "string" && d.logoUrl.length > 0 ? d.logoUrl : null;
      return url;
    })
    .catch(() => null)
    .then((url) => {
      cache.set(key, url);
      inFlight.delete(key);
      return url;
    });

  inFlight.set(key, promise);
  return promise;
}

export function LogoCacheProvider({ children }: { children: ReactNode }) {
  const [logoMap, setLogoMap] = useState<Record<string, string | null>>({});
  const mounted = useRef(true);

  const fetchCompanies = useCallback((companies: string[]) => {
    const unique = [...new Set(companies.map((c) => c.trim()).filter(Boolean))];

    const fromCache: Record<string, string | null> = {};
    unique.forEach((c) => {
      const k = cacheKey(c);
      if (cache.has(k)) fromCache[k] = cache.get(k) ?? null;
    });
    if (Object.keys(fromCache).length > 0) {
      setLogoMap((prev) => ({ ...prev, ...fromCache }));
    }

    const toFetch = unique.filter(
      (c) => !cache.has(cacheKey(c)) && !inFlight.has(cacheKey(c))
    );
    if (toFetch.length === 0) return;

    Promise.all(
      toFetch.map(async (company) => {
        const url = await fetchLogo(company);
        return { key: cacheKey(company), url } as const;
      })
    ).then((results) => {
      if (!mounted.current) return;
      const next: Record<string, string | null> = {};
      results.forEach(({ key, url }) => {
        next[key] = url;
      });
      setLogoMap((prev) => ({ ...prev, ...next }));
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return (
    <LogoCacheContext.Provider value={{ logoMap, fetchCompanies }}>
      {children}
    </LogoCacheContext.Provider>
  );
}

export function useLogoCache(): LogoCacheContextValue {
  const ctx = useContext(LogoCacheContext);
  if (!ctx) throw new Error("useLogoCache must be used within LogoCacheProvider");
  return ctx;
}

export function useLogoUrl(company: string, fallbackUrl: string): string {
  const ctx = useContext(LogoCacheContext);
  const key = cacheKey(company);
  const fromState = ctx?.logoMap[key];
  if (typeof fromState === "string" && fromState.length > 0) return fromState;
  const fromCache = cache.get(key);
  if (typeof fromCache === "string" && fromCache.length > 0) return fromCache;
  return fallbackUrl;
}
