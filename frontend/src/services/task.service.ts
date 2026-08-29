import api from '@/lib/axios';
import type { Task, CreateTaskInput, PaginatedTaskResponse, ApiResponse, TaskFilters } from '@/types';

export const taskService = {
  async getTasks(filters: Partial<TaskFilters>) {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.assignee) params.set('assignee', filters.assignee);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

    const res = await api.get<PaginatedTaskResponse>(`/tasks?${params.toString()}`);
    return res.data;
  },

  async getTaskById(id: string) {
    const res = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return res.data.data;
  },

  async createTask(data: CreateTaskInput) {
    const res = await api.post<ApiResponse<Task>>('/tasks', data);
    return res.data.data;
  },

  async updateTask(id: string, data: Partial<CreateTaskInput>) {
    const res = await api.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    return res.data.data;
  },

  async deleteTask(id: string) {
    const res = await api.delete<ApiResponse<null>>(`/tasks/${id}`);
    return res.data;
  },
};
