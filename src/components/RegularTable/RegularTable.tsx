import { useEffect, createElement } from "react";
import "regular-table";
import "regular-table/dist/css/material.css";
import { useRegularTable } from "./useRegularTable";
import { COLUMNS } from "./dataModel";
import "./styles.css";

export function RegularTable() {
  const {
    tableRef,
    columnOrder,
    dragState,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragEnd,
    resetData,
  } = useRegularTable();

  useEffect(() => {
    // regular-table is statically imported above
  }, []);

  const orderedColumns = columnOrder.map((idx) => COLUMNS[idx]);

  return (
    <div className="regular-table-container">
      <div className="table-controls">
        <h2>File Browser with Draggable Columns</h2>
        <button onClick={resetData} className="reset-btn">
          Reset Data
        </button>
      </div>

      <div className="column-headers">
        {orderedColumns.map((col, visualIndex) => (
          <div
            key={`col-${columnOrder[visualIndex]}`}
            className={`column-header ${
              dragState.isDragging && dragState.sourceIndex === columnOrder[visualIndex]
                ? "dragging"
                : ""
            } ${
              dragState.isDragging &&
              dragState.targetIndex === columnOrder[visualIndex] &&
              dragState.sourceIndex !== columnOrder[visualIndex]
                ? "drop-target"
                : ""
            }`}
            draggable
            onDragStart={() => handleColumnDragStart(columnOrder[visualIndex])}
            onDragOver={(e) => {
              e.preventDefault();
              handleColumnDragOver(columnOrder[visualIndex]);
            }}
            onDragEnd={handleColumnDragEnd}
          >
            {col.name}
          </div>
        ))}
      </div>

      {createElement("regular-table", {
        ref: tableRef as React.RefObject<HTMLElement>,
        className: "regular-table",
      })}

      <div className="instructions">
        <p>
          <strong>Drag column headers</strong> to reorder columns
        </p>
        <p>
          <strong>Click on folders</strong> (directories) to expand/collapse
        </p>
      </div>
    </div>
  );
}
