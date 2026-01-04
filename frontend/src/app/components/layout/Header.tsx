import React from 'react';
import { Search, Plus, Sparkles, Menu } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface HeaderProps {
  onMenuClick?: () => void;
  onAICreateClick?: () => void;
  onNewTaskClick?: () => void;
}

export function Header({ onMenuClick, onAICreateClick, onNewTaskClick }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search tasks, tags, or priorities..." 
            className="pl-9 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button 
          variant="default" 
          size="sm"
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-sm border-0 hidden sm:flex"
          onClick={onAICreateClick}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          AI Create
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="hidden sm:flex"
          onClick={onNewTaskClick}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>


      </div>
    </header>
  );
}
