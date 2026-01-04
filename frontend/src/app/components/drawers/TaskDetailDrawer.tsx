import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../../components/ui/sheet';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Skeleton } from '../../components/ui/skeleton';
import { Priority, Status } from '../../../types';
import { useTask, useUpdateTask, useDeleteTask } from '../../../hooks/useTasks';
import { getTagColor, getAvailableTags } from '../../../utils/tagHelpers';
import { format } from 'date-fns';
import { Sparkles, Plus, X, Trash2, Tag as TagIcon } from 'lucide-react';

interface TaskDetailDrawerProps {
  taskId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDrawer({ taskId, open, onOpenChange }: TaskDetailDrawerProps) {
  // 获取任务详情
  const { data: task, isLoading } = useTask(taskId);
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  // 本地编辑状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('PENDING');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [tags, setTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // 同步 task 数据到本地状态
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setTags(task.tags);
    }
  }, [task]);

  // 当显示输入框时自动聚焦
  useEffect(() => {
    if (showTagInput && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [showTagInput]);

  if (!open) return null;

  const handleSave = () => {
    if (!taskId) return;
    
    updateTaskMutation.mutate({
      id: taskId,
      payload: { title, description, status, priority, tags },
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const handleDelete = () => {
    if (!taskId) return;
    if (!confirm(`Are you sure you want to delete task "${title}"?`)) return;
    
    deleteTaskMutation.mutate(taskId, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const handleSuggestTags = () => {
    const availableTags = getAvailableTags().filter(t => !tags.includes(t));
    setSuggestedTags(availableTags.slice(0, 3));
  };

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
      setSuggestedTags(suggestedTags.filter(t => t !== tag));
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddNewTag = () => {
    const trimmedTag = newTagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTagInput('');
      setShowTagInput(false);
    }
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewTag();
    } else if (e.key === 'Escape') {
      setNewTagInput('');
      setShowTagInput(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col gap-0 overflow-hidden">
        {isLoading ? (
          // Loading skeleton
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : task ? (
          <>
            <SheetHeader className="px-6 pt-6 pb-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between gap-4">
                 <div className="space-y-1 flex-1">
                   <SheetTitle>Task Details</SheetTitle>
                   <div className="flex items-center gap-2 text-xs text-slate-500">
                     <span>Created at {format(new Date(task.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                   </div>
                 </div>
                 <Select 
                   value={status} 
                   onValueChange={(val: Status) => setStatus(val)}
                 >
                   <SelectTrigger className="w-[140px] h-8 bg-white dark:bg-slate-950">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="PENDING">Pending</SelectItem>
                     <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                     <SelectItem value="COMPLETED">Completed</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1 px-6 py-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="text-lg font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select 
                      value={priority} 
                      onValueChange={(val: Priority) => setPriority(val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <div className="text-sm text-slate-500 py-2">
                      {task.dueAt ? format(new Date(task.dueAt), 'yyyy-MM-dd') : 'Not set'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px]" 
                    placeholder="Add task description..."
                  />
                </div>

                {/* Tags Section */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                   <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm">
                     <Sparkles className="h-4 w-4" />
                     <span>Tag Management</span>
                   </div>
                   
                   <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Task Tags</span>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs" 
                            onClick={handleSuggestTags}
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Suggest
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs" 
                            onClick={() => setShowTagInput(!showTagInput)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            New
                          </Button>
                        </div>
                      </div>
                      
                      {/* 新标签输入框 */}
                      {showTagInput && (
                        <div className="flex gap-2 items-center">
                          <div className="relative flex-1">
                            <TagIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                              ref={tagInputRef}
                              value={newTagInput}
                              onChange={(e) => setNewTagInput(e.target.value)}
                              onKeyDown={handleTagInputKeyPress}
                              placeholder="Enter new tag name..."
                              className="h-8 text-sm pl-8"
                            />
                          </div>
                          <Button 
                            size="sm" 
                            className="h-8 px-3" 
                            onClick={handleAddNewTag}
                            disabled={!newTagInput.trim()}
                          >
                            Add
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-8 px-2" 
                            onClick={() => {
                              setNewTagInput('');
                              setShowTagInput(false);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 min-h-[32px]">
                         {tags.length === 0 && !showTagInput && suggestedTags.length === 0 && (
                           <div className="text-xs text-slate-400 py-1">
                             No tags yet, click "New" to add tags
                           </div>
                         )}
                         {tags.map((tag, idx) => (
                           <Badge key={`${tag}-${idx}`} variant="secondary" className={`pl-2 pr-2 gap-1 ${getTagColor(tag)}`}>
                             {tag}
                             <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500 transition-colors">
                               <X className="h-3 w-3" />
                             </button>
                           </Badge>
                         ))}
                         {suggestedTags.map((tag, idx) => (
                           <Badge 
                              key={`suggested-${tag}-${idx}`}
                              variant="outline" 
                              className="cursor-pointer border-dashed border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900 transition-colors"
                              onClick={() => addTag(tag)}
                            >
                             <Plus className="h-3 w-3 mr-1" />
                             {tag}
                           </Badge>
                         ))}
                      </div>
                   </div>
                </div>

              </div>
            </ScrollArea>
            
            <SheetFooter className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDelete}
                disabled={deleteTaskMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button 
                  onClick={handleSave}
                  disabled={updateTaskMutation.isPending || !title.trim()}
                >
                  {updateTaskMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
