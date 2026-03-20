import "regular-table";
import "regular-table/dist/css/material.css";
import { useRegularTable } from "./useRegularTable";
import "./styles.css";

export function RegularTable() {
  const { tableRef } = useRegularTable();

  return (
    <div className="regular-table-container">
      <regular-table
        ref={tableRef as React.RefObject<HTMLElement>}
        className="regular-table"
      />
    </div>
  );
}
