import React from 'react';
import { Task } from '../../../types';
import { PriorityBadge, StatusBadge } from './Badges';
import { format } from 'date-fns';
import { Button } from '../../components/ui/button';
import { MoreHorizontal, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../../components/ui/dropdown-menu';
import { getTagColor } from '../../../utils/tagHelpers';

interface TaskRowProps {
  task: Task;
  onClick: (task: Task) => void;
  onComplete: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskRow({ task, onClick, onComplete, onDelete }: TaskRowProps) {
  return (
    <div 
      className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
      onClick={() => onClick(task)}
    >
      <div className="flex-shrink-0">
        <StatusBadge status={task.status} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-medium text-sm truncate ${task.status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
            {task.title}
          </h3>
          <div className="flex gap-1">
            {task.tags.map((tag, idx) => (
              <span 
                key={`${tag}-${idx}`}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:block w-24">
          <PriorityBadge priority={task.priority} />
        </div>
        
        <div className="hidden md:block w-24 text-xs text-slate-500">
          {format(new Date(task.createdAt), 'yyyy-MM-dd')}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {task.status !== 'COMPLETED' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onComplete(task)}>
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onClick(task)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(task)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
