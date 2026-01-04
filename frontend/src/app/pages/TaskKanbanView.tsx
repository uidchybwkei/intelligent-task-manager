import React from 'react';
import { Task, Status } from '../../types';
import { TaskCard } from '../components/tasks/TaskCard';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { useTasks } from '../../hooks/useTasks';
import { RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';

interface TaskKanbanViewProps {
  onTaskClick: (task: Task) => void;
  selectedTag?: string | null;
}

const KanbanColumn = ({ 
  title, 
  status, 
  tasks, 
  onTaskClick,
  isLoading 
}: { 
  title: string; 
  status: Status; 
  tasks: Task[]; 
  onTaskClick: (task: Task) => void;
  isLoading: boolean;
}) => {
  return (
    <div className="flex flex-col h-full min-w-[300px] w-full bg-slate-50/50 dark:bg-slate-900/20 rounded-lg p-2 gap-3">
      <div className="flex items-center justify-between px-2 pt-2">
        <h3 className="font-medium text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wider">
          {title}
        </h3>
        <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium">
          {tasks.length}
        </span>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-1">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No tasks
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export function TaskKanbanView({ onTaskClick, selectedTag }: TaskKanbanViewProps) {
  // 获取所有任务（不分页，size 设大一些）
  const { data, isLoading, isError, error, refetch } = useTasks({
    page: 0,
    size: 100,
    sort: 'createdAt,desc',
    tag: selectedTag || undefined, // 如果有选中的 tag，传递给 API
  });

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
  const getTasksByStatus = (status: Status) => tasks.filter(t => t.status === status);

  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4">
      <KanbanColumn 
        title="Pending" 
        status="PENDING" 
        tasks={getTasksByStatus('PENDING')} 
        onTaskClick={onTaskClick}
        isLoading={isLoading}
      />
      <KanbanColumn 
        title="In Progress" 
        status="IN_PROGRESS" 
        tasks={getTasksByStatus('IN_PROGRESS')} 
        onTaskClick={onTaskClick}
        isLoading={isLoading}
      />
      <KanbanColumn 
        title="Completed" 
        status="COMPLETED" 
        tasks={getTasksByStatus('COMPLETED')} 
        onTaskClick={onTaskClick}
        isLoading={isLoading}
      />
    </div>
  );
}
