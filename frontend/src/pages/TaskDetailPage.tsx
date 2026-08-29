import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Send, Loader2, MessageSquare, CalendarDays, UserCircle2, Clock } from 'lucide-react';
import { taskService } from '@/services/task.service';
import { commentService } from '@/services/comment.service';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { TaskForm } from '@/components/tasks/TaskForm';
import { DeleteConfirm } from '@/components/tasks/DeleteConfirm';
import { formatDateTime, timeAgo, formatDate } from '@/lib/utils';
import type { Task, Comment, User, CreateTaskInput } from '@/types';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [taskData, commentsData, usersData] = await Promise.all([
          taskService.getTaskById(id),
          commentService.getComments(id),
          authService.getUsers(),
        ]);
        setTask(taskData);
        setComments(commentsData);
        setUsers(usersData);
      } catch {
        setError('Failed to load task. It may have been deleted.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleUpdateTask = async (data: CreateTaskInput) => {
    if (!task) return;
    try {
      const updated = await taskService.updateTask(task._id, data);
      setTask(updated);
      setShowEditModal(false);
      toast('Task updated', 'success');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update task';
      toast(message, 'error');
      throw err;
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    setIsDeleting(true);
    try {
      await taskService.deleteTask(task._id);
      toast('Task deleted', 'success');
      navigate('/');
    } catch {
      toast('Failed to delete task', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = commentText.trim();
    if (!content || !id) return;
    setIsSubmittingComment(true);
    try {
      const comment = await commentService.addComment(id, content);
      setComments((prev) => [...prev, comment]);
      setCommentText('');
    } catch {
      toast('Failed to add comment', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    setDeletingCommentId(commentId);
    try {
      await commentService.deleteComment(id, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {
      toast('Failed to delete comment', 'error');
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (isLoading) return <PageLoader />;

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-destructive font-medium">{error || 'Task not found'}</p>
        <Link to="/" className="mt-4">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Tasks
      </Link>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-border p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-3">{task.title}</h1>

        {task.description ? (
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mb-6">
            {task.description}
          </p>
        ) : (
          <p className="text-muted-foreground italic mb-6">No description provided.</p>
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-b border-border">
          <MetaItem
            icon={<UserCircle2 className="h-4 w-4" />}
            label="Assignee"
            value={
              <div className="flex items-center gap-1.5">
                <Avatar name={task.assignee.name} size="sm" />
                <span className="text-sm font-medium truncate">{task.assignee.name}</span>
              </div>
            }
          />
          <MetaItem
            icon={<UserCircle2 className="h-4 w-4" />}
            label="Created by"
            value={
              <div className="flex items-center gap-1.5">
                <Avatar name={task.creator.name} size="sm" />
                <span className="text-sm font-medium truncate">{task.creator.name}</span>
              </div>
            }
          />
          <MetaItem
            icon={<Clock className="h-4 w-4" />}
            label="Created"
            value={<span className="text-sm">{formatDateTime(task.createdAt)}</span>}
          />
          {task.dueDate ? (
            <MetaItem
              icon={<CalendarDays className="h-4 w-4" />}
              label="Due Date"
              value={<span className="text-sm">{formatDate(task.dueDate)}</span>}
            />
          ) : (
            <MetaItem
              icon={<Clock className="h-4 w-4" />}
              label="Updated"
              value={<span className="text-sm">{timeAgo(task.updatedAt)}</span>}
            />
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-xl border border-border p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          Comments
          <span className="ml-1 text-sm font-normal text-muted-foreground">({comments.length})</span>
        </h2>

        {/* Comment list */}
        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No comments yet. Be the first to comment.
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="flex gap-3 group">
                <Avatar name={comment.author.name} size="sm" className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                    {comment.author._id === user?._id && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-destructive transition-all"
                        aria-label="Delete comment"
                        disabled={deletingCommentId === comment._id}
                      >
                        {deletingCommentId === comment._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-gray-50 rounded-lg px-3 py-2">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add comment */}
        {user && (
          <form onSubmit={handleAddComment} className="flex gap-3 pt-4 border-t border-border">
            <Avatar name={user.name} size="sm" className="flex-shrink-0 mt-1" />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                maxLength={1000}
                className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Add comment"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!commentText.trim() || isSubmittingComment}
                isLoading={isSubmittingComment}
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Modals */}
      <TaskForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateTask}
        task={task}
        users={users}
        currentUserId={user?._id || ''}
      />
      <DeleteConfirm
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteTask}
        taskTitle={task.title}
        isLoading={isDeleting}
      />
    </div>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div>{value}</div>
    </div>
  );
}
