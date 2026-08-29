import { Response, NextFunction } from 'express';
import Comment from '../models/Comment';
import Task from '../models/Task';
import { AuthRequest } from '../types';

export const getComments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', '_id name email')
      .sort({ createdAt: 1 })
      .lean();

    res.json({ success: true, data: comments });
  } catch (err) {
    next(err);
  }
};

export const addComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const comment = await Comment.create({
      task: req.params.taskId,
      author: req.user?.id,
      content: req.body.content,
    });

    const populated = await comment.populate('author', '_id name email');

    res.status(201).json({
      success: true,
      message: 'Comment added',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    // Only the author can delete their own comment
    if (comment.author.toString() !== req.user?.id) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
      return;
    }

    await comment.deleteOne();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};
