"use client";

import { useMemo, useRef, useState } from "react";
import type { Swiper as SwiperClass } from "swiper";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import StoreCardTile from "@/components/home/store-card-tile";
import type { HomeStore } from "@/shared/types/home-marketplace";
import "swiper/css";

const SLIDER_MIN_COUNT = 4;
const SPLIT_PAGE_SIZE = 4;

const SWIPER_BREAKPOINTS = {
  0: { slidesPerView: 1.12, spaceBetween: 10 },
  520: { slidesPerView: 2, spaceBetween: 12 },
  768: { slidesPerView: 3, spaceBetween: 12 },
  1024: { slidesPerView: 4, spaceBetween: 12 },
} as const;

function chunkStores<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size));
  }
  return out;
}

interface StoreCategorySectionProps {
  categoryId: string;
  title: string;
  subtitle: string;
  stores: HomeStore[];
  layoutSplit: boolean;
}

function StoreGrid({
  stores,
  square,
}: {
  stores: HomeStore[];
  square?: boolean;
}): React.ReactElement {
  const n = stores.length;
  if (n === 0) {
    return (
      <p className="text-sm text-muted">Скоро здесь появятся партнёры.</p>
    );
  }
  const v = square ? "square" : "default";
  return (
    <div
      className={
        n === 1
          ? "mx-auto grid max-w-sm grid-cols-1 gap-3"
          : "grid grid-cols-2 gap-3"
      }
    >
      {stores.map((store, i) => (
        <div
          key={store.id}
          className={
            n === 3 && i === 2
              ? "col-span-2 flex justify-center"
              : "min-w-0"
          }
        >
          <div
            className={
              n === 3 && i === 2 ? "w-full max-w-sm" : "h-full w-full"
            }
          >
            <StoreCardTile store={store} variant={v} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TopNavArrows({
  swiperRef,
}: {
  swiperRef: React.RefObject<SwiperClass | null>;
}): React.ReactElement {
  return (
    <div className="flex shrink-0 gap-1">
      <button
        type="button"
        aria-label="Предыдущие"
        onClick={() => swiperRef.current?.slidePrev()}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft bg-card text-foreground shadow-[var(--shadow-card)] transition-colors hover:border-primary hover:text-primary sm:h-10 sm:w-10"
      >
        <i className="fas fa-chevron-left text-xs sm:text-sm" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Следующие"
        onClick={() => swiperRef.current?.slideNext()}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft bg-card text-foreground shadow-[var(--shadow-card)] transition-colors hover:border-primary hover:text-primary sm:h-10 sm:w-10"
      >
        <i className="fas fa-chevron-right text-xs sm:text-sm" aria-hidden />
      </button>
    </div>
  );
}

const sideArrowBtn =
  "flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-full border border-border-soft bg-card text-foreground shadow-[var(--shadow-card)] transition-all hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-0 sm:h-11 sm:w-11";

export default function StoreCategorySection({
  categoryId,
  title,
  subtitle,
  stores,
  layoutSplit,
}: StoreCategorySectionProps): React.ReactElement {
  const swiperRef = useRef<SwiperClass | null>(null);
  const useSlider = stores.length >= SLIDER_MIN_COUNT;
  const headingId = `cat-${categoryId}`;

  const splitChunks = useMemo(
    () => chunkStores(stores, SPLIT_PAGE_SIZE),
    [stores],
  );

  const derivedSplitNav = useMemo(
    () => ({
      canPrev: false,
      canNext: splitChunks.length > 1,
    }),
    [splitChunks.length],
  );

  const [swiperSplitNav, setSwiperSplitNav] = useState<{
    canPrev: boolean;
    canNext: boolean;
  } | null>(null);

  const splitNav = swiperSplitNav ?? derivedSplitNav;

  const syncSplitNavFromSwiper = (s: SwiperClass): void => {
    setSwiperSplitNav({
      canPrev: !s.isBeginning,
      canNext: !s.isEnd,
    });
  };

  const horizontalSlider = useSlider && !layoutSplit ? (
    <Swiper
      modules={[FreeMode]}
      freeMode={{ enabled: true, momentum: true }}
      slidesPerView={1.12}
      spaceBetween={10}
      breakpoints={SWIPER_BREAKPOINTS}
      watchOverflow
      className="home-store-swiper"
      onSwiper={(s) => {
        swiperRef.current = s;
      }}
    >
      {stores.map((store) => (
        <SwiperSlide key={store.id} className="!h-auto">
          <StoreCardTile store={store} />
        </SwiperSlide>
      ))}
    </Swiper>
  ) : null;

  const splitGridSlider = useSlider && layoutSplit ? (
    <div className="flex items-stretch gap-2 sm:gap-3">
      <button
        type="button"
        aria-label="Предыдущая страница"
        disabled={!splitNav.canPrev}
        onClick={() => swiperRef.current?.slidePrev()}
        className={sideArrowBtn}
      >
        <i className="fas fa-chevron-left text-sm" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <Swiper
          slidesPerView={1}
          spaceBetween={16}
          className="home-store-swiper-split"
          onSwiper={(s) => {
            swiperRef.current = s;
            if (typeof window === "undefined") {
              return;
            }
            queueMicrotask(() => {
              syncSplitNavFromSwiper(s);
            });
          }}
          onSlideChange={(s) => syncSplitNavFromSwiper(s)}
        >
          {splitChunks.map((chunk, idx) => (
            <SwiperSlide key={idx} className="!h-auto">
              <div className="grid grid-cols-2 gap-3">
                {chunk.map((store) => (
                  <StoreCardTile
                    key={store.id}
                    store={store}
                    variant="square"
                  />
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <button
        type="button"
        aria-label="Следующая страница"
        disabled={!splitNav.canNext}
        onClick={() => swiperRef.current?.slideNext()}
        className={sideArrowBtn}
      >
        <i className="fas fa-chevron-right text-sm" aria-hidden />
      </button>
    </div>
  ) : null;

  const sliderBlock =
    useSlider && layoutSplit
      ? splitGridSlider
      : useSlider
        ? horizontalSlider
        : (
            <StoreGrid stores={stores} square={layoutSplit} />
          );

  if (layoutSplit) {
    return (
      <section className="mb-9 sm:mb-11" aria-labelledby={headingId}>
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-8">
          <div className="flex flex-col justify-center rounded-2xl border border-border-soft bg-card p-5 sm:p-6">
            <h2
              id={headingId}
              className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {subtitle}
            </p>
          </div>
          <div className="min-w-0">{sliderBlock}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-9 sm:mb-11" aria-labelledby={headingId}>
      <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h2
            id={headingId}
            className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
        </div>
        {useSlider ? <TopNavArrows swiperRef={swiperRef} /> : null}
      </div>
      {sliderBlock}
    </section>
  );
}
