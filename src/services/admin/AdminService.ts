import { AuthService } from '../authService';
import { UserProfile } from '../../types/user';
import players from '../../data/players.json';

export class AdminService {
    static async giftPlayer(adminUser: UserProfile, targetUsername: string, playerId: string): Promise<{ success: boolean, message: string }> {
        if (adminUser.role !== 'Owner' && adminUser.role !== 'Admin') {
            return { success: false, message: 'Unauthorized: Only Owner or Admin can gift players.' };
        }

        const target = await AuthService.getUserByUsername(targetUsername);
        if (!target) {
            return { success: false, message: 'User not found.' };
        }

        const player = players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, message: 'Player not found.' };
        }

        await AuthService.giftToUser(adminUser, target.username, { playerIds: [playerId] });

        return { success: true, message: `Successfully gifted ${player.name} (${player.rarity}) to ${targetUsername}.` };
    }
}
