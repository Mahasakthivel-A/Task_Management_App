import api from '@/lib/axios';
import type { User, ApiResponse } from '@/types';

interface AuthData {
  token: string;
  user: User;
}

export const authService = {
  async register(name: string, email: string, password: string) {
    const res = await api.post<ApiResponse<AuthData>>('/auth/register', {
      name,
      email,
      password,
    });
    return res.data.data;
  },

  async login(email: string, password: string) {
    const res = await api.post<ApiResponse<AuthData>>('/auth/login', {
      email,
      password,
    });
    return res.data.data;
  },

  async getMe() {
    const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data.data.user;
  },

  async getUsers() {
    const res = await api.get<ApiResponse<{ users: User[] }>>('/auth/users');
    return res.data.data.users;
  },
};
