import { useState, useEffect, useCallback } from 'react';
import { Plus, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { taskService } from '@/services/task.service';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { PageLoader, Spinner } from '@/components/ui/Spinner';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { DeleteConfirm } from '@/components/tasks/DeleteConfirm';
import { TaskFiltersBar } from '@/components/tasks/TaskFilters';
import type { Task, User, TaskFilters, CreateTaskInput } from '@/types';

const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  status: '',
  priority: '',
  assignee: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 12,
};

export function TaskListPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load users once
  useEffect(() => {
    authService.getUsers().then(setUsers).catch(console.error);
  }, []);

  // Fetch tasks whenever filters change (debounced search)
  const fetchTasks = useCallback(async (currentFilters: TaskFilters) => {
    setIsFetching(true);
    setError(null);
    try {
      const res = await taskService.getTasks(currentFilters);
      setTasks(res.data);
      setPagination(res.pagination);
    } catch {
      setError('Failed to load tasks. Please try again.');
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchTasks(filters), filters.search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [filters, fetchTasks]);

  const handleFilterChange = (key: keyof TaskFilters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key !== 'page' ? 1 : Number(value) }));
  };

  const handleResetFilters = () => setFilters(DEFAULT_FILTERS);

  const handleCreateTask = async (data: CreateTaskInput) => {
    try {
      await taskService.createTask(data);
      toast('Task created successfully!', 'success');
      setShowCreateModal(false);
      fetchTasks(filters);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create task';
      toast(message, 'error');
      throw err;
    }
  };

  const handleUpdateTask = async (data: CreateTaskInput) => {
    if (!editingTask) return;
    try {
      await taskService.updateTask(editingTask._id, data);
      toast('Task updated successfully!', 'success');
      setEditingTask(null);
      fetchTasks(filters);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update task';
      toast(message, 'error');
      throw err;
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    try {
      await taskService.deleteTask(deletingTask._id);
      toast('Task deleted', 'success');
      setDeletingTask(null);
      fetchTasks(filters);
    } catch {
      toast('Failed to delete task', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination.total} task{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4">
        <TaskFiltersBar
          filters={filters}
          users={users}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Content */}
      <div className="relative min-h-[200px]">
        {isFetching && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl">
            <Spinner />
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" className="mt-3" onClick={() => fetchTasks(filters)}>
              Retry
            </Button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">No tasks found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {filters.search || filters.status || filters.priority || filters.assignee
                ? 'No tasks match your current filters. Try adjusting them.'
                : 'Get started by creating your first task.'}
            </p>
            {!filters.search && !filters.status && !filters.priority && !filters.assignee && (
              <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4" />
                Create Task
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={setEditingTask}
                onDelete={setDeletingTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('page', pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('page', pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <TaskForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTask}
        users={users}
        currentUserId={user?._id || ''}
      />
      <TaskForm
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleUpdateTask}
        task={editingTask}
        users={users}
        currentUserId={user?._id || ''}
      />
      <DeleteConfirm
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteTask}
        taskTitle={deletingTask?.title || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}
