"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import HomeMarketplaceSearchField from "@/components/home/home-marketplace-search-field";
import HeaderAuthCluster from "@/components/home/header-auth-cluster";
import SiteContentContainer from "@/components/layout/site-content-container";
import CompanyCard from "@/components/customer/company-card";
import { publicApi, customerApi } from "@/lib/api-client";
import { companyToFrontend } from "@/lib/api-adapters";
import type { Company } from "@/shared/types/customer";
import {
  filterStoresByQuery,
  flattenFeaturedStores,
  HOME_FEATURED_CATEGORIES,
} from "@/lib/home-featured-stores";

export default function HomePageContent(): React.ReactElement {
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    publicApi
      .getCompanies(selectedCity || undefined)
      .then(async (backendCompanies) => {
        if (backendCompanies.length > 0) {
          // Загружаем меню ТОЛЬКО для первых 3 компаний (для отображения на главной)
          // Остальные загрузятся при клике
          const toLoad = backendCompanies.slice(0, 3);
          const others = backendCompanies.slice(3);

          const enrichedLoaded = await Promise.all(
            toLoad.map(async (bc) => {
              try {
                const menu = await customerApi.getCompanyMenu(bc.id);
                return companyToFrontend(bc, menu);
              } catch {
                return companyToFrontend(bc, []);
              }
            })
          );

          const enrichedOthers = others.map((bc) => companyToFrontend(bc, []));
          setCompanies([...enrichedLoaded, ...enrichedOthers]);
          setUseMock(false);
        } else {
          // Backend returned empty — fallback to mock
          setUseMock(true);
        }
      })
      .catch((err) => {
        console.warn("Backend unavailable, using mock data:", err);
        setUseMock(true);
      })
      .finally(() => setLoading(false));
  }, [selectedCity]);

  // Load available cities
  useEffect(() => {
    customerApi.getAvailableCities()
      .then(cities => {
        if (cities.length > 0) setAvailableCities(cities);
      })
      .catch(() => {
        // Backend unavailable — cities will be empty, that's fine
      });
  }, []);

  const flatStores = useMemo(() => flattenFeaturedStores(), []);
  const searchResults = useMemo(
    () => filterStoresByQuery(flatStores, query),
    [flatStores, query],
  );
  const searching = query.trim().length > 0;

  // Filter companies by search
  const filteredCompanies = useMemo(() => {
    if (!query.trim()) return companies;
    const q = query.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.cuisine.toLowerCase().includes(q)
    );
  }, [companies, query]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="sticky top-0 z-30 w-full border-b border-border-soft bg-card/95 shadow-[var(--shadow-card)] backdrop-blur-sm">
        <div className="flex w-full flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex w-full items-center gap-3 sm:w-auto sm:shrink-0">
            <Link
              href="/"
              className="font-heading text-xl font-bold tracking-tight text-foreground transition-colors hover:text-primary sm:text-2xl"
            >
              Курьер.Тут
            </Link>
            <div className="ml-auto sm:hidden">
              <HeaderAuthCluster />
            </div>
          </div>
          <HomeMarketplaceSearchField
            query={query}
            onQueryChange={setQuery}
            className="w-full sm:max-w-xl lg:max-w-2xl"
          />
          <div className="hidden sm:ml-auto sm:flex sm:shrink-0 sm:items-center">
            <HeaderAuthCluster />
          </div>
        </div>
      </header>

      <div className="w-full pb-14 pt-4 sm:pt-6">
        <SiteContentContainer>
          {/* City filter */}
          {!useMock && availableCities.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCity("")}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  !selectedCity
                    ? "bg-primary text-primary-foreground"
                    : "border border-border-soft bg-card text-muted hover:border-primary hover:text-primary"
                }`}
              >
                Все
              </button>
              {availableCities.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCity(c)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedCity === c
                      ? "bg-primary text-primary-foreground"
                      : "border border-border-soft bg-card text-muted hover:border-primary hover:text-primary"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <i className="fas fa-spinner fa-spin text-3xl text-primary" />
            </div>
          ) : useMock ? (
            /* Fallback to mock data if backend unavailable */
            searching ? (
              <MarketplaceSearchResultsMock
                results={searchResults}
                query={query}
                onClear={() => setQuery("")}
              />
            ) : (
              HOME_FEATURED_CATEGORIES.map((cat, index) => (
                <StoreCategorySectionMock
                  key={cat.id}
                  categoryId={cat.id}
                  title={cat.title}
                  subtitle={cat.subtitle}
                  stores={cat.stores}
                  layoutSplit={index % 2 === 1}
                />
              ))
            )
          ) : (
            /* Real companies from backend */
            <div>
              <div className="mb-6">
                <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                  {searching
                    ? `Результаты поиска: "${query}"`
                    : "Рестораны и магазины"}
                </h1>
                <p className="mt-2 text-muted">
                  {searching
                    ? `Найдено: ${filteredCompanies.length}`
                    : `Доступно заведений: ${companies.length}`}
                </p>
              </div>

              {filteredCompanies.length === 0 ? (
                <div className="rounded-2xl border border-border-soft bg-card p-12 text-center">
                  <i className="fas fa-search text-4xl text-muted mb-4 block" />
                  <p className="text-lg text-foreground">Ничего не найдено</p>
                  <p className="mt-1 text-muted">
                    Попробуйте изменить запрос
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCompanies.map((company) => (
                    <CompanyCard key={company.id} company={company} />
                  ))}
                </div>
              )}
            </div>
          )}
        </SiteContentContainer>
      </div>
    </div>
  );
}

// Mock fallback components (simplified)
function MarketplaceSearchResultsMock({
  results,
  query,
  onClear,
}: {
  results: any[];
  query: string;
  onClear: () => void;
}) {
  return (
    <div>
      <h1 className="font-heading text-xl font-bold text-foreground">
        Результаты: {query}
      </h1>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {results.map((r: any, i: number) => (
          <div
            key={i}
            className="rounded-2xl border border-border-soft bg-card p-4"
          >
            <p className="font-semibold text-foreground">{r.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoreCategorySectionMock({
  title,
  stores,
  onApplyCategorySearch,
}: {
  title: string;
  stores: any[];
  categoryId?: string;
  subtitle?: string;
  layoutSplit?: boolean;
  onApplyCategorySearch?: (text: string) => void;
}) {
  return (
    <section className="mb-8">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        {title}
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((s: any, i: number) => (
          <div
            key={i}
            className="rounded-2xl border border-border-soft bg-card p-4"
          >
            <p className="font-semibold text-foreground">{s.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
