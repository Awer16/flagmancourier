"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Swiper as SwiperClass } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import StoreCardTile from "@/components/home/store-card-tile";
import type { HomeStore } from "@/shared/types/home-marketplace";
import "swiper/css";

const SLIDER_MIN_COUNT = 4;
const SPLIT_PAGE_SIZE = 4;

function chunkStores<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size));
  }
  return out;
}

const sideArrowBtn =
  "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center self-center rounded-full border border-border-soft bg-card text-foreground shadow-[var(--shadow-card)] transition-all hover:border-primary hover:text-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-0 sm:h-10 sm:w-10 lg:h-11 lg:w-11";

const categoryAllBtn =
  "flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center self-center rounded-full border border-border-soft bg-card px-2.5 text-[10px] font-bold uppercase tracking-wide text-foreground shadow-[var(--shadow-card)] transition-all hover:border-primary hover:text-primary sm:h-10 sm:min-w-10 sm:px-3 sm:text-[11px] lg:h-11 lg:min-w-11";

interface SplitCategoryIntroProps {
  headingId: string;
  title: string;
  subtitle: string;
  stores: HomeStore[];
  onApplyCategorySearch: (searchText: string) => void;
}

function SplitCategoryIntro({
  headingId,
  title,
  subtitle,
  stores,
  onApplyCategorySearch,
}: SplitCategoryIntroProps): React.ReactElement {
  const metrics = useMemo(() => {
    const n = stores.length;
    if (n === 0) {
      return null;
    }
    const avgRating =
      stores.reduce((acc, s) => acc + s.rating, 0) / n;
    const minEta = Math.min(...stores.map((s) => s.deliveryEtaMin));
    return { avgRating, minEta };
  }, [stores]);

  const searchCtaLabel = "Смотреть все товары из этой категории";

  return (
    <div className="flex h-full min-h-0 flex-col justify-center gap-5 rounded-2xl border border-border-soft bg-card p-5 sm:p-6 lg:justify-between lg:gap-8 lg:p-8">
      <div className="lg:max-w-md">
        <h2
          id={headingId}
          className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-[1.65rem] lg:leading-tight"
        >
          {title}
        </h2>
        <div
          className="mt-4 hidden h-1 w-14 shrink-0 rounded-full bg-primary/55 lg:block"
          aria-hidden
        />
        <p className="mt-3 text-sm leading-relaxed text-muted lg:mt-5 lg:text-base lg:leading-relaxed">
          {subtitle}
        </p>
      </div>
      <div className="mt-4 flex lg:hidden">
        <button
          type="button"
          aria-label={`${searchCtaLabel}: ${title}`}
          onClick={() => onApplyCategorySearch(title)}
          className={categoryAllBtn}
        >
          All
        </button>
      </div>
      <div
        className={
          metrics
            ? "mt-2 hidden gap-3 lg:mt-0 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-4"
            : "mt-2 hidden flex-col gap-3 lg:mt-0 lg:flex lg:gap-4"
        }
      >
        <button
          type="button"
          onClick={() => onApplyCategorySearch(title)}
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-border-soft bg-border-soft/15 px-3 py-3.5 text-center text-xs font-semibold leading-snug text-foreground transition-colors hover:border-primary hover:text-primary sm:text-[13px] lg:h-full lg:min-h-0"
        >
          <span className="max-w-full">{searchCtaLabel}</span>
          <i className="fas fa-magnifying-glass text-sm text-primary" aria-hidden />
        </button>
        {metrics ? (
          <div className="flex min-h-0 w-full flex-col gap-3 lg:gap-4">
            <dl className="w-full rounded-xl border border-border-soft bg-border-soft/15 px-3 py-3.5">
              <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <i className="fas fa-star text-[13px] text-primary" aria-hidden />
                Средняя оценка
              </dt>
              <dd className="mt-2 font-heading text-lg font-bold tracking-tight text-foreground tabular-nums lg:text-xl">
                {metrics.avgRating.toFixed(1)}
              </dd>
            </dl>
            <dl className="w-full rounded-xl border border-border-soft bg-border-soft/15 px-3 py-3.5">
              <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <i className="fas fa-clock text-[13px] text-primary" aria-hidden />
                Доставка
              </dt>
              <dd className="mt-2 font-heading text-lg font-bold tracking-tight text-foreground lg:text-xl">
                от {metrics.minEta} мин
              </dd>
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface StoreCategorySectionProps {
  categoryId: string;
  title: string;
  subtitle: string;
  stores: HomeStore[];
  layoutSplit: boolean;
  onApplyCategorySearch: (searchText: string) => void;
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
  const compactSquareBand =
    square && n >= 2 && n <= 3
      ? "mx-auto w-full max-w-[17.5rem] sm:max-w-xl lg:max-w-[26rem]"
      : "";
  return (
    <div
      className={
        n === 1
          ? "mx-auto grid max-w-sm grid-cols-1 gap-3"
          : `grid grid-cols-2 gap-3 ${compactSquareBand}`.trim()
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
              n === 3 && i === 2
                ? "w-full max-w-[13rem] sm:max-w-56 lg:max-w-[14rem]"
                : "h-full w-full"
            }
          >
            <StoreCardTile store={store} variant={v} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SplitSlideChunkGrid({ chunk }: { chunk: HomeStore[] }): React.ReactElement {
  const n = chunk.length;
  if (n === 0) {
    return (
      <p className="text-sm text-muted">Скоро здесь появятся партнёры.</p>
    );
  }
  if (n === 1) {
    return (
      <div className="mx-auto w-full max-w-[13rem] sm:max-w-56">
        <StoreCardTile store={chunk[0]} variant="square" />
      </div>
    );
  }
  const compactBand =
    n <= 3
      ? "mx-auto w-full max-w-[17.5rem] sm:max-w-xl lg:max-w-[26rem]"
      : "";
  return (
    <div className={`grid grid-cols-2 gap-2.5 sm:gap-3 ${compactBand}`.trim()}>
      {chunk.map((store, i) => (
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
              n === 3 && i === 2
                ? "w-full max-w-[13rem] sm:max-w-56 lg:max-w-[14rem]"
                : "h-full w-full"
            }
          >
            <StoreCardTile store={store} variant="square" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TopNavArrows({
  swiperRef,
  canPrev,
  canNext,
}: {
  swiperRef: React.RefObject<SwiperClass | null>;
  canPrev: boolean;
  canNext: boolean;
}): React.ReactElement {
  return (
    <div className="flex shrink-0 gap-1">
      <button
        type="button"
        aria-label="Предыдущая страница"
        disabled={!canPrev}
        onClick={() => swiperRef.current?.slidePrev()}
        className={sideArrowBtn}
      >
        <i className="fas fa-chevron-left text-xs sm:text-sm" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Следующая страница"
        disabled={!canNext}
        onClick={() => swiperRef.current?.slideNext()}
        className={sideArrowBtn}
      >
        <i className="fas fa-chevron-right text-xs sm:text-sm" aria-hidden />
      </button>
    </div>
  );
}

interface SplitSliderNavButtonsProps {
  splitNav: { canPrev: boolean; canNext: boolean };
  swiperRef: React.RefObject<SwiperClass | null>;
}

function SplitSliderNavButtons({
  splitNav,
  swiperRef,
}: SplitSliderNavButtonsProps): React.ReactElement {
  return (
    <>
      <button
        type="button"
        aria-label="Предыдущая страница"
        disabled={!splitNav.canPrev}
        onClick={() => swiperRef.current?.slidePrev()}
        className={`${sideArrowBtn} hidden sm:order-1 sm:flex sm:self-center`}
      >
        <i className="fas fa-chevron-left text-xs sm:text-sm" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Следующая страница"
        disabled={!splitNav.canNext}
        onClick={() => swiperRef.current?.slideNext()}
        className={`${sideArrowBtn} hidden sm:order-3 sm:flex sm:self-center`}
      >
        <i className="fas fa-chevron-right text-xs sm:text-sm" aria-hidden />
      </button>
      <div className="flex justify-center gap-2 sm:hidden">
        <button
          type="button"
          aria-label="Предыдущая страница"
          disabled={!splitNav.canPrev}
          onClick={() => swiperRef.current?.slidePrev()}
          className={sideArrowBtn}
        >
          <i className="fas fa-chevron-left text-xs" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Следующая страница"
          disabled={!splitNav.canNext}
          onClick={() => swiperRef.current?.slideNext()}
          className={sideArrowBtn}
        >
          <i className="fas fa-chevron-right text-xs" aria-hidden />
        </button>
      </div>
    </>
  );
}

export default function StoreCategorySection({
  categoryId,
  title,
  subtitle,
  stores,
  layoutSplit,
  onApplyCategorySearch,
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

  const syncSplitNavFromSwiper = useCallback((s: SwiperClass): void => {
    setSwiperSplitNav({
      canPrev: !s.isBeginning,
      canNext: !s.isEnd,
    });
  }, []);

  const bindPagedSwiper = useCallback((s: SwiperClass): void => {
    swiperRef.current = s;
    if (typeof window === "undefined") {
      return;
    }
    queueMicrotask(() => {
      syncSplitNavFromSwiper(s);
    });
  }, [syncSplitNavFromSwiper]);

  const horizontalSlider = useSlider && !layoutSplit ? (
    <Swiper
      slidesPerView={1}
      spaceBetween={16}
      speed={320}
      watchOverflow
      className="home-store-swiper"
      onSwiper={bindPagedSwiper}
      onSlideChange={(s) => syncSplitNavFromSwiper(s)}
    >
      {splitChunks.map((chunk, idx) => (
        <SwiperSlide key={idx} className="!h-auto">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {chunk.map((store) => (
              <StoreCardTile key={store.id} store={store} />
            ))}
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  ) : null;

  const splitGridSlider = useSlider && layoutSplit ? (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
      <div className="order-1 min-w-0 w-full sm:order-2 sm:flex-1">
        <Swiper
          slidesPerView={1}
          spaceBetween={16}
          speed={320}
          className="home-store-swiper-split"
          onSwiper={bindPagedSwiper}
          onSlideChange={(s) => syncSplitNavFromSwiper(s)}
        >
          {splitChunks.map((chunk, idx) => (
            <SwiperSlide key={idx} className="!h-auto">
              <SplitSlideChunkGrid chunk={chunk} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div className="order-2 sm:contents">
        <SplitSliderNavButtons splitNav={splitNav} swiperRef={swiperRef} />
      </div>
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
      <section
        className="mx-auto mt-5 mb-9 w-full max-w-[1000px] rounded-2xl border border-border-soft/50 bg-primary/5 px-3 py-5 sm:mb-11 sm:px-5 sm:py-6 lg:border-border-soft/60 lg:px-8 lg:py-7"
        aria-labelledby={headingId}
      >
        <div className="flex w-full flex-col items-center gap-4 lg:flex-row lg:items-stretch lg:justify-center lg:gap-8">
          <div className="w-full min-w-0 max-w-sm sm:max-w-md">
            <SplitCategoryIntro
              headingId={headingId}
              title={title}
              subtitle={subtitle}
              stores={stores}
              onApplyCategorySearch={onApplyCategorySearch}
            />
          </div>
          <div className="mx-auto w-full min-w-0 max-w-[33rem] shrink-0">
            {sliderBlock}
          </div>
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
        <div className="flex shrink-0 items-end gap-1">
          {useSlider ? (
            <TopNavArrows
              swiperRef={swiperRef}
              canPrev={splitNav.canPrev}
              canNext={splitNav.canNext}
            />
          ) : null}
          <button
            type="button"
            aria-label={`Смотреть все товары из этой категории: ${title}`}
            onClick={() => onApplyCategorySearch(title)}
            className={categoryAllBtn}
          >
            All
          </button>
        </div>
      </div>
      {sliderBlock}
    </section>
  );
}
