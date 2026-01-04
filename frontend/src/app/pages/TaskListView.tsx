import React, { useState, useEffect } from 'react';
import { Task, Status, Priority, TaskQueryParams } from '../../types';
import { TaskRow } from '../components/tasks/TaskRow';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { ArrowUpDown, Filter, ChevronLeft, ChevronRight, RefreshCw, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useTasks, useCompleteTask, useDeleteTask } from '../../hooks/useTasks';
import { generateSummaryWithAI, findSimilarTasks, SimilarTask } from '../../api/tasks';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';

interface TaskListViewProps {
  onTaskClick: (task: Task) => void;
  selectedTag?: string | null;
}

export function TaskListView({ onTaskClick, selectedTag }: TaskListViewProps) {
  // 筛选、排序、分页状态
  const [filters, setFilters] = useState<TaskQueryParams>({
    page: 0,
    size: 10,
    sort: 'createdAt,desc',
  });
  
  // 本地 UI 筛选状态
  const [statusFilter, setStatusFilter] = useState<Status | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<Priority | undefined>();
  
  // AI 摘要状态
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // 相似任务状态
  const [similarTasks, setSimilarTasks] = useState<SimilarTask[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [targetTask, setTargetTask] = useState<Task | null>(null);

  // 获取任务列表
  const { data, isLoading, isError, error, refetch } = useTasks({
    ...filters,
    status: statusFilter,
    priority: priorityFilter,
    tag: selectedTag || undefined, // 如果有选中的 tag，传递给 API
  });

  // Mutations
  const completeTaskMutation = useCompleteTask();
  const deleteTaskMutation = useDeleteTask();

  const handleSort = (sortKey: string) => {
    setFilters({ ...filters, sort: sortKey, page: 0 });
  };

  const handleStatusFilter = (status: Status | 'all') => {
    setStatusFilter(status === 'all' ? undefined : status);
    setFilters({ ...filters, page: 0 });
  };

  const handlePriorityFilter = (priority: Priority | 'all') => {
    setPriorityFilter(priority === 'all' ? undefined : priority);
    setFilters({ ...filters, page: 0 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleCompleteTask = (task: Task) => {
    completeTaskMutation.mutate(task.id);
  };

  const handleDeleteTask = (task: Task) => {
    if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      deleteTaskMutation.mutate(task.id);
    }
  };

  // 生成每周摘要
  const handleGenerateSummary = async () => {
    const allTasks = data?.content || [];
    
    if (allTasks.length === 0) {
      setWeeklySummary("No tasks this week. Consider creating some tasks to organize your work.");
      return;
    }
    
    setSummaryLoading(true);
    setSummaryError(null);
    
    try {
      const summary = await generateSummaryWithAI({
        tasks: allTasks,
        period: 'weekly',
      });
      setWeeklySummary(summary);
    } catch (error) {
      setSummaryError((error as Error).message || '生成摘要失败');
    } finally {
      setSummaryLoading(false);
    }
  };
  
  // Find similar tasks
  const handleFindSimilar = async () => {
    const allTasks = data?.content || [];
    
    if (allTasks.length < 2) {
      return;
    }
    
    // Use the latest uncompleted task as target
    const uncompletedTasks = allTasks.filter(t => t.status !== 'COMPLETED');
    const target = uncompletedTasks.length > 0 ? uncompletedTasks[0] : allTasks[0];
    
    setSimilarLoading(true);
    setTargetTask(target);
    
    try {
      const similar = await findSimilarTasks({
        target_task: target,
        all_tasks: allTasks,
      });
      setSimilarTasks(similar);
    } catch (error) {
      console.error('Find similar tasks failed:', error);
      setSimilarTasks([]);
    } finally {
      setSimilarLoading(false);
    }
  };

  // Auto generate summary and find similar tasks
  useEffect(() => {
    const allTasks = data?.content || [];
    if (!isLoading && allTasks.length > 0 && !selectedTag) {
      // Generate summary
      if (!weeklySummary && !summaryLoading) {
        handleGenerateSummary();
      }
      // Find similar tasks
      if (!targetTask && !similarLoading && allTasks.length >= 2) {
        handleFindSimilar();
      }
    }
  }, [isLoading, data?.content?.length, selectedTag]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border-b last:border-b-0">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-500 text-center">
          Failed to load tasks: {(error as any)?.message || 'Unknown error'}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const tasks = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const currentPage = data?.page || 0;

  return (
    <div className="space-y-4">
      {/* AI 每周概要 - 仅在没有选中标签时显示 */}
      {!selectedTag && (
        <div className="mb-4 space-y-3">
          {summaryLoading ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Generating weekly summary...</span>
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ) : summaryError ? (
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertDescription className="text-sm">
                {summaryError}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerateSummary}
                  className="ml-2 h-6 text-xs"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : weeklySummary ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Weekly Summary</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerateSummary}
                  className="h-6 text-xs shrink-0"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {weeklySummary}
              </p>
            </div>
          ) : (
            tasks.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateSummary}
                className="w-full border-dashed"
              >
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Generate Weekly Summary
              </Button>
            )
          )}

          {/* Similar Tasks Section */}
          {similarLoading ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Finding similar tasks...</span>
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          ) : similarTasks.length > 0 && targetTask ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600 shrink-0" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Similar to: "{targetTask.title}"
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleFindSimilar}
                  className="h-6 text-xs shrink-0"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
              <div className="space-y-2">
                {similarTasks.map((similar) => {
                  const task = tasks.find(t => t.id === similar.task_id);
                  if (!task) return null;
                  
                  return (
                    <div
                      key={similar.task_id}
                      className="flex items-center justify-between gap-2 p-2 rounded bg-white/50 dark:bg-slate-900/50 hover:bg-white/80 dark:hover:bg-slate-900/80 cursor-pointer transition-colors"
                      onClick={() => onTaskClick(task)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                          {task.title}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary"
                        className="shrink-0 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      >
                        {Math.round(similar.score * 100)}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}
      
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-xl font-semibold tracking-tight">
          {selectedTag ? `Tag: ${selectedTag}` : 'Task List'} 
          <span className="text-sm text-slate-500 ml-2">({data?.totalElements || 0})</span>
        </h2>
        <div className="flex items-center gap-2">
          {/* 排序 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Sort
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem 
                checked={filters.sort === 'createdAt,desc'} 
                onCheckedChange={() => handleSort('createdAt,desc')}
              >
                Newest First
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={filters.sort === 'createdAt,asc'} 
                onCheckedChange={() => handleSort('createdAt,asc')}
              >
                Oldest First
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={filters.sort === 'priority,desc'} 
                onCheckedChange={() => handleSort('priority,desc')}
              >
                Priority (High→Low)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={filters.sort === 'dueAt,asc'} 
                onCheckedChange={() => handleSort('dueAt,asc')}
              >
                Due Date
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 筛选 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filter
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem 
                checked={!statusFilter} 
                onCheckedChange={() => handleStatusFilter('all')}
              >
                All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'PENDING'} 
                onCheckedChange={() => handleStatusFilter('PENDING')}
              >
                Pending
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'IN_PROGRESS'} 
                onCheckedChange={() => handleStatusFilter('IN_PROGRESS')}
              >
                In Progress
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'COMPLETED'} 
                onCheckedChange={() => handleStatusFilter('COMPLETED')}
              >
                Completed
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              <DropdownMenuCheckboxItem 
                checked={!priorityFilter} 
                onCheckedChange={() => handlePriorityFilter('all')}
              >
                All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={priorityFilter === 'HIGH'} 
                onCheckedChange={() => handlePriorityFilter('HIGH')}
              >
                High
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={priorityFilter === 'MEDIUM'} 
                onCheckedChange={() => handlePriorityFilter('MEDIUM')}
              >
                Medium
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={priorityFilter === 'LOW'} 
                onCheckedChange={() => handlePriorityFilter('LOW')}
              >
                Low
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-lg mb-2">No tasks yet</p>
            <p className="text-sm">Click the button in the top right to create your first task</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.map(task => (
              <TaskRow 
                key={task.id} 
                task={task} 
                onClick={onTaskClick}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Page {currentPage + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
