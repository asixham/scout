import { Dela_Gothic_One } from "next/font/google";

const delaGothic = Dela_Gothic_One({
  subsets: ["latin"],
  weight: "400",
});

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/60 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <p className={`${delaGothic.className} text-3xl -translate-y-0.5 leading-none text-foreground`}>
            SCOUT
          </p>
          <span className="rounded-full border border-primary/60 bg-primary/10 px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.16em] text-primary">
            Beta
          </span>
        </div>
      </div>
    </header>
  );
}
