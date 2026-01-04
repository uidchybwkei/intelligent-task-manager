import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, fetchTaskById, createTask, updateTask, deleteTask, completeTask, fetchAllTags } from '../api/tasks';
import { TaskQueryParams, CreateTaskPayload, UpdateTaskPayload } from '../types';
import { toast } from 'sonner';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params?: TaskQueryParams) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
  tags: () => [...taskKeys.all, 'tags'] as const,
};

/**
 * 获取任务列表（支持筛选、排序、分页）
 */
export const useTasks = (params?: TaskQueryParams) => {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => fetchTasks(params),
    staleTime: 30000, // 30秒内数据视为新鲜
  });
};

/**
 * 获取单个任务详情
 */
export const useTask = (id: number | null) => {
  return useQuery({
    queryKey: taskKeys.detail(id!),
    queryFn: () => fetchTaskById(id!),
    enabled: !!id, // 只有 id 存在时才执行
  });
};

/**
 * 创建任务 mutation
 */
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: () => {
      // 刷新任务列表
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Task created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '创建任务失败';
      toast.error(message);
    },
  });
};

/**
 * 更新任务 mutation
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTaskPayload }) => 
      updateTask(id, payload),
    onMutate: async ({ id, payload }) => {
      // 乐观更新：立即更新 UI
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });
      const previousTask = queryClient.getQueryData(taskKeys.detail(id));
      
      // 更新缓存
      queryClient.setQueryData(taskKeys.detail(id), (old: any) => ({
        ...old,
        ...payload,
      }));
      
      return { previousTask };
    },
    onSuccess: (_, { id }) => {
      // 刷新列表和详情
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
      toast.success('Task updated successfully');
    },
    onError: (error: any, { id }, context: any) => {
      // 回滚乐观更新
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(id), context.previousTask);
      }
      const message = error.response?.data?.message || '更新任务失败';
      toast.error(message);
    },
  });
};

/**
 * 删除任务 mutation
 */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      // 刷新任务列表
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Task deleted');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '删除任务失败';
      toast.error(message);
    },
  });
};

/**
 * 快速完成任务 mutation（乐观更新）
 */
export const useCompleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => completeTask(id),
    onMutate: async (id) => {
      // 乐观更新状态
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      
      const previousData = queryClient.getQueryData(taskKeys.lists());
      
      // 更新列表中的任务状态
      queryClient.setQueriesData({ queryKey: taskKeys.lists() }, (old: any) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((task: any) =>
            task.id === id ? { ...task, status: 'COMPLETED' } : task
          ),
        };
      });
      
      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Task completed');
    },
    onError: (error: any, _, context: any) => {
      // 回滚
      if (context?.previousData) {
        queryClient.setQueriesData({ queryKey: taskKeys.lists() }, context.previousData);
      }
      const message = error.response?.data?.message || '操作失败';
      toast.error(message);
    },
  });
};

/**
 * 获取所有标签
 */
export const useTags = () => {
  return useQuery({
    queryKey: taskKeys.tags(),
    queryFn: () => fetchAllTags(),
    staleTime: 60000, // 1分钟内数据视为新鲜
  });
};

/**
 * 创建标签 mutation
 */
export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => import('../api/tasks').then(mod => mod.createTag(name)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.tags() });
      toast.success('Tag created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '创建标签失败';
      toast.error(message);
    },
  });
};

/**
 * 删除标签 mutation
 */
export const useDeleteTagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => import('../api/tasks').then(mod => mod.deleteTag(name)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.tags() });
      toast.success('Tag deleted');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '删除标签失败';
      toast.error(message);
    },
  });
};
