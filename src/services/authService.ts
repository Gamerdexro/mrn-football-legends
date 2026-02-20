// 🔐 Supabase Authentication Service - Free
import { supabase, User } from '../lib/supabase';

export class AuthService {
  // Sign up new user
  static async signUp(email: string, password: string, username: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            level: 1,
            experience: 0,
            coins: 1000,
            total_matches: 0,
            wins: 0,
            losses: 0,
            win_rate: 0
          }
        }
      });

      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  // Alias for signUp (for compatibility)
  static async signup(email: string, password: string, username: string) {
    return this.signUp(email, password, username);
  }

  // Alias for signIn (for compatibility)
  static async login(email: string, password: string) {
    return this.signIn(email, password);
  }

  // Get user by username
  static async getUserByUsername(username: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return { success: true, user: data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  // Sign in existing user
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  // Sign out
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  // Get current user
  static async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      return null;
    }
  }

  // Update user profile
  static async updateProfile(updates: Partial<User>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', (await this.getCurrentUser())?.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, user: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Alias for updateProfile (for compatibility)
  static async updateUserProfile(updates: Partial<User>) {
    return this.updateProfile(updates);
  }

  // Logout (alias for signOut)
  static async logout() {
    return this.signOut();
  }

  // Gift coins to user
  static async giftToUser(fromUserId: string, targetUsername: string, amount: number) {
    try {
      // Get target user
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id, coins')
        .eq('username', targetUsername)
        .single();

      if (userError || !targetUser) {
        return { success: false, error: 'User not found' };
      }

      // Check if sender has enough coins
      const { data: sender, error: senderError } = await supabase
        .from('users')
        .select('coins')
        .eq('id', fromUserId)
        .single();

      if (senderError || !sender || sender.coins < amount) {
        return { success: false, error: 'Insufficient coins' };
      }

      // Transfer coins
      const { error: transferError } = await supabase.rpc('transfer_coins', {
        from_user_id: fromUserId,
        to_user_id: targetUser.id,
        amount: amount
      });

      if (transferError) throw transferError;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Login with Google (placeholder)
  static async loginWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });

      if (error) throw error;
      return { success: true, user: data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  // Reset password
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Delete account
  static async deleteAccount(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Also delete auth user
      await supabase.auth.admin.deleteUser(userId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Listen to auth changes
  static onAuthChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}
