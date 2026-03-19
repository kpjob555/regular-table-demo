import { useRef, useEffect, useCallback, useState } from "react";
import type { FileSystemNode } from "./types";
import { createInitialData, createDataListener, toggleDir } from "./dataModel";

export function useRegularTable() {
  const tableRef = useRef<HTMLElement | null>(null);
  const dataRef = useRef<FileSystemNode[]>(createInitialData());
  const columnOrderRef = useRef<number[]>([0, 1, 2, 3, 4]);
  const [columnOrder, setColumnOrder] = useState<number[]>([0, 1, 2, 3, 4]);

  // Drag state lives in a ref so event handlers always get the latest value
  const dragRef = useRef<{ dragging: boolean; sourceIndex: number; targetIndex: number | null }>({
    dragging: false,
    sourceIndex: -1,
    targetIndex: null,
  });

  // Force re-render for visual drag feedback
  const rerender = useCallback(() => {}, []);

  const drawTable = useCallback(() => {
    if (!tableRef.current) return;

    const table = tableRef.current as unknown as {
      setDataListener: (fn: (x0: number, y0: number, x1: number, y1: number) => unknown) => void;
      draw: () => void;
      resetAutoSize: () => void;
      addStyleListener: (fn: () => void) => void;
      addEventListener: (event: string, fn: (e: Event) => void) => void;
      removeEventListener: (event: string, fn: (e: Event) => void) => void;
    };

    table.setDataListener(createDataListener(dataRef.current, columnOrderRef.current));
    table.draw();
  }, []);

  const styleListener = useCallback(() => {
    if (!tableRef.current) return;

    const table = tableRef.current as unknown as {
      querySelectorAll: (sel: string) => Element[];
      getMeta: (el: HTMLElement) => { x: number; y: number; value: string };
    };

    // Body row icons
    for (const th of table.querySelectorAll("tbody th")) {
      const meta = table.getMeta(th as HTMLElement);
      if (!meta || meta.y < 0) continue;

      const node = dataRef.current[meta.y];
      if (!node) continue;

      th.classList.remove("rt-directory", "rt-file", "rt-open");
      th.classList.add(node.type === "directory" ? "rt-directory" : "rt-file");
      if (node.isOpen) th.classList.add("rt-open");
    }

    // Column header drag styling
    for (const th of table.querySelectorAll("thead th")) {
      const meta = table.getMeta(th as HTMLElement);
      if (!meta || meta.x < 0) continue;

      (th as HTMLElement).draggable = true;
      th.classList.remove("col-drag-source", "col-drag-target");

      const visualIdx = columnOrderRef.current.indexOf(meta.x);
      if (dragRef.current.dragging) {
        if (visualIdx === dragRef.current.sourceIndex) {
          th.classList.add("col-drag-source");
        }
        if (dragRef.current.targetIndex !== null && visualIdx === dragRef.current.targetIndex) {
          th.classList.add("col-drag-target");
        }
      }
    }
  }, []);

  // ── Directory toggle (click on tbody th) ────────────────────────
  const handleTableMousedown = useCallback((event: Event) => {
    const target = (event as MouseEvent).target as HTMLElement;
    if (target.tagName !== "TH") return;

    const table = tableRef.current as unknown as {
      getMeta: (el: HTMLElement) => { x: number; y: number; value: string };
      resetAutoSize: () => void;
      draw: () => void;
    };

    const meta = table.getMeta(target);
    if (!meta || meta.y < 0) return;

    if (dataRef.current[meta.y]?.type === "directory") {
      toggleDir(dataRef.current, meta.y);
      table.resetAutoSize();
      table.draw();
    }
  }, []);

  // ── Native HTML5 Drag Events ─────────────────────────────────────
  const handleDragStart = useCallback(
    (event: Event) => {
      const target = (event as DragEvent).target as HTMLElement;
      if (target.tagName !== "TH") return;

      const table = tableRef.current as unknown as {
        getMeta: (el: HTMLElement) => { x: number; y: number; value: string };
      };

      const meta = table.getMeta(target);
      if (!meta || meta.x < 0) return;

      const sourceIndex = columnOrderRef.current.indexOf(meta.x);
      if (sourceIndex === -1) return;

      dragRef.current = { dragging: true, sourceIndex, targetIndex: sourceIndex };
      rerender();

      const ev = event as DragEvent;
      ev.dataTransfer?.setData("text/plain", String(sourceIndex));
      if (ev.dataTransfer) {
        ev.dataTransfer.effectAllowed = "move";
      }
    },
    [rerender],
  );

  const handleDragOver = useCallback(
    (event: Event) => {
      event.preventDefault();
      if (!dragRef.current.dragging) return;

      const targetEl = (event.target as HTMLElement).closest("thead th") as HTMLElement | null;
      if (!targetEl) return;

      const table = tableRef.current as unknown as {
        getMeta: (el: HTMLElement) => { x: number; y: number; value: string };
      };

      const meta = table.getMeta(targetEl);
      if (!meta || meta.x < 0) return;

      const targetIndex = columnOrderRef.current.indexOf(meta.x);
      if (targetIndex !== -1 && targetIndex !== dragRef.current.targetIndex) {
        dragRef.current = { ...dragRef.current, targetIndex };
        rerender();
      }

      (event as DragEvent).dataTransfer!.dropEffect = "move";
    },
    [rerender],
  );

  const handleDrop = useCallback(
    (event: Event) => {
      event.preventDefault();
      if (!dragRef.current.dragging) return;

      const { sourceIndex, targetIndex } = dragRef.current;
      dragRef.current = { dragging: false, sourceIndex: -1, targetIndex: null };
      rerender();

      if (sourceIndex !== targetIndex && targetIndex !== null) {
        setColumnOrder((prev) => {
          const next = [...prev];
          const [moved] = next.splice(sourceIndex, 1);
          next.splice(targetIndex!, 0, moved);
          columnOrderRef.current = next;
          return next;
        });
      }
    },
    [rerender],
  );

  const handleDragEnd = useCallback(() => {
    dragRef.current = { dragging: false, sourceIndex: -1, targetIndex: null };
    rerender();
  }, [rerender]);

  // ── Setup / teardown ────────────────────────────────────────────
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    const el = table as unknown as {
      addStyleListener: (fn: () => void) => void;
      addEventListener: (event: string, fn: (e: Event) => void) => void;
      removeEventListener: (event: string, fn: (e: Event) => void) => void;
    };

    el.addStyleListener(styleListener);
    el.addEventListener("mousedown", handleTableMousedown);

    table.addEventListener("dragstart", handleDragStart);
    table.addEventListener("dragover", handleDragOver);
    table.addEventListener("drop", handleDrop);
    table.addEventListener("dragend", handleDragEnd);

    return () => {
      el.removeEventListener("mousedown", handleTableMousedown);
      table.removeEventListener("dragstart", handleDragStart);
      table.removeEventListener("dragover", handleDragOver);
      table.removeEventListener("drop", handleDrop);
      table.removeEventListener("dragend", handleDragEnd);
    };
  }, [
    styleListener,
    handleTableMousedown,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  ]);

  useEffect(() => {
    columnOrderRef.current = columnOrder;
    drawTable();
  }, [columnOrder, drawTable]);

  const resetData = useCallback(() => {
    dataRef.current = createInitialData();
    drawTable();
  }, [drawTable]);

  return { tableRef, resetData };
}
