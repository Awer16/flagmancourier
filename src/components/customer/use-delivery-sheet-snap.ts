"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";

const HEADER_PX = 56;
const PEEK_PX = 96;
const DRAG_THRESHOLD_PX = 12;

export type SheetSnap = 0 | 1 | 2;

function computeHeights(): [number, number, number] {
  if (typeof window === "undefined") {
    return [96, 420, 720];
  }
  const vh = window.innerHeight;
  const avail = Math.max(180, vh - HEADER_PX);
  const peek = PEEK_PX;
  const half = Math.round(avail * 0.5);
  const full = Math.round(avail);
  return [peek, Math.max(peek + 96, half), full];
}

function nearestSnap(
  h: number,
  triple: readonly [number, number, number],
): SheetSnap {
  let best: SheetSnap = 0;
  let bestD = Infinity;
  for (let i = 0; i < 3; i++) {
    const d = Math.abs(triple[i] - h);
    if (d < bestD) {
      bestD = d;
      best = i as SheetSnap;
    }
  }
  return best;
}

function clamp(n: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, n));
}

export function useDeliverySheetSnap(): {
  snap: SheetSnap;
  snapHeights: [number, number, number];
  dragging: boolean;
  sheetHeightPx: number;
  handlePointerDown: (e: PointerEvent<HTMLElement>) => void;
  handlePointerMove: (e: PointerEvent<HTMLElement>) => void;
  handlePointerUp: (e: PointerEvent<HTMLElement>) => void;
  handlePointerCancel: (e: PointerEvent<HTMLElement>) => void;
  onHandleClick: () => void;
  contentHidden: boolean;
  collapseToPeek: () => void;
  snapTo: (next: SheetSnap) => void;
} {
  const [snap, setSnap] = useState<SheetSnap>(1);
  const [heights, setHeights] = useState<[number, number, number]>([
    96, 420, 720,
  ]);
  const [dragging, setDragging] = useState(false);
  const [liveHeight, setLiveHeight] = useState<number | null>(null);

  const startYRef = useRef(0);
  const startHRef = useRef(0);
  const didDragRef = useRef(false);
  const heightsRef = useRef(heights);
  const snapRef = useRef(snap);
  const liveHeightRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- синхронизация высот с viewport после монтирования
    setHeights(computeHeights());
  }, []);

  useEffect(() => {
    heightsRef.current = heights;
  }, [heights]);

  useEffect(() => {
    snapRef.current = snap;
  }, [snap]);

  useEffect(() => {
    const onResize = (): void => {
      setHeights(computeHeights());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const sheetHeightPx = liveHeight ?? heights[snap];
  const contentHidden = sheetHeightPx < heights[0] + 40;

  useEffect(() => {
    if (dragging) {
      return;
    }
    window.dispatchEvent(new Event("resize"));
  }, [sheetHeightPx, dragging]);

  const finishPointer = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const triple = heightsRef.current;
      const h = liveHeightRef.current ?? triple[snapRef.current];
      setSnap(nearestSnap(h, triple));
      liveHeightRef.current = null;
      setLiveHeight(null);
      setDragging(false);
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      didDragRef.current = false;
      const triple = heightsRef.current;
      const s = snapRef.current;
      const h0 = liveHeightRef.current ?? triple[s];
      startYRef.current = e.clientY;
      startHRef.current = h0;
      liveHeightRef.current = h0;
      setDragging(true);
      setLiveHeight(h0);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) {
        return;
      }
      const dy = e.clientY - startYRef.current;
      if (Math.abs(dy) > DRAG_THRESHOLD_PX) {
        didDragRef.current = true;
      }
      const triple = heightsRef.current;
      const next = clamp(startHRef.current - dy, triple[0], triple[2]);
      liveHeightRef.current = next;
      setLiveHeight(next);
    },
    [],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      finishPointer(e);
    },
    [finishPointer],
  );

  const handlePointerCancel = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      finishPointer(e);
    },
    [finishPointer],
  );

  const onHandleClick = useCallback(() => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setSnap((s) => ((s + 1) % 3) as SheetSnap);
  }, []);

  const collapseToPeek = useCallback(() => {
    liveHeightRef.current = null;
    setLiveHeight(null);
    setDragging(false);
    setSnap(0);
  }, []);

  const snapTo = useCallback((next: SheetSnap) => {
    liveHeightRef.current = null;
    setLiveHeight(null);
    setDragging(false);
    setSnap(next);
  }, []);

  return {
    snap,
    snapHeights: heights,
    dragging,
    sheetHeightPx,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    onHandleClick,
    contentHidden,
    collapseToPeek,
    snapTo,
  };
}
