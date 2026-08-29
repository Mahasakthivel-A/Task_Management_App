import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import type { Task } from '@/types';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate, timeAgo } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking action buttons
    if ((e.target as HTMLElement).closest('[data-action]')) return;
    navigate(`/tasks/${task._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl border border-border p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      {/* Top row: status + priority + actions */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          data-action
        >
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Edit task"
            data-action
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-destructive transition-colors"
            aria-label="Delete task"
            data-action
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground text-sm leading-snug mb-1.5 line-clamp-2">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-border/60">
        <div className="flex items-center gap-1.5">
          <Avatar name={task.assignee.name} size="sm" />
          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
            {task.assignee.name}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {task.dueDate ? (
            <>
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </>
          ) : (
            <span>{timeAgo(task.createdAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
