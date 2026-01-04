import React, { useState, useEffect } from 'react';
import { Task } from '../../types';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { useTasks } from '../../hooks/useTasks';
import { Clock, RefreshCw, Calendar, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { format, isToday, parseISO, getHours, getMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../components/ui/utils';
import { generateSummaryWithAI } from '../../api/tasks';
import { Alert, AlertDescription } from '../components/ui/alert';

interface MyDayViewProps {
  onTaskClick: (task: Task) => void;
}

export function MyDayView({ onTaskClick }: MyDayViewProps) {
  const today = new Date();
  // 当前时间线指示器
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // AI 摘要状态
  const [dailySummary, setDailySummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  // 获取所有任务（这里依然获取所有，前端过滤）
  // 理想情况下应该后端支持按日期范围查询
  const { data, isLoading, isError, error, refetch } = useTasks({
    page: 0,
    size: 200, // 增加获取数量以确保覆盖今天
    sort: 'dueAt,asc',
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

  const allTasks = data?.content || [];
  
  // 筛选今日任务
  const todayTasks = allTasks.filter(task => {
    if (task.dueAt) {
      return isToday(parseISO(task.dueAt));
    }
    return false; // 只显示有具体时间的任务
  });
  
  // 生成每日摘要
  const handleGenerateSummary = async () => {
    if (todayTasks.length === 0) {
      setDailySummary("No tasks today. Consider creating some tasks to plan your day.");
      return;
    }
    
    setSummaryLoading(true);
    setSummaryError(null);
    
    try {
      const summary = await generateSummaryWithAI({
        tasks: todayTasks,
        period: 'daily',
      });
      setDailySummary(summary);
    } catch (error) {
      setSummaryError((error as Error).message || '生成摘要失败');
    } finally {
      setSummaryLoading(false);
    }
  };
  
  // 自动生成摘要（当任务加载完成后）
  useEffect(() => {
    if (!isLoading && todayTasks.length > 0 && !dailySummary && !summaryLoading) {
      handleGenerateSummary();
    }
  }, [isLoading, todayTasks.length]);
  
  // 全天任务（没有具体时间但标记为今天的，或者只有日期没有时间的）
  // 这里简化处理：如果有 dueAt 就算是具体时间任务。
  // 实际项目中可能需要判断是否为"全天"。
  // 假设 dueAt 包含时间信息。

  // 计算任务在时间轴上的位置 (0-100%)
  const getTaskPosition = (dateStr: string) => {
    const date = parseISO(dateStr);
    const minutes = getHours(date) * 60 + getMinutes(date);
    return (minutes / 1440) * 100;
  };

  const getTaskColor = (task: Task) => {
    switch (task.priority) {
      case 'HIGH': return 'bg-red-500 border-red-500 shadow-red-100';
      case 'MEDIUM': return 'bg-amber-500 border-amber-500 shadow-amber-100';
      case 'LOW': return 'bg-green-500 border-green-500 shadow-green-100';
      default: return 'bg-blue-500 border-blue-500 shadow-blue-100';
    }
  };

  // 生成时间刻度 (0-24)
  const hours = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
      {/* 头部统计 */}
      <div className="flex-none p-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-indigo-600" />
              My Day
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {format(today, 'EEEE, MMMM dd, yyyy')}
            </p>
          </div>
          <div className="text-right">
             <span className="text-2xl font-bold text-indigo-600">
               {todayTasks.length}
             </span>
             <span className="text-slate-400 text-sm ml-2">tasks</span>
          </div>
        </div>
        
        {/* AI 每日概要 */}
        <div className="mt-4">
          {summaryLoading ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Generating daily summary...</span>
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
          ) : dailySummary ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Daily Summary</span>
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
                {dailySummary}
              </p>
            </div>
          ) : (
            todayTasks.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateSummary}
                className="w-full border-dashed"
              >
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                Generate Daily Summary
              </Button>
            )
          )}
        </div>
      </div>

      {/* 时间轴区域 */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full w-full">
          <div className="relative min-h-[1440px] w-full p-4 pl-16 pr-8"> 
            {/* 1440px = 1px per minute, spacious layout */}
            
            {/* 当前时间线 */}
            <div 
              className="absolute left-14 right-0 border-t-2 border-red-400 z-10 flex items-center pointer-events-none"
              style={{ top: `${(getHours(currentTime) * 60 + getMinutes(currentTime)) / 1440 * 100}%` }}
            >
              <div className="absolute -left-16 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium w-12 text-center">
                {format(currentTime, 'HH:mm')}
              </div>
              <div className="h-2 w-2 bg-red-500 rounded-full -ml-1"></div>
            </div>

            {/* 时间刻度线 */}
            {hours.map(hour => (
              <div 
                key={hour} 
                className="absolute w-full flex items-center group"
                style={{ top: `${(hour / 24) * 100}%` }}
              >
                <div className="absolute -left-12 text-xs font-medium text-slate-400 w-8 text-right group-hover:text-slate-600 transition-colors">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="w-full h-px bg-slate-200 dark:bg-slate-800 group-hover:bg-slate-300 transition-colors" />
              </div>
            ))}

            {/* 任务水平线 */}
            {isLoading ? (
               <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
                 <Skeleton className="h-32 w-32 rounded-full" />
               </div>
            ) : (
              todayTasks.map(task => {
                if (!task.dueAt) return null;
                const top = getTaskPosition(task.dueAt);
                const colorClass = getTaskColor(task);
                const bgColor = colorClass.split(' ')[0].replace('bg-', ''); // e.g. "red-500"
                
                return (
                  <Popover key={task.id}>
                    <PopoverTrigger asChild>
                      <div 
                        className={cn(
                          "absolute left-0 right-0 h-px z-20 group cursor-pointer flex items-center hover:z-30",
                          task.status === 'COMPLETED' ? 'opacity-50' : ''
                        )}
                        style={{ top: `${top}%` }}
                      >
                         {/* 线条本身 */}
                         <div className={cn("w-full h-px transition-all group-hover:h-0.5", colorClass.split(' ')[0])} />
                         
                         {/* 左侧圆点 */}
                         <div className={cn(
                           "absolute left-12 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 shadow-sm transition-transform group-hover:scale-125",
                           colorClass.split(' ')[0]
                         )}>
                           {task.status === 'COMPLETED' && (
                             <div className="absolute inset-0 flex items-center justify-center">
                               <CheckCircle2 className="h-2 w-2 text-white" />
                             </div>
                           )}
                         </div>
                         
                         {/* 标题和时间标签 - 改为垂直居中，位于圆点右侧 */}
                         <div className="absolute left-16 top-1/2 -translate-y-1/2 flex items-center gap-2 px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-100 dark:border-slate-800 shadow-sm transition-all group-hover:shadow-md">
                            <span className="text-xs font-mono font-medium text-slate-500">
                              {format(parseISO(task.dueAt), 'HH:mm')}
                            </span>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                              {task.title}
                            </span>
                         </div>
                         
                         {/* 隐形点击区域扩大 */}
                         <div className="absolute inset-x-0 -top-2 h-4 bg-transparent" />
                      </div>
                    </PopoverTrigger>
                    
                    {/* Popover 放在底部左侧对齐，避免 side="right" 导致溢出屏幕 */}
                    <PopoverContent className="w-80 p-0 overflow-hidden shadow-xl border-slate-100 dark:border-slate-800" side="bottom" align="start" sideOffset={10} alignOffset={40}>
                      <div className="flex flex-col">
                        <div className={cn("h-1.5 w-full", colorClass.split(' ')[0])} />
                        <div className="p-4 bg-white dark:bg-slate-950">
                          <div className="flex items-start justify-between gap-2 mb-2">
                             <h4 className="font-semibold text-base leading-tight text-slate-900 dark:text-slate-100 line-clamp-2">
                               {task.title}
                             </h4>
                             {task.status === 'COMPLETED' && (
                               <Badge variant="secondary" className="shrink-0 bg-green-50 text-green-700">Completed</Badge>
                             )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {format(parseISO(task.dueAt), 'HH:mm')}
                            </span>
                            <span className="text-slate-300">|</span>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                              {task.priority}
                            </Badge>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 bg-slate-50 dark:bg-slate-900 p-2 rounded-md">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => onTaskClick(task)}
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })
            )}

            {/* 如果没有任务 */}
            {!isLoading && todayTasks.length === 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-4xl mb-2 opacity-20">📅</div>
                <p className="text-slate-400 text-sm">No scheduled tasks for today</p>
              </div>
            )}
            
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
