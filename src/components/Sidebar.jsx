import React from 'react';
import { 
  LayoutDashboard, 
  Bug, 
  Sparkles, 
  Layers, 
  Terminal, 
  History, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Cpu, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed,
  issuesCount = 0,
  circularDepsCount = 0,
  testSummary = null,
  historyCount = 0
}) {
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      id: 'issues', 
      label: 'Issue Explorer', 
      icon: Bug, 
      badge: issuesCount > 0 ? `${issuesCount}` : null,
      badgeColor: issuesCount > 5 ? 'bg-[#EF4444]/20 text-[#F87171] border-[#EF4444]/30' : 'bg-[#F59E0B]/20 text-[#FBBF24] border-[#F59E0B]/30'
    },
    { 
      id: 'diff', 
      label: 'Refactoring Studio', 
      icon: Sparkles, 
      badge: 'AI',
      badgeColor: 'bg-[#6366F1]/20 text-[#818CF8] border-[#6366F1]/30'
    },
    { 
      id: 'architecture', 
      label: 'Architecture Graph', 
      icon: Layers, 
      badge: circularDepsCount > 0 ? `${circularDepsCount} Cycle${circularDepsCount > 1 ? 's' : ''}` : null,
      badgeColor: 'bg-[#EF4444]/20 text-[#F87171] border-[#EF4444]/30'
    },
    { 
      id: 'tests', 
      label: 'Test Runner', 
      icon: Terminal, 
      badge: testSummary && testSummary.total > 0 ? `${testSummary.passed}/${testSummary.total}` : 'Tests',
      badgeColor: testSummary?.hasRegression ? 'bg-[#EF4444]/20 text-[#F87171] border-[#EF4444]/30' : 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/30'
    },
    { 
      id: 'history', 
      label: 'Refactor History', 
      icon: History,
      badge: historyCount > 0 ? `${historyCount}` : null,
      badgeColor: 'bg-[#111726] text-[#94A3B8] border-[#1E293B]'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      badge: null
    },
  ];

  return (
    <aside className={`border-r border-[#1E293B] bg-[#090D16] flex flex-col justify-between transition-all duration-300 shrink-0 select-none ${
      isCollapsed ? 'w-14' : 'w-56'
    }`}>
      <div className="p-2 space-y-3">
        {/* Collapse / Expand Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between text-xs text-[#94A3B8] hover:text-white p-2 rounded-[6px] hover:bg-[#111726] border border-transparent transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {!isCollapsed && <span className="font-mono text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Navigation</span>}
          {isCollapsed ? <ChevronRight className="w-4 h-4 mx-auto text-[#818CF8]" /> : <ChevronLeft className="w-4 h-4 text-[#64748B]" />}
        </button>

        {/* Sidebar Nav Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] text-xs font-medium transition-all relative ${
                  isActive
                    ? 'bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30 font-semibold shadow-sm'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#111726] border border-transparent'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#6366F1] rounded-r-full shadow-sm shadow-[#6366F1]"></span>
                )}

                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#818CF8]' : 'text-[#64748B]'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer with Engine Telemetry */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[#1E293B] bg-[#0D121F] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-mono">
            <span className="flex items-center gap-1.5 text-[#818CF8] font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>PatchPilot AI</span>
            </span>
            <span className="text-[10px] text-[#64748B] bg-[#111726] px-1.5 py-0.5 rounded border border-[#1E293B]">v3.0</span>
          </div>
          <div className="text-[10px] text-[#64748B] font-mono flex items-center gap-1 truncate">
            <ShieldCheck className="w-3 h-3 text-[#10B981] shrink-0" />
            <span className="truncate">Groq Llama-3.3-70b Ready</span>
          </div>
        </div>
      )}
    </aside>
  );
}
