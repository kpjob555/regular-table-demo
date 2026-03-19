export interface FileSystemNode {
  path: string[];
  row: (string | boolean)[];
  isOpen: boolean;
  type: "directory" | "file";
}

export interface TreeTableColumn {
  name: string;
  accessor: keyof FileSystemNode["row"] | "name";
  width?: number;
}

export interface TreeTableData {
  num_rows: number;
  num_columns: number;
  row_headers: string[][];
  column_headers: string[][];
  data: (string | boolean)[][];
}

export interface ColumnDragState {
  isDragging: boolean;
  sourceIndex: number;
  targetIndex: number | null;
}
