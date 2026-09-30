'use client';

import React from 'react';

interface PageHeaderProps {
  moduleNumber?: number | string;
  moduleName: string;
  title: string;
  description: string;
  badgeColor?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  moduleNumber,
  moduleName,
  title,
  description,
  badgeColor = 'bg-[#aa2d00]',
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#f0f2f5] pb-5 mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${badgeColor}`} />
          <span className="text-[11px] font-medium tracking-wide text-[#9297a0]">
            {moduleNumber ? `Module ${moduleNumber} — ${moduleName}` : moduleName}
          </span>
        </div>
        <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#181d26]">
          {title}
        </h1>
        <p className="text-sm text-[#9297a0] mt-1 max-w-4xl">
          {description}
        </p>
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
