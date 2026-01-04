import { apiClient } from './client';
import { Task, CreateTaskPayload, UpdateTaskPayload, PageResponse, TaskQueryParams } from '../types';

// API 路径
const TASKS_BASE = '/api/tasks';

/**
 * 获取任务列表（支持筛选、排序、分页）
 */
export const fetchTasks = async (params?: TaskQueryParams): Promise<PageResponse<Task>> => {
  const response = await apiClient.get<PageResponse<Task>>(TASKS_BASE, { params });
  return response.data;
};

/**
 * 获取单个任务详情
 */
export const fetchTaskById = async (id: number): Promise<Task> => {
  const response = await apiClient.get<Task>(`${TASKS_BASE}/${id}`);
  return response.data;
};

/**
 * 创建新任务
 */
export const createTask = async (payload: CreateTaskPayload): Promise<Task> => {
  const response = await apiClient.post<Task>(TASKS_BASE, payload);
  return response.data;
};

/**
 * 更新任务
 */
export const updateTask = async (id: number, payload: UpdateTaskPayload): Promise<Task> => {
  const response = await apiClient.put<Task>(`${TASKS_BASE}/${id}`, payload);
  return response.data;
};

/**
 * 删除任务
 */
export const deleteTask = async (id: number): Promise<void> => {
  await apiClient.delete(`${TASKS_BASE}/${id}`);
};

/**
 * 快速切换任务状态为已完成
 */
export const completeTask = async (id: number): Promise<Task> => {
  const response = await apiClient.put<Task>(`${TASKS_BASE}/${id}`, {
    status: 'COMPLETED',
  });
  return response.data;
};

/**
 * 获取所有使用过的标签
 */
export const fetchAllTags = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>(`${TASKS_BASE}/tags`);
  return response.data;
};

/**
 * 创建标签
 */
export const createTag = async (name: string): Promise<void> => {
  await apiClient.post(`${TASKS_BASE}/tags`, { name });
};

/**
 * 删除标签
 */
export const deleteTag = async (name: string): Promise<void> => {
  await apiClient.delete(`${TASKS_BASE}/tags/${encodeURIComponent(name)}`);
};
