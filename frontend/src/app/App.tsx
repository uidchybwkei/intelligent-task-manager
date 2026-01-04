import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { TaskListView } from './pages/TaskListView';
import { TaskKanbanView } from './pages/TaskKanbanView';
import { MyDayView } from './pages/MyDayView';
import { AICreateTaskModal } from './components/modals/AICreateTaskModal';
import { CreateTaskModal } from './components/modals/CreateTaskModal';
import { TaskDetailDrawer } from './components/drawers/TaskDetailDrawer';
import { Task, ViewMode } from '../types';
import { LayoutList, Kanban as KanbanIcon } from 'lucide-react';
import { Toaster } from './components/ui/sonner';

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // 窗口聚焦时不自动重新获取
      retry: 1, // 失败后重试 1 次
    },
  },
});

// Simple router state
type Page = 'dashboard' | 'myday';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAICreateOpen, setIsAICreateOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Actions
  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setIsDetailOpen(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardLayout 
        onAICreateClick={() => setIsAICreateOpen(true)}
        onNewTaskClick={() => setIsCreateOpen(true)}
        activePage={currentPage}
        onNavigate={(page) => {
          console.log('Navigating to:', page);
          setCurrentPage(page as Page);
        }}
        selectedTag={selectedTag}
        onTagSelect={(tag) => {
          setSelectedTag(tag);
          // 只有当选中具体标签时才跳转到 dashboard
          if (tag) {
            setCurrentPage('dashboard');
          }
        }}
      >
        {/* View Switcher & Page Title area */}
        {currentPage === 'dashboard' && (
          <div className="flex flex-col h-full">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Tasks</h1>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                     <button 
                       onClick={() => setViewMode('list')}
                       className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                       <LayoutList className="h-4 w-4" />
                     </button>
                     <button 
                       onClick={() => setViewMode('kanban')}
                       className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                       <KanbanIcon className="h-4 w-4" />
                     </button>
                  </div>
               </div>
             </div>

             <div className="flex-1 overflow-hidden">
               {viewMode === 'list' ? (
                 <TaskListView 
                    onTaskClick={handleTaskClick}
                    selectedTag={selectedTag}
                 />
               ) : (
                 <TaskKanbanView 
                    onTaskClick={handleTaskClick}
                    selectedTag={selectedTag}
                 />
               )}
             </div>
          </div>
        )}

        {currentPage === 'myday' && (
          <div className="h-full overflow-hidden">
             <MyDayView onTaskClick={handleTaskClick} />
          </div>
        )}

        <AICreateTaskModal 
          open={isAICreateOpen} 
          onOpenChange={setIsAICreateOpen}
        />

        <CreateTaskModal 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen}
        />

        <TaskDetailDrawer 
          taskId={selectedTaskId}
          open={isDetailOpen} 
          onOpenChange={setIsDetailOpen}
        />
        
        <Toaster />
      </DashboardLayout>
    </QueryClientProvider>
  );
}

export default App;
