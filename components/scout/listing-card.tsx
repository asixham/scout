"use client";

import { ExternalLink, MapPin, DollarSign, Building2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import type { Listing } from "@/app/api/listings/route";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const [showIcon, setShowIcon] = useState(!listing.logoUrl);

  useEffect(() => {
    setShowIcon(!listing.logoUrl);
  }, [listing.logoUrl]);

  const handleImgError = useCallback(() => {
    setShowIcon(true);
  }, []);

  const showImg = !showIcon && listing.logoUrl;

  return (
    <span className="card-glow-wrapper">
      <a
        href={listing.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex gap-4 items-center rounded-lg border border-border bg-card p-4 card-glow"
      >
      <div className="flex-shrink-0 h-11 w-11 rounded-lg bg-secondary flex items-center justify-center overflow-hidden border border-border">
        {showImg ? (
          <img
            key={listing.logoUrl}
            src={listing.logoUrl}
            alt={`${listing.company} logo`}
            className="h-full w-full object-contain"
            onError={handleImgError}
            loading="lazy"
          />
        ) : (
          <Building2 className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {listing.company}
                </h3>
                {listing.isFaang && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-primary/15 text-primary">
                    FAANG+
                  </span>
                )}
                <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded bg-secondary text-muted-foreground capitalize">
                  {listing.type === "newgrad" ? "New Grad" : "Internship"}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-secondary-foreground max-w-full">
                {listing.role}
              </p>
            </div>
            <ExternalLink className="flex-shrink-0 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {listing.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[250px]">{listing.location}</span>
              </span>
            )}
            {listing.salary && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <DollarSign className="h-3 w-3" />
                {listing.salary}
              </span>
            )}
            {listing.datePosted && (
              <span className="text-xs text-muted-foreground">
                {listing.datePosted}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
    </span>
  );
}
