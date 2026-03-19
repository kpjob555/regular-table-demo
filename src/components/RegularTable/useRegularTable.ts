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
        removeEventListener: (event: string, fn: (e: Event) => void) => void;
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

    // Style column headers for drag
    const allTh = table.querySelectorAll("thead th");
    allTh.forEach((th) => {
      th.classList.remove("col-drag-source", "col-drag-target");
    });

    const theadThs = table.querySelectorAll("thead th");
    theadThs.forEach((th) => {
      const meta = table.getMeta(th);
      if (!meta) return;

      const colIdx = meta.x;
      if (dragState.isDragging && colIdx === dragState.sourceIndex) {
        th.classList.add("col-drag-source");
      }
      if (
        dragState.isDragging &&
        dragState.targetIndex !== null &&
        colIdx === dragState.targetIndex
      ) {
        th.classList.add("col-drag-target");
      }
    });
  }, [dragState]);

  const mousedownListener = useCallback(
    (event: Event) => {
      const mouseEvent = event as MouseEvent;
      const target = mouseEvent.target as HTMLElement;

      // Check if it's a table header cell
      if (target.tagName === "TH") {
        const table = tableRef.current as unknown as {
          getMeta: (el: HTMLElement) => {
            x: number;
            y: number;
            value: string;
          };
          resetAutoSize: () => void;
          draw: () => void;
        };

        const meta = table.getMeta(target);
        if (!meta) return;

        // THead column header (y === -1, x >= 0)
        if (meta && meta.y === -1 && meta.x >= 0) {
          mouseEvent.preventDefault();
          const sourceIndex = columnOrder.indexOf(meta.x);
          if (sourceIndex !== -1) {
            setDragState({
              isDragging: true,
              sourceIndex,
              targetIndex: sourceIndex,
            });
          }
          return;
        }

        // TBody directory row (y >= 0, x === 0 with directory type)
        if (meta && meta.y >= 0 && dataRef.current[meta.y]?.type === "directory") {
          toggleDir(dataRef.current, meta.y);
          table.resetAutoSize();
          table.draw();
        }
      }
    },
    [columnOrder],
  );

  const getColumnFromPoint = useCallback(
    (clientX: number): number | null => {
      if (!tableRef.current) return null;

      const table = tableRef.current as unknown as {
        getMeta: (el: HTMLElement) => { x: number; y: number; value: string };
      };

      // Find the TH element under the cursor
      const elements = tableRef.current.querySelectorAll("thead th");
      for (const th of elements) {
        const rect = th.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right) {
          const meta = table.getMeta(th as HTMLElement);
          if (meta && meta.x >= 0) {
            return columnOrder.indexOf(meta.x);
          }
        }
      }
      return null;
    },
    [columnOrder],
  );

  const handleMouseMove = useCallback(
    (event: Event) => {
      if (!dragState.isDragging) return;
      const mouseEvent = event as MouseEvent;

      const targetCol = getColumnFromPoint(mouseEvent.clientX);
      if (targetCol !== null && targetCol !== dragState.targetIndex) {
        setDragState((prev) => ({ ...prev, targetIndex: targetCol }));
      }
    },
    [dragState.isDragging, dragState.targetIndex, getColumnFromPoint],
  );

  const handleMouseUp = useCallback(() => {
    if (!dragState.isDragging) return;

    if (dragState.targetIndex !== null && dragState.sourceIndex !== dragState.targetIndex) {
      setColumnOrder((prev) => {
        const newOrder = [...prev];
        const [moved] = newOrder.splice(dragState.sourceIndex, 1);
        newOrder.splice(dragState.targetIndex!, 0, moved);
        return newOrder;
      });
    }

    setDragState({ isDragging: false, sourceIndex: -1, targetIndex: null });
  }, [dragState]);

  const handleKeyDown = useCallback((event: Event) => {
    const ke = event as KeyboardEvent;
    if (ke.key === "Escape") {
      setDragState({ isDragging: false, sourceIndex: -1, targetIndex: null });
    }
  }, []);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    const tableEl = table as unknown as {
      addStyleListener: (fn: () => void) => void;
      addEventListener: (event: string, fn: (e: Event) => void) => void;
      removeEventListener: (event: string, fn: (e: Event) => void) => void;
    };

    tableEl.addStyleListener(styleListener);
    tableEl.addEventListener("mousedown", mousedownListener);

    return () => {
      tableEl.removeEventListener("mousedown", mousedownListener);
    };
  }, [styleListener, mousedownListener]);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dragState.isDragging, handleMouseMove, handleMouseUp, handleKeyDown]);

  useEffect(() => {
    drawTable();
  }, [drawTable]);

  const resetData = useCallback(() => {
    dataRef.current = createInitialData();
    drawTable();
  }, [drawTable]);

  return {
    tableRef,
    columnOrder,
    dragState,
    resetData,
  };
}
