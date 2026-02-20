// 🚨 Admin Abuse Service - Simplified Supabase Version
export class AdminAbuseEventState {
  static banned = false;
  static reason = '';
}

export class AdminAbuseService {
  static async reportAbuse(reporterId: string, targetId: string, reason: string) {
    // Placeholder implementation
    console.log(`Abuse reported: ${targetId} - ${reason}`);
    return { success: true };
  }

  static async banUser(userId: string, reason: string) {
    // Placeholder implementation
    console.log(`User banned: ${userId} - ${reason}`);
    AdminAbuseEventState.banned = true;
    AdminAbuseEventState.reason = reason;
    return { success: true };
  }

  static async unbanUser(userId: string) {
    // Placeholder implementation
    console.log(`User unbanned: ${userId}`);
    AdminAbuseEventState.banned = false;
    AdminAbuseEventState.reason = '';
    return { success: true };
  }
}
