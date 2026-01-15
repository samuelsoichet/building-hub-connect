import { supabase } from "@/integrations/supabase/client";
import type { Notification, NotificationType } from "@/types/supabase-custom";

/**
 * Fetch notifications for the current user
 */
export async function fetchNotifications(
  options: { unreadOnly?: boolean; limit?: number } = {}
): Promise<Notification[]> {
  try {
    let query = (supabase as any)
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (options.unreadOnly) {
      query = query.eq('read', false);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error in fetchNotifications:", err);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    if (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error("Error in getUnreadNotificationCount:", err);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await (supabase as any)
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await (supabase as any)
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Subscribe to real-time notification updates
 */
export function subscribeToNotifications(
  onNotification: (notification: Notification) => void
): () => void {
  const channel = supabase
    .channel('notifications-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => {
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Get notification type icon and color
 */
export function getNotificationTypeInfo(type: NotificationType): {
  icon: string;
  color: string;
  bgColor: string;
} {
  const typeMap: Record<NotificationType, { icon: string; color: string; bgColor: string }> = {
    work_order_created: { icon: '📝', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    work_order_approved: { icon: '✅', color: 'text-green-600', bgColor: 'bg-green-50' },
    work_order_rejected: { icon: '❌', color: 'text-red-600', bgColor: 'bg-red-50' },
    work_order_in_progress: { icon: '🔧', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    work_order_completed: { icon: '🎉', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    work_order_signed_off: { icon: '✍️', color: 'text-green-600', bgColor: 'bg-green-50' },
    payment_received: { icon: '💰', color: 'text-green-600', bgColor: 'bg-green-50' },
    payment_due: { icon: '📅', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    general: { icon: '📢', color: 'text-gray-600', bgColor: 'bg-gray-50' },
  };

  return typeMap[type] || { icon: '📢', color: 'text-gray-600', bgColor: 'bg-gray-50' };
}

/**
 * Format notification time
 */
export function formatNotificationTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
