'use client';

import { DepartmentSLAHealth } from '@/lib/slaConfig';
import { Activity, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface DepartmentSLAIndexCardProps {
  slaHealthList: DepartmentSLAHealth[];
}

export default function DepartmentSLAIndexCard({ slaHealthList }: DepartmentSLAIndexCardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {slaHealthList.map((item) => {
        const isHealthy = item.healthIndex >= 80;
        const isModerate = item.healthIndex >= 60 && item.healthIndex < 80;

        return (
          <div
            key={item.department}
            className="rounded-lg border border-[#e0e2e6] bg-white p-4 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#181d26] truncate">{item.department}</span>
              <Activity className={`h-4 w-4 shrink-0 ${isHealthy ? 'text-[#16a34a]' : isModerate ? 'text-amber-500' : 'text-[#aa2d00]'}`} />
            </div>

            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${isHealthy ? 'text-[#16a34a]' : isModerate ? 'text-amber-600' : 'text-[#aa2d00]'}`}>
                {item.healthIndex}%
              </span>
              <span className="text-[10px] text-[#5f6570] font-medium">SLA Index</span>
            </div>

            <div className="space-y-1 text-[10px] text-[#5f6570] pt-1 border-t border-[#f0f2f5]">
              <div className="flex justify-between">
                <span>Active Projects:</span>
                <strong className="text-[#181d26]">{item.totalActive}</strong>
              </div>
              <div className="flex justify-between">
                <span>On-Track:</span>
                <span className="font-semibold text-[#16a34a]">{item.onTimeCount}</span>
              </div>
              {item.overdueCount > 0 && (
                <div className="flex justify-between text-[#aa2d00]">
                  <span>Overdue (&gt;1.5x):</span>
                  <span className="font-bold">{item.overdueCount}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
