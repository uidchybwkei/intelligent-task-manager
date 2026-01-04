import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Sparkles, Menu, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Task } from '../../../types';
import { Badge } from '../../components/ui/badge';

interface HeaderProps {
  onMenuClick?: () => void;
  onAICreateClick?: () => void;
  onNewTaskClick?: () => void;
  onSearch?: (query: string) => void;
  searchResults?: Array<{ task: Task; score: number }>;
  onTaskClick?: (task: Task) => void;
  isSearching?: boolean;
}

export function Header({ 
  onMenuClick, 
  onAICreateClick, 
  onNewTaskClick, 
  onSearch, 
  searchResults, 
  onTaskClick,
  isSearching 
}: HeaderProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger search when query changes
  useEffect(() => {
    if (query.trim().length > 0) {
      onSearch?.(query.trim());
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    setShowResults(false);
  };

  const handleTaskClick = (task: Task) => {
    onTaskClick?.(task);
    setShowResults(false);
    setQuery('');
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        
        <div ref={searchRef} className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search tasks with AI..." 
            className="pl-9 pr-8 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  <Sparkles className="h-4 w-4 animate-pulse mx-auto mb-2" />
                  Searching with AI...
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map(({ task, score }) => (
                    <div
                      key={task.id}
                      className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="shrink-0 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        >
                          {Math.round(score * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  No results found
                </div>
              )}
            </div>
          )}
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
