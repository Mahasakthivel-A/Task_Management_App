import request from 'supertest';
import app from '../app';

describe('Comment API', () => {
  let token: string;
  let token2: string;
  let userId2: string;
  let taskId: string;

  beforeEach(async () => {
    const reg1 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });
    token = reg1.body.data.token;

    const reg2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@example.com', password: 'password123' });
    token2 = reg2.body.data.token;
    userId2 = reg2.body.data.user._id;

    const task = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Task for comments',
        assignee: userId2,
        priority: 'medium',
        status: 'todo',
      });
    taskId = task.body.data._id;
  });

  describe('POST /api/tasks/:taskId/comments', () => {
    it('should add a comment to a task', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'This is a comment' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('This is a comment');
    });

    it('should reject empty comment', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/tasks/:taskId/comments', () => {
    it('should return all comments for a task', async () => {
      await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Comment 1' });

      await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ content: 'Comment 2' });

      const res = await request(app)
        .get(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('DELETE /api/tasks/:taskId/comments/:commentId', () => {
    it('should allow author to delete their comment', async () => {
      const comment = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Delete me' });

      const commentId = comment.body.data._id;

      const res = await request(app)
        .delete(`/api/tasks/${taskId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should prevent non-author from deleting comment', async () => {
      const comment = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Cannot delete' });

      const commentId = comment.body.data._id;

      const res = await request(app)
        .delete(`/api/tasks/${taskId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
    });
  });
});
