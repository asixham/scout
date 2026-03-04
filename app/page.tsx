import { Header } from "@/components/scout/header";
import { ListingsFeed } from "@/components/scout/listings-feed";
import { LogoCacheProvider } from "@/lib/logo-cache";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background z-[1]">
      <Header />
      <LogoCacheProvider>
        <ListingsFeed />
      </LogoCacheProvider>
    </main>
  );
}
