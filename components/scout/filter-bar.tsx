"use client";

import { cn } from "@/lib/utils";

interface FilterBarProps {
  typeFilter: "all" | "internship" | "newgrad";
  onTypeChange: (type: "all" | "internship" | "newgrad") => void;
  faangOnly: boolean;
  onFaangToggle: (value: boolean) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  totalCount: number;
}

export function FilterBar({
  typeFilter,
  onTypeChange,
  faangOnly,
  onFaangToggle,
  perPage,
  onPerPageChange,
  totalCount,
}: FilterBarProps) {
  const typeOptions: { value: "all" | "internship" | "newgrad"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "internship", label: "Internships" },
    { value: "newgrad", label: "New Grad" },
  ];

  const perPageOptions = [20, 50, 100];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center rounded-lg border border-border bg-secondary p-0.5">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onTypeChange(option.value)}
              className={cn(
                "px-3.5 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer",
                typeFilter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onFaangToggle(!faangOnly)}
          className={cn(
            "px-3.5 py-1.5 text-sm font-medium rounded-lg border transition-all cursor-pointer",
            faangOnly
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground"
          )}
        >
          FAANG+
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {totalCount.toLocaleString()} listings
        </span>

        <div className="flex items-center rounded-lg border border-border bg-secondary p-0.5">
          {perPageOptions.map((option) => (
            <button
              key={option}
              onClick={() => onPerPageChange(option)}
              className={cn(
                "px-3.5 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer",
                perPage === option
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
