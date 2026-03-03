import * as XLSX from "xlsx";

export interface CsvColumn<T> {
  key: keyof T | string;
  header: string;
  value?: (row: T) => string | number | null | undefined;
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => c.header).join(",");
  const escape = (v: unknown): string => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const body = rows
    .map((row) =>
      columns
        .map((c) =>
          escape(
            c.value
              ? c.value(row)
              : (row as Record<string, unknown>)[c.key as string]
          )
        )
        .join(",")
    )
    .join("\n");

  return `${header}\n${body}`;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadXlsx<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[]
) {
  const sheetData = [
    columns.map((c) => c.header),
    ...rows.map((row) =>
      columns.map((c) =>
        c.value
          ? c.value(row)
          : (row as Record<string, unknown>)[c.key as string]
      )
    ),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, filename);
}

