import type { FileSystemNode, TreeTableColumn, TreeTableData } from "./types";

export const COLUMNS: TreeTableColumn[] = [
  { name: "Name", accessor: "name", width: 200 },
  { name: "Size", accessor: 0, width: 100 },
  { name: "Kind", accessor: 1, width: 100 },
  { name: "Modified", accessor: 2, width: 180 },
  { name: "Writable", accessor: 3, width: 80 },
];

function newPath(n: number, name: string): string[] {
  return Array(n).fill("").concat([name]);
}

function formatNumber(x: number): string {
  const formatter = new Intl.NumberFormat("en-us", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(x);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-us", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).format(date);
}

function generateNode(type: "directory" | "file", depth: number, index: number): FileSystemNode {
  const scale = Math.random() > 0.5 ? "KB" : "MB";
  const size = formatNumber(Math.pow(Math.random(), 2) * 1000);
  const date = formatDate(new Date());
  const name = type === "directory" ? `Dir_${index}` : `File_${index}.txt`;
  const row: (string | boolean)[] =
    type === "directory"
      ? [`${size} ${scale}`, "directory", date, true]
      : [`${size} ${scale}`, "file", date, Math.random() > 0.3];

  return {
    path: newPath(depth, name),
    row,
    isOpen: false,
    type,
  };
}

function* generateContents(depth: number, dirCount = 3, fileCount = 5): Generator<FileSystemNode> {
  for (let i = 0; i < dirCount; i++) {
    yield generateNode("directory", depth, i);
  }
  for (let i = 0; i < fileCount; i++) {
    yield generateNode("file", depth, i);
  }
}

function closeDir(data: FileSystemNode[], y: number): void {
  const pathLength = data[y].path.length;
  while (y + 2 < data.length && data[y + 1].path.length > pathLength) {
    data.splice(y + 1, 1);
  }
}

function openDir(data: FileSystemNode[], y: number): void {
  const depth = data[y].path.length;
  const newContents = generateContents(depth);
  data.splice(y + 1, 0, ...Array.from(newContents));
}

export function toggleDir(data: FileSystemNode[], y: number): void {
  const node = data[y];
  if (node.type !== "directory") return;

  if (node.isOpen) {
    closeDir(data, y);
  } else {
    openDir(data, y);
  }
  node.isOpen = !node.isOpen;
}

export function createInitialData(): FileSystemNode[] {
  return Array.from(generateContents(0, 3, 5));
}

function transpose<T>(m: T[][]): T[][] {
  if (m.length === 0) return [];
  return m[0].map((_, i) => m.map((row) => row[i]));
}

export function createDataListener(
  data: FileSystemNode[],
  columnOrder: number[],
): (_x0: number, _y0: number, _x1: number, _y1: number) => TreeTableData {
  return (_x0: number, _y0: number, _x1: number, _y1: number): TreeTableData => {
    const orderedColumns = columnOrder.map((idx) => COLUMNS[idx]);

    return {
      num_rows: data.length,
      num_columns: orderedColumns.length,
      row_headers: data.slice(_y0, _y1).map((node) => node.path.slice()),
      column_headers: orderedColumns.map((col) => [col.name]),
      data: transpose(
        data.slice(_y0, _y1).map((node) => {
          const orderedRow = columnOrder.map((idx) => {
            const col = COLUMNS[idx];
            if (col.accessor === "name") {
              return node.path[node.path.length - 1];
            }
            return node.row[col.accessor as number];
          });
          return orderedRow;
        }),
      ),
    };
  };
}
