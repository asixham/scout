"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "./search-bar";
import { FilterBar } from "./filter-bar";
import { ListingCard } from "./listing-card";
import { ListingSkeleton } from "./listing-skeleton";
import { useLogoCache } from "@/lib/logo-cache";
import type { Listing } from "@/app/api/listings/route";
import { Loader2, SearchX } from "lucide-react";

interface ApiResponse {
  listings: Listing[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function ListingsFeed() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const initialType = (searchParams.get("type") as "all" | "internship" | "newgrad") ?? "all";
  const initialFaang = searchParams.get("faang") === "true";
  const initialPerPageParam = searchParams.get("perPage");
  const initialPerPage = initialPerPageParam ? parseInt(initialPerPageParam, 10) || 20 : 20;
  const initialSearch = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(initialSearch);
  const [typeFilter, setTypeFilter] = useState<"all" | "internship" | "newgrad">(initialType);
  const [faangOnly, setFaangOnly] = useState(initialFaang);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Keep filters reflected in the URL so users can bookmark/share states
  useEffect(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) params.set("q", debouncedSearch);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (faangOnly) params.set("faang", "true");
    if (perPage !== 20) params.set("perPage", String(perPage));

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [debouncedSearch, typeFilter, faangOnly, perPage, pathname, router]);

  const buildUrl = useCallback(
    (p: number) => {
      const params = new URLSearchParams({
        page: p.toString(),
        perPage: perPage.toString(),
        type: typeFilter,
        faang: faangOnly.toString(),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      return `/api/listings?${params.toString()}`;
    },
    [debouncedSearch, typeFilter, faangOnly, perPage]
  );

  // Initial data fetch
  const { data, error, isLoading } = useSWR<ApiResponse>(
    buildUrl(1),
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  // Reset when filters change
  useEffect(() => {
    setPage(1);
    setAllListings([]);
    setHasMore(true);
  }, [debouncedSearch, typeFilter, faangOnly, perPage]);

  // Sync initial data and derive hasMore from how many we actually have
  useEffect(() => {
    if (!data) return;

    if (page === 1) {
      setAllListings(data.listings);
    }

    // Use the total count from the API plus how many we've loaded so far
    // so we don't rely solely on totalPages, which can be misleading
    // when filters drastically reduce the result set.
    const loadedCount = page === 1 ? data.listings.length : allListings.length;
    const canLoadMore =
      loadedCount < data.total &&
      data.listings.length > 0 &&
      data.page < data.totalPages;

    setHasMore(canLoadMore);
  }, [data, page, allListings.length]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const nextPage = page + 1;
    try {
      const res = await fetch(buildUrl(nextPage));
      const newData: ApiResponse = await res.json();

      setAllListings((prev) => {
        const combined = [...prev, ...newData.listings];

        // Derive hasMore from the combined count + API total
        const canLoadMore =
          combined.length < newData.total &&
          newData.listings.length > 0 &&
          nextPage < newData.totalPages;
        setHasMore(canLoadMore);

        return combined;
      });

      setPage(nextPage);
    } catch (err) {
      console.error("Error loading more:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, buildUrl]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoadingMore, isLoading, loadMore]);

  const displayListings = page === 1 && data ? data.listings : allListings;
  const totalCount = data?.total || 0;
  const { fetchCompanies } = useLogoCache();

  const displayCompanyIds = displayListings
    .map((l) => l.company.toLowerCase())
    .filter((c, i, arr) => arr.indexOf(c) === i)
    .sort()
    .join(",");

  useEffect(() => {
    if (displayListings.length > 0) {
      fetchCompanies(displayListings.map((l) => l.company));
    }
  }, [displayCompanyIds, displayListings.length, fetchCompanies]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col gap-5">
      <SearchBar value={search} onChange={setSearch} />

      <FilterBar
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        faangOnly={faangOnly}
        onFaangToggle={setFaangOnly}
        perPage={perPage}
        onPerPageChange={setPerPage}
        totalCount={totalCount}
      />

      <div className="flex flex-col gap-2">
        {isLoading && allListings.length === 0 && (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <ListingSkeleton key={i} />
            ))}
          </>
        )}

        {!isLoading && displayListings.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <SearchX className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              No listings found. Try adjusting your search or filters.
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-destructive text-center">
              Something went wrong fetching listings. Please try again.
            </p>
          </div>
        )}

        {displayListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-1" />

        {isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {!hasMore && displayListings.length > 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">
            {"You've reached the end of the listings."}
          </p>
        )}
      </div>
    </div>
  );
}
