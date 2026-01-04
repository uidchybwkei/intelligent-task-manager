import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CheckSquare, Tag, Plus, X, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '../../components/ui/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { useTags, useCreateTag, useDeleteTagMutation } from '../../../hooks/useTasks';
import { fetchTasks, updateTask } from '../../../api/tasks';
import { toast } from 'sonner';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  count?: number;
}

const SidebarItem = ({ icon: Icon, label, isActive, onClick, count }: SidebarItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-lg",
        isActive 
          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300" 
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-slate-400 font-normal">{count}</span>
      )}
    </button>
  );
};

interface SidebarProps {
  className?: string;
  activePage?: string;
  onNavigate?: (page: string) => void;
  selectedTag?: string | null;
  onTagSelect?: (tag: string | null) => void;
}

export function Sidebar({ className, activePage, onNavigate, selectedTag, onTagSelect }: SidebarProps) {
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 从后端获取标签列表
  const { data: allTags = [], isLoading: tagsLoading, error: tagsError, refetch: refetchTags } = useTags();
  
  const createTagMutation = useCreateTag();
  const deleteTagMutation = useDeleteTagMutation();
  
  const handleNav = (page: string) => {
    if (onNavigate) onNavigate(page);
    // 切换页面时清除 tag 筛选
    if (onTagSelect) onTagSelect(null);
  };

  const handleTagClick = (tag: string) => {
    if (onTagSelect) {
      // 如果点击的是当前选中的 tag，则取消筛选
      onTagSelect(selectedTag === tag ? null : tag);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTagName.trim();
    if (trimmedTag) {
      if (allTags.includes(trimmedTag)) {
        toast.error('Tag already exists');
        return;
      }
      
      createTagMutation.mutate(trimmedTag, {
        onSuccess: () => {
          setNewTagName('');
          setIsAddTagOpen(false);
        }
      });
    }
  };

  const handleDeleteTag = async (e: React.MouseEvent, tagToDelete: string) => {
    e.stopPropagation(); // 阻止触发 handleTagClick
    
    if (!confirm(`Are you sure you want to delete tag "${tagToDelete}"?`)) return;

    setIsDeleting(true);
    try {
      // 1. 检查是否有任务在使用该标签
      const tasksResponse = await fetchTasks({ tag: tagToDelete, size: 1000 });
      const tasksToUpdate = tasksResponse.content;

      if (tasksToUpdate.length > 0) {
        if (!confirm(`This tag is used by ${tasksToUpdate.length} tasks. Remove this tag from all tasks and delete permanently?`)) {
          setIsDeleting(false);
          return;
        }

        // 并行更新所有任务
        await Promise.all(tasksToUpdate.map(task => {
          const newTags = task.tags.filter(t => t !== tagToDelete);
          return updateTask(task.id, { tags: newTags });
        }));
      }

      // 2. 调用后端删除标签定义
      deleteTagMutation.mutate(tagToDelete, {
        onSuccess: () => {
          setIsDeleting(false);
          // 如果当前选中了该标签，取消选中
          if (selectedTag === tagToDelete && onTagSelect) {
            onTagSelect(null);
          }
        },
        onError: () => {
          setIsDeleting(false);
        }
      });

    } catch (error) {
      console.error('Delete tag error:', error);
      toast.error('Failed to delete tag, please try again');
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950", className)}>
      <div className="p-6">
        <div className="flex items-center gap-2 font-semibold text-lg text-slate-900 dark:text-white cursor-pointer" onClick={() => handleNav('dashboard')}>
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <CheckSquare className="h-5 w-5" />
          </div>
          TaskFlow
        </div>
      </div>

      <div className="flex-1 px-4 space-y-1 overflow-y-auto">
        <SidebarItem 
          icon={LayoutDashboard} 
          label="All Tasks" 
          isActive={activePage === 'dashboard' && !selectedTag} 
          onClick={() => handleNav('dashboard')}
        />
        <SidebarItem 
          icon={CheckSquare} 
          label="My Day" 
          isActive={activePage === 'myday'} 
          onClick={() => handleNav('myday')}
        />
        
        <div className="pt-4 pb-2 flex items-center justify-between px-3 group/header">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tags</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsAddTagOpen(true)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-indigo-600"
              title="New Tag"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => refetchTags()}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-indigo-600"
              title="Refresh Tags"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        
        {tagsLoading ? (
          <div className="space-y-2 px-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : tagsError ? (
          <div className="px-3 py-2 text-xs text-red-500">
            Failed to load tags
          </div>
        ) : allTags.length === 0 ? (
          <div className="px-3 py-2 text-xs text-slate-400 text-center">
            No tags yet<br/>Click + above to create
          </div>
        ) : (
          <div className="space-y-0.5">
            {allTags.map(tag => (
              <div key={tag} className="group relative px-2">
                <button
                  onClick={() => handleTagClick(tag)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-lg",
                    selectedTag === tag
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                  )}
                >
                  <Tag className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{tag}</span>
                </button>
                
                <button
                  onClick={(e) => handleDeleteTag(e, tag)}
                  disabled={isDeleting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hidden group-hover:block text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all z-10"
                  title="Delete Tag"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isAddTagOpen} onOpenChange={setIsAddTagOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag();
              }}
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-2">
              This tag will be saved locally and can be used when creating tasks.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTagOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTag} disabled={!newTagName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
