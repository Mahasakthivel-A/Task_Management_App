import { Request } from 'express';
import { Types } from 'mongoose';

export interface AuthPayload {
  id: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
