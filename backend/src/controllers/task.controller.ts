import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task';
import { AuthRequest, PaginationQuery } from '../types';

const PRIORITY_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

export const getTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      status,
      priority,
      assignee,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as PaginationQuery;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: mongoose.FilterQuery<typeof Task> = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee && mongoose.Types.ObjectId.isValid(assignee)) {
      filter.assignee = new mongoose.Types.ObjectId(assignee);
    }

    // Build sort
    const sort: Record<string, 1 | -1> = {};
    const validSortFields = ['createdAt', 'updatedAt', 'title'];
    if (validSortFields.includes(sortBy)) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort['createdAt'] = -1;
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignee', '_id name email')
        .populate('creator', '_id name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Task.countDocuments(filter),
    ]);

    // Client-side priority sort if requested
    let result = tasks;
    if (sortBy === 'priority') {
      result = [...tasks].sort((a, b) => {
        const diff =
          (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
        return sortOrder === 'asc' ? -diff : diff;
      });
    }

    res.json({
      success: true,
      data: result,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getTaskById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', '_id name email')
      .populate('creator', '_id name email');

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, status, priority, assignee, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      assignee,
      creator: req.user?.id,
      dueDate: dueDate || null,
    });

    const populated = await task.populate([
      { path: 'assignee', select: '_id name email' },
      { path: 'creator', select: '_id name email' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const allowedFields = ['title', 'description', 'status', 'priority', 'assignee', 'dueDate'] as const;
    type AllowedField = typeof allowedFields[number];
    allowedFields.forEach((field: AllowedField) => {
      if (req.body[field] !== undefined) {
        (task as unknown as Record<AllowedField, unknown>)[field] = req.body[field];
      }
    });

    await task.save();

    const populated = await task.populate([
      { path: 'assignee', select: '_id name email' },
      { path: 'creator', select: '_id name email' },
    ]);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // Also delete associated comments
    const Comment = (await import('../models/Comment')).default;
    await Comment.deleteMany({ task: req.params.id });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};
