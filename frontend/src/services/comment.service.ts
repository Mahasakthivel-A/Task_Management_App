import api from '@/lib/axios';
import type { Comment, ApiResponse } from '@/types';

export const commentService = {
  async getComments(taskId: string) {
    const res = await api.get<ApiResponse<Comment[]>>(`/tasks/${taskId}/comments`);
    return res.data.data;
  },

  async addComment(taskId: string, content: string) {
    const res = await api.post<ApiResponse<Comment>>(`/tasks/${taskId}/comments`, { content });
    return res.data.data;
  },

  async deleteComment(taskId: string, commentId: string) {
    const res = await api.delete<ApiResponse<null>>(`/tasks/${taskId}/comments/${commentId}`);
    return res.data;
  },
};
