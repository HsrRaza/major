'use client';

import React, { useState, useEffect } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { CommandPalette } from './CommandPalette';
import { RepoImporterModal } from '@/components/repository/RepoImporterModal';
import { Bot, X } from 'lucide-react';
import { AssistantChatDrawer } from '@/components/assistant/AssistantChatDrawer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#172033] antialiased selection:bg-[#E5484D]/15 selection:text-[#E5484D]">
      {/* Top Header */}
      <AppHeader
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenImporter={() => setIsImporterOpen(true)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Main Body: Desktop Sidebar + Dynamic Workspace */}
      <div className="flex-grow flex overflow-hidden relative">
        {/* Desktop Sidebar (hidden on < lg screens) */}
        <div className="hidden lg:flex shrink-0">
          <AppSidebar
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        </div>

        {/* Mobile Navigation Drawer & Backdrop */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex animate-fadeIn">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl bg-white">
              <AppSidebar
                isCollapsed={false}
                setIsCollapsed={() => {}}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-7 bg-[#F8FAFC]">
          {children}
        </main>
      </div>

      {/* Floating Redline AI Assistant Trigger */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsChatDrawerOpen((prev) => !prev)}
          className="w-11 h-11 rounded-full bg-white border border-[#E2E8F0] text-[#E5484D] flex items-center justify-center shadow-md hover:shadow-lg hover:border-[#E5484D] hover:bg-[#FFF1F2] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Open PatchPilot AI Codebase Assistant"
        >
          {isChatDrawerOpen ? <X className="w-5 h-5" /> : <Bot className="w-5 h-5 group-hover:rotate-6 transition-transform" />}
        </button>
      </div>

      {/* Slide-over AI Codebase Assistant Drawer */}
      {isChatDrawerOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-96 max-w-[94vw] animate-fadeIn shadow-2xl">
          <AssistantChatDrawer onClose={() => setIsChatDrawerOpen(false)} />
        </div>
      )}

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenImporter={() => setIsImporterOpen(true)}
      />

      {/* Repo Importer Modal */}
      <RepoImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
      />
    </div>
  );
}
