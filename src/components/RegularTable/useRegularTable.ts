import { useRef, useEffect, useCallback, useState } from "react";
import type { FileSystemNode, ColumnDragState } from "./types";
import { createInitialData, createDataListener, toggleDir } from "./dataModel";

export function useRegularTable() {
  const tableRef = useRef<HTMLElement | null>(null);
  const dataRef = useRef<FileSystemNode[]>(createInitialData());
  const [columnOrder, setColumnOrder] = useState<number[]>([0, 1, 2, 3, 4]);
  const [dragState, setDragState] = useState<ColumnDragState>({
    isDragging: false,
    sourceIndex: -1,
    targetIndex: null,
  });

  const drawTable = useCallback(() => {
    if (tableRef.current) {
      const table = tableRef.current as unknown as {
        setDataListener: (fn: (x0: number, y0: number, x1: number, y1: number) => unknown) => void;
        draw: () => void;
        resetAutoSize: () => void;
        addStyleListener: (fn: () => void) => void;
        addEventListener: (event: string, fn: (e: Event) => void) => void;
        querySelectorAll: (sel: string) => HTMLElement[];
        getMeta: (el: HTMLElement) => { x: number; y: number; value: string };
      };

      table.setDataListener(createDataListener(dataRef.current, columnOrder));
      table.draw();
    }
  }, [columnOrder]);

  const styleListener = useCallback(() => {
    if (!tableRef.current) return;

    const table = tableRef.current as unknown as {
      querySelectorAll: (sel: string) => HTMLElement[];
      getMeta: (el: HTMLElement) => { x: number; y: number; value: string };
    };

    for (const th of table.querySelectorAll("tbody th")) {
      const meta = table.getMeta(th);
      if (!meta || meta.y < 0) continue;

      const node = dataRef.current[meta.y];
      if (!node) continue;

      th.classList.remove("rt-directory", "rt-file", "rt-open");
      th.classList.add(node.type === "directory" ? "rt-directory" : "rt-file");
      if (node.isOpen) th.classList.add("rt-open");
    }
  }, []);

  const mousedownListener = useCallback((event: Event) => {
    const mouseEvent = event as MouseEvent;
    const target = mouseEvent.target as HTMLElement;

    if (target.tagName === "TH") {
      const table = tableRef.current as unknown as {
        getMeta: (el: HTMLElement) => { x: number; y: number; value: string };
      };
      const meta = table.getMeta(target);

      if (meta && meta.y >= 0 && dataRef.current[meta.y]?.type === "directory") {
        toggleDir(dataRef.current, meta.y);

        const realTable = tableRef.current as unknown as {
          resetAutoSize: () => void;
          draw: () => void;
        };
        realTable.resetAutoSize();
        realTable.draw();
      }
    }
  }, []);

  useEffect(() => {
    if (!tableRef.current) return;

    const table = tableRef.current as unknown as {
      addStyleListener: (fn: () => void) => void;
      addEventListener: (event: string, fn: (e: Event) => void) => void;
      removeEventListener: (event: string, fn: (e: Event) => void) => void;
    };

    table.addStyleListener(styleListener);
    table.addEventListener("mousedown", mousedownListener);

    return () => {
      table.removeEventListener("mousedown", mousedownListener);
    };
  }, [styleListener, mousedownListener]);

  useEffect(() => {
    drawTable();
  }, [drawTable]);

  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    setColumnOrder((prev) => {
      const newOrder = [...prev];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      return newOrder;
    });
  }, []);

  const handleColumnDragStart = useCallback((index: number) => {
    setDragState({ isDragging: true, sourceIndex: index, targetIndex: null });
  }, []);

  const handleColumnDragOver = useCallback(
    (index: number) => {
      if (dragState.isDragging && index !== dragState.sourceIndex) {
        setDragState((prev) => ({ ...prev, targetIndex: index }));
      }
    },
    [dragState.isDragging, dragState.sourceIndex],
  );

  const handleColumnDragEnd = useCallback(() => {
    if (dragState.isDragging && dragState.targetIndex !== null) {
      moveColumn(dragState.sourceIndex, dragState.targetIndex);
    }
    setDragState({ isDragging: false, sourceIndex: -1, targetIndex: null });
  }, [dragState, moveColumn]);

  const resetData = useCallback(() => {
    dataRef.current = createInitialData();
    drawTable();
  }, [drawTable]);

  return {
    tableRef,
    columnOrder,
    dragState,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragEnd,
    resetData,
  };
}
