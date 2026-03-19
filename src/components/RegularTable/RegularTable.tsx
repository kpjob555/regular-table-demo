import "regular-table";
import "regular-table/dist/css/material.css";
import { useRegularTable } from "./useRegularTable";
import "./styles.css";

export function RegularTable() {
  const { tableRef, resetData } = useRegularTable();

  return (
    <div className="regular-table-container">
      <div className="table-controls">
        <h2>File Browser with Draggable Columns</h2>
        <button onClick={resetData} className="reset-btn">
          Reset Data
        </button>
      </div>

      <regular-table ref={tableRef as React.RefObject<HTMLElement>} className="regular-table" />

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
