'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileCode, AlertTriangle, Flame } from 'lucide-react';
import { GraphNodeData } from '@/types/graph';

export const CustomNode = memo(({ data, selected }: { data: GraphNodeData; selected?: boolean }) => {
  const isCircular = data.isCircular;
  const isHotspot = data.isHotspot;

  return (
    <div
      className={`px-3.5 py-3 rounded-lg border shadow-xs transition-all font-mono text-xs min-w-[200px] select-none ${
        selected
          ? 'ring-2 ring-[#E5484D] border-[#E5484D] bg-white shadow-md'
          : isCircular
          ? 'border-red-300 bg-red-50/80 shadow-xs'
          : isHotspot
          ? 'border-amber-300 bg-amber-50/80 shadow-xs'
          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] shadow-2xs'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-[#E5484D] !border-2 !border-white shadow-xs"
      />

      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E2E8F0]">
        <span
          className="text-[10px] uppercase px-1.5 py-0.5 rounded font-bold font-mono"
          style={{
            backgroundColor: `${data.color}15`,
            color: data.color,
            border: `1px solid ${data.color}35`,
          }}
        >
          {data.layer}
        </span>

        <div className="flex items-center gap-1">
          {isCircular && (
            <span
              className="flex items-center gap-1 text-[9px] text-red-600 font-bold bg-red-100 px-1.5 py-0.5 rounded border border-red-200"
              title="Circular Dependency Loop"
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              CYCLE
            </span>
          )}
          {isHotspot && (
            <span
              className="flex items-center gap-1 text-[9px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200"
              title="Architectural Hotspot"
            >
              <Flame className="w-2.5 h-2.5" />
              HOT
            </span>
          )}
        </div>
      </div>

      <div className="pt-2 flex items-center gap-1.5 text-[#172033] font-semibold truncate">
        <FileCode className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
        <span className="truncate">{data.label}</span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2 font-mono">
        <span>LOC: {data.lines}</span>
        <span>Complexity: {data.complexity}</span>
        {data.issuesCount > 0 && (
          <span className="text-red-600 font-bold">
            {data.issuesCount} issue{data.issuesCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-[#64748B] !border-2 !border-white shadow-xs"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
