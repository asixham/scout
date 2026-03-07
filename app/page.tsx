import { Suspense } from "react";
import { Header } from "@/components/scout/header";
import { ListingsFeed } from "@/components/scout/listings-feed";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background z-[1]">
      <Header />
      <Suspense fallback={null}>
        <ListingsFeed />
      </Suspense>
    </main>
  );
}
