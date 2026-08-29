import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Task, CreateTaskInput, User } from '@/types';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  task?: Task | null;
  users: User[];
  currentUserId: string;
}

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function TaskForm({ isOpen, onClose, onSubmit, task, users, currentUserId }: TaskFormProps) {
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput>({
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee: currentUserId,
      dueDate: null,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignee: typeof task.assignee === 'string' ? task.assignee : task.assignee._id,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : null,
      });
    } else {
      reset({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assignee: currentUserId,
        dueDate: null,
      });
    }
  }, [task, currentUserId, reset, isOpen]);

  const handleFormSubmit = async (data: CreateTaskInput) => {
    await onSubmit({
      ...data,
      dueDate: data.dueDate || null,
    });
    reset();
  };

  const userOptions = users.map((u) => ({ value: u._id, label: u.name }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create New Task'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <Input
          label="Title *"
          placeholder="What needs to be done?"
          error={errors.title?.message}
          {...register('title', {
            required: 'Title is required',
            minLength: { value: 3, message: 'Title must be at least 3 characters' },
            maxLength: { value: 200, message: 'Title cannot exceed 200 characters' },
          })}
        />

        <Textarea
          label="Description"
          placeholder="Add more details about this task..."
          rows={3}
          error={errors.description?.message}
          {...register('description', {
            maxLength: { value: 2000, message: 'Description cannot exceed 2000 characters' },
          })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status', { required: 'Status is required' })}
          />
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            error={errors.priority?.message}
            {...register('priority', { required: 'Priority is required' })}
          />
        </div>

        <Select
          label="Assignee *"
          options={userOptions}
          placeholder="Select assignee"
          error={errors.assignee?.message}
          {...register('assignee', { required: 'Assignee is required' })}
        />

        <Input
          label="Due Date"
          type="date"
          error={errors.dueDate?.message}
          {...register('dueDate')}
        />

        <div className="flex gap-3 justify-end pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
