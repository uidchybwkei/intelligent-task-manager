import React from 'react';
import { Task } from '../../../types';
import { Card, CardContent, CardFooter, CardHeader } from '../../components/ui/card';
import { PriorityBadge } from './Badges';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getTagColor } from '../../../utils/tagHelpers';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      onClick={() => onClick(task)}
    >
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex justify-between items-start">
          <PriorityBadge priority={task.priority} />
          {task.dueAt && (
            <div className="flex items-center text-xs text-slate-500">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(task.dueAt), 'MM-dd', { locale: zhCN })}
            </div>
          )}
        </div>
        <h3 className="font-semibold text-sm leading-tight text-slate-900 dark:text-slate-100 line-clamp-2">
          {task.title}
        </h3>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 pb-3">
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.map((tag, idx) => (
              <span 
                key={`${tag}-${idx}`}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs text-slate-400">
        <div className="text-[10px] text-slate-400">
          {format(new Date(task.createdAt), 'MM-dd', { locale: zhCN })}
        </div>
      </CardFooter>
    </Card>
  );
}
