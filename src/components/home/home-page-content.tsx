"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import HomeMarketplaceSearchField from "@/components/home/home-marketplace-search-field";
import MarketplaceSearchResults from "@/components/home/marketplace-search-results";
import StoreCategorySection from "@/components/home/store-category-section";
import ThemeSwitcher from "@/components/theme/theme-switcher";
import SiteContentContainer from "@/components/layout/site-content-container";
import {
  filterStoresByQuery,
  flattenFeaturedStores,
  HOME_FEATURED_CATEGORIES,
} from "@/lib/home-featured-stores";

export default function HomePageContent(): React.ReactElement {
  const [query, setQuery] = useState("");
  const flatStores = useMemo(() => flattenFeaturedStores(), []);
  const searchResults = useMemo(
    () => filterStoresByQuery(flatStores, query),
    [flatStores, query],
  );
  const searching = query.trim().length > 0;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="sticky top-0 z-30 w-full border-b border-border-soft bg-card/95 shadow-[var(--shadow-card)] backdrop-blur-sm">
        <div className="flex w-full flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex w-full items-center gap-3 sm:w-auto sm:shrink-0">
            <Link
              href="/"
              className="font-heading text-xl font-bold tracking-tight text-foreground transition-colors hover:text-primary sm:text-2xl"
            >
              Courier.Here
            </Link>
            <div className="ml-auto sm:hidden">
              <ThemeSwitcher />
            </div>
          </div>
          <HomeMarketplaceSearchField
            query={query}
            onQueryChange={setQuery}
            className="w-full sm:max-w-xl lg:max-w-2xl"
          />
          <div className="hidden sm:ml-auto sm:block sm:shrink-0">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <div className="w-full pb-14 pt-4 sm:pt-6">
        <SiteContentContainer>
          {searching ? (
            <MarketplaceSearchResults
              results={searchResults}
              query={query}
              onClear={() => setQuery("")}
            />
          ) : (
            HOME_FEATURED_CATEGORIES.map((cat, index) => (
              <StoreCategorySection
                key={cat.id}
                categoryId={cat.id}
                title={cat.title}
                subtitle={cat.subtitle}
                stores={cat.stores}
                layoutSplit={index % 2 === 1}
                onApplyCategorySearch={(text) => {
                  setQuery(text);
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              />
            ))
          )}
        </SiteContentContainer>
      </div>
    </div>
  );
}
