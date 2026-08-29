import request from 'supertest';
import app from '../app';

describe('Task API', () => {
  let token: string;
  let userId: string;
  let secondToken: string;
  let secondUserId: string;

  const user1 = { name: 'Alice', email: 'alice@example.com', password: 'password123' };
  const user2 = { name: 'Bob', email: 'bob@example.com', password: 'password123' };

  beforeEach(async () => {
    const reg1 = await request(app).post('/api/auth/register').send(user1);
    token = reg1.body.data.token;
    userId = reg1.body.data.user._id;

    const reg2 = await request(app).post('/api/auth/register').send(user2);
    secondToken = reg2.body.data.token;
    secondUserId = reg2.body.data.user._id;
  });

  const createTask = (overrides = {}) =>
    request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Task',
        description: 'A test task description',
        priority: 'medium',
        status: 'todo',
        assignee: secondUserId,
        ...overrides,
      });

  describe('POST /api/tasks', () => {
    it('should create a task successfully', async () => {
      const res = await createTask();
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Task');
      expect(res.body.data.creator._id).toBe(userId);
    });

    it('should reject task creation without auth', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task', assignee: secondUserId });
      expect(res.status).toBe(401);
    });

    it('should reject task without title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ assignee: secondUserId });
      expect(res.status).toBe(422);
    });

    it('should reject task without assignee', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task without assignee' });
      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      await createTask({ title: 'Task Alpha', status: 'todo', priority: 'high' });
      await createTask({ title: 'Task Beta', status: 'in_progress', priority: 'low' });
      await createTask({ title: 'Task Gamma', status: 'done', priority: 'medium' });
    });

    it('should return paginated tasks', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(3);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/tasks?status=todo')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((t: { status: string }) => t.status === 'todo')).toBe(true);
    });

    it('should filter by priority', async () => {
      const res = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((t: { priority: string }) => t.priority === 'high')).toBe(true);
    });

    it('should search by title', async () => {
      const res = await request(app)
        .get('/api/tasks?search=Alpha')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Task Alpha');
    });

    it('should paginate correctly', async () => {
      const res = await request(app)
        .get('/api/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return a task by ID', async () => {
      const created = await createTask();
      const taskId = created.body.data._id;

      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(taskId);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .get('/api/tasks/64f1234567890abcdef12345')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task', async () => {
      const created = await createTask();
      const taskId = created.body.data._id;

      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'done', priority: 'high' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('done');
      expect(res.body.data.priority).toBe('high');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const created = await createTask();
      const taskId = created.body.data._id;

      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const check = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(check.status).toBe(404);
    });
  });
});
