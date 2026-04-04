"use client";

interface HomeMarketplaceSearchFieldProps {
  query: string;
  onQueryChange: (value: string) => void;
  className?: string;
}

export default function HomeMarketplaceSearchField({
  query,
  onQueryChange,
  className = "",
}: HomeMarketplaceSearchFieldProps): React.ReactElement {
  return (
    <div
      className={`relative min-w-0 flex-1 ${className}`.trim()}
    >
      <label htmlFor="marketplace-search" className="sr-only">
        Поиск магазина
      </label>
      <i
        className="fas fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted"
        aria-hidden
      />
      <input
        id="marketplace-search"
        type="text"
        inputMode="search"
        enterKeyHint="search"
        role="searchbox"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Название магазина или категории…"
        autoComplete="off"
        className="w-full rounded-xl border border-border-soft bg-card py-2.5 pl-10 pr-11 text-base text-foreground outline-none transition-shadow placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/40 sm:py-3"
      />
      {query ? (
        <button
          type="button"
          aria-label="Очистить поиск"
          onClick={() => onQueryChange("")}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border-soft/60 hover:text-foreground"
        >
          <i className="fas fa-xmark text-sm" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
