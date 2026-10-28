import { Response } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { broadcastNotificationToUser } from '../config/socket.js';

export async function getUserNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error: any) {
    console.error('Failed to get notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to load notifications.' });
  }
}

export async function markNotificationRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id as string;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Failed to mark notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}

export async function markAllNotificationsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error: any) {
    console.error('Failed to mark all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all as read.' });
  }
}

/**
 * Helper to persist a notification and emit it to the user's real-time WebSocket channel
 */
export async function createAndSendNotification(
  userId: string,
  data: {
    title: string;
    message: string;
    type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ACHIEVEMENT';
    link?: string;
  }
) {
  try {
    const created = await prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: data.type || 'INFO',
        link: data.link || null,
      },
    });

    // Real-time WebSocket delivery
    broadcastNotificationToUser(userId, created);
    return created;
  } catch (err) {
    console.error(`Failed creating notification for user ${userId}:`, err);
    return null;
  }
}
