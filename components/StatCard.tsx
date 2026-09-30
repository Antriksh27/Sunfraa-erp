'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  badgeText?: string;
  badgeColor?: string;
  onClick?: () => void;
  className?: string;
}

export default function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconBg = 'bg-[#fff0eb]',
  iconColor = 'text-[#aa2d00]',
  badgeText,
  badgeColor = 'bg-[#fff0eb] text-[#aa2d00] border-[#fcab79]',
  onClick,
  className = '',
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-[#f0f2f5] bg-white p-4 sm:p-5 shadow-sm hover:border-[#e0e2e6] hover:shadow-md transition-all flex flex-col justify-between ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-[#9297a0] truncate leading-relaxed">
          {label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badgeText && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${badgeColor}`}
            >
              {badgeText}
            </span>
          )}
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-semibold tracking-tight text-[#181d26]">
          {value}
        </div>
        {subtext && (
          <p className="mt-1 text-xs text-[#9297a0] truncate">{subtext}</p>
        )}
      </div>
    </div>
  );
}
