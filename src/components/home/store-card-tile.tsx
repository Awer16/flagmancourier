import Image from "next/image";
import Link from "next/link";
import type { HomeStore } from "@/shared/types/home-marketplace";

interface StoreCardTileProps {
  store: HomeStore;
  variant?: "default" | "square";
}

export default function StoreCardTile({
  store,
  variant = "default",
}: StoreCardTileProps): React.ReactElement {
  if (variant === "square") {
    return (
      <Link href="/customer" className="block min-w-0">
        <article className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border-soft bg-card shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]">
          <Image
            src={store.imageUrl}
            alt={store.name}
            fill
            sizes="(max-width: 640px) 46vw, 22vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
            <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white sm:text-[15px]">
              {store.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-white/90">
              <span className="inline-flex items-center gap-0.5">
                <i className="fas fa-star text-amber-300" aria-hidden />
                {store.rating.toFixed(1)}
              </span>
              <span aria-hidden>|</span>
              <span>
                <i className="fas fa-clock mr-0.5" aria-hidden />
                {store.deliveryEtaMin} мин
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href="/customer" className="flex h-full w-full min-w-0">
      <article className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border-soft bg-card shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]">
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-border-soft/50">
          <Image
            src={store.imageUrl}
            alt={store.name}
            fill
            sizes="(max-width: 520px) 88vw, (max-width: 768px) 45vw, (max-width: 1024px) 31vw, 22vw"
            className="object-cover"
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-3.5">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground sm:text-base">
            {store.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
              <i className="fas fa-star text-[11px] text-amber-400" aria-hidden />
              {store.rating.toFixed(1)}
            </span>
            <span className="text-border-soft" aria-hidden>
              |
            </span>
            <span>
              <i className="fas fa-clock mr-1 text-[10px]" aria-hidden />
              {store.deliveryEtaMin} мин
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
