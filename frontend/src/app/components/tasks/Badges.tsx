import { Badge } from '../../components/ui/badge';
import { Priority, Status } from '../../../types';
import { cn } from '../../components/ui/utils';
import { AlertCircle, ArrowUp, ArrowDown, CheckCircle2, Circle, Clock } from 'lucide-react';

export const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const config: Record<Priority, { icon: any; color: string; label: string }> = {
    HIGH: { icon: AlertCircle, color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900", label: 'High' },
    MEDIUM: { icon: ArrowUp, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900", label: 'Medium' },
    LOW: { icon: ArrowDown, color: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-800", label: 'Low' },
  };

  const { icon: Icon, color, label } = config[priority];

  return (
    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", color)}>
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </div>
  );
};

export const StatusBadge = ({ status }: { status: Status }) => {
  const config: Record<Status, { icon: any; color: string; label: string }> = {
    COMPLETED: { icon: CheckCircle2, color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400", label: 'Completed' },
    IN_PROGRESS: { icon: Clock, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400", label: 'In Progress' },
    PENDING: { icon: Circle, color: "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400", label: 'Pending' },
  };

  const { icon: Icon, color, label } = config[status];

  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-medium", status === 'COMPLETED' ? "text-slate-500" : "text-slate-700 dark:text-slate-300")}>
      <Icon className={cn("h-4 w-4", status === 'COMPLETED' && "text-green-500")} />
      <span>{label}</span>
    </div>
  );
};
