// 匹配后端枚举：大写 + 下划线
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

// 后端返回的 tags 是 string[]，但前端 UI 需要颜色信息
// 我们在本地维护 tag 配置映射
export interface Tag {
  id: string;
  label: string;
  color: string;
}

// 后端 API 响应的 Task 结构
export interface Task {
  id: number; // 后端是 Long (number)
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  tags: string[]; // 后端返回字符串数组
  createdAt: string; // ISO 字符串
  updatedAt: string;
  dueAt?: string | null; // 后端字段名是 dueAt
}

// 前端创建/更新任务的 payload
export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  tags?: string[];
  dueAt?: string | null;
}

export interface UpdateTaskPayload extends CreateTaskPayload {
  id: number;
}

// 分页响应
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// 查询参数
export interface TaskQueryParams {
  page?: number;
  size?: number;
  status?: Status;
  priority?: Priority;
  tag?: string;
  sort?: string; // 例如 "createdAt,desc" 或 "priority,asc"
}


export type ViewMode = 'list' | 'kanban';
