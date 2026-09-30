'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { exportToCSV, CSVColumn } from '@/lib/csvExport';

interface ExportCSVButtonProps<T> {
  filename: string;
  columns: CSVColumn<T>[];
  data: T[];
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function ExportCSVButton<T>({
  filename,
  columns,
  data,
  label = 'Export CSV',
  className = '',
  disabled = false,
}: ExportCSVButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (disabled || data.length === 0) return;
    setIsExporting(true);
    try {
      exportToCSV(filename, columns, data);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || data.length === 0 || isExporting}
      title={data.length === 0 ? 'No data to export' : `Export ${data.length} records as CSV`}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border border-[#e0e2e6] bg-[#ffffff] px-2.5 text-xs font-medium text-[#41454d] shadow-2xs transition-colors hover:bg-[#f8fafc] hover:text-[#181d26] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <Download className="h-3.5 w-3.5 text-[#9297a0]" />
      <span>{isExporting ? 'Exporting...' : label}</span>
    </button>
  );
}
