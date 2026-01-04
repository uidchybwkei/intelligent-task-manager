import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Sheet, SheetContent } from '../../components/ui/sheet';
import { Task } from '../../../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onAICreateClick?: () => void;
  onNewTaskClick?: () => void;
  activePage?: string;
  onNavigate?: (page: string) => void;
  selectedTag?: string | null;
  onTagSelect?: (tag: string | null) => void;
  onSearch?: (query: string) => void;
  searchResults?: Array<{ task: Task; score: number }>;
  onTaskClick?: (task: Task) => void;
  isSearching?: boolean;
}

export function DashboardLayout({ 
  children, 
  onAICreateClick, 
  onNewTaskClick, 
  activePage, 
  onNavigate, 
  selectedTag, 
  onTagSelect,
  onSearch,
  searchResults,
  onTaskClick,
  isSearching
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar 
        className="hidden md:flex w-64 flex-shrink-0" 
        activePage={activePage}
        onNavigate={onNavigate}
        selectedTag={selectedTag}
        onTagSelect={onTagSelect}
      />

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <Sidebar 
             activePage={activePage}
             onNavigate={(page) => {
               if (onNavigate) onNavigate(page);
               setIsMobileMenuOpen(false);
             }}
             selectedTag={selectedTag}
             onTagSelect={(tag) => {
               if (onTagSelect) onTagSelect(tag);
               setIsMobileMenuOpen(false);
             }}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Header 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          onAICreateClick={onAICreateClick}
          onNewTaskClick={onNewTaskClick}
          onSearch={onSearch}
          searchResults={searchResults}
          onTaskClick={onTaskClick}
          isSearching={isSearching}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
