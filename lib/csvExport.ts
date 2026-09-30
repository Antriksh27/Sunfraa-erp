export interface CSVColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => string | number | boolean | null | undefined);
}

/**
 * Escapes a single field according to RFC 4180 rules:
 * - Wrap in quotes if it contains commas, double quotes, or newlines
 * - Escape internal quotes with double quotes ("")
 */
function formatCSVField(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Client-side CSV export trigger
 */
export function exportToCSV<T>(
  filename: string,
  columns: CSVColumn<T>[],
  data: T[]
): void {
  if (typeof window === 'undefined') return;

  // Build Header Row
  const headerRow = columns.map((col) => formatCSVField(col.header)).join(',');

  // Build Data Rows
  const dataRows = data.map((row) =>
    columns
      .map((col) => {
        let value: unknown;
        if (typeof col.accessor === 'function') {
          value = col.accessor(row);
        } else {
          value = row[col.accessor];
        }
        return formatCSVField(value);
      })
      .join(',')
  );

  const csvContent = [headerRow, ...dataRows].join('\r\n');

  // Include UTF-8 BOM so Excel opens non-ASCII characters properly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
