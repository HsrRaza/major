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
    <div className="min-h-screen flex flex-col bg-[#090909] text-[#F5F5F5] antialiased selection:bg-[#E53935]/30 selection:text-white">
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl">
              <AppSidebar
                isCollapsed={false}
                setIsCollapsed={() => {}}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-grow overflow-y-auto p-3 sm:p-5 lg:p-6 bg-[#090909]">
          {children}
        </main>
      </div>

      {/* Floating Redline AI Assistant Trigger */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsChatDrawerOpen((prev) => !prev)}
          className="w-11 h-11 rounded-full bg-[#141414] border border-[#E53935]/70 text-[#FF4D4D] flex items-center justify-center shadow-[0_0_16px_-2px_rgba(229,57,53,0.4)] hover:shadow-[0_0_24px_-2px_rgba(229,57,53,0.7)] hover:border-[#FF4D4D] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
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

      {/* Repository Importer Modal */}
      <RepoImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
      />
    </div>
  );
}

