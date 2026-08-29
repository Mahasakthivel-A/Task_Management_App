import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface DeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  taskTitle: string;
  isLoading?: boolean;
}

export function DeleteConfirm({ isOpen, onClose, onConfirm, taskTitle, isLoading }: DeleteConfirmProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Task" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-50">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-foreground">
              Are you sure you want to delete{' '}
              <span className="font-semibold">"{taskTitle}"</span>?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This action cannot be undone. All comments will also be removed.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} isLoading={isLoading}>
            Delete Task
          </Button>
        </div>
      </div>
    </Modal>
  );
}
