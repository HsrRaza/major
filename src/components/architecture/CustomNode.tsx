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
      className={`px-3 py-2.5 rounded border shadow-xl transition-all font-mono text-xs min-w-[190px] select-none ${
        selected
          ? 'ring-1 ring-[#E53935] border-white/80 bg-[#1B1B1B]'
          : isCircular
          ? 'border-[#E53935] bg-[#170E0E] shadow-[0_0_12px_-2px_rgba(229,57,53,0.35)]'
          : isHotspot
          ? 'border-amber-500/50 bg-[#18140C]'
          : 'border-[#2B2B2B] bg-[#141414] hover:border-[#383838]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-[#E53935] !border-none"
      />

      <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#202020]">
        <span
          className="text-[9px] uppercase px-1.5 py-0.2 rounded font-bold font-mono"
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
              className="flex items-center gap-1 text-[9px] text-[#FF4D4D] font-bold bg-[#E53935]/20 px-1 rounded border border-[#E53935]/40 animate-pulse"
              title="Circular Dependency Loop"
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              CYCLE
            </span>
          )}
          {isHotspot && (
            <span
              className="flex items-center gap-1 text-[9px] text-amber-400 font-bold bg-amber-500/20 px-1 rounded border border-amber-500/40"
              title="Architectural Hotspot"
            >
              <Flame className="w-2.5 h-2.5" />
              HOT
            </span>
          )}
        </div>
      </div>

      <div className="pt-1.5 flex items-center gap-1.5 text-white font-bold truncate">
        <FileCode className="w-3.5 h-3.5 text-[#858585] shrink-0" />
        <span className="truncate">{data.label}</span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-[#858585] pt-1.5 font-mono">
        <span>LOC: {data.lines}</span>
        <span>Complexity: {data.complexity}</span>
        {data.issuesCount > 0 && (
          <span className="text-[#FF4D4D] font-mono font-bold">
            {data.issuesCount} issue{data.issuesCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-[#858585] !border-none"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

