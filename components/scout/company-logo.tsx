"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";
import { useMemo, useState } from "react";

interface CompanyLogoProps {
  companyName: string;
  domain?: string;
  size?: number;
}

const CLIENT_ID = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID ?? "";

function buildLogoUrl(domain: string): string {
  const params = new URLSearchParams({
    c: CLIENT_ID,
  });
  return `https://cdn.brandfetch.io/domain/${encodeURIComponent(domain)}?${params.toString()}`;
}

export function CompanyLogo({
  companyName,
  domain,
  size = 44,
}: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);

  const url = useMemo(() => {
    if (!CLIENT_ID || !domain) return "";
    return buildLogoUrl(domain);
  }, [domain]);

  if (!url || hasError) {
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
        onError={() => setHasError(true)}
      />
    </div>
  );
}
