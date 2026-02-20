// Firebase Offline-First Sync Architecture
// Queue-based sync with validation and conflict resolution

export interface SyncPacket {
  packet_id: string;
  timestamp: number;
  action_type:
    | 'MATCH_RESULT'
    | 'ECONOMY_UPDATE'
    | 'SEASON_PROGRESS'
    | 'MARKET_TRANSACTION';
  hash_signature: string;
  local_checksum: string;
  data: Record<string, unknown>;
  synced?: boolean;
  syncAttempts?: number;
}

export class OfflineFirstSyncEngine {
  private syncQueue: SyncPacket[] = [];
  private maxRetries = 3;
  private syncInterval = 5000; // Try sync every 5 seconds when online

  public queueAction(
    actionType: SyncPacket['action_type'],
    data: Record<string, unknown>
  ): SyncPacket {
    const packet: SyncPacket = {
      packet_id: this.generatePacketId(),
      timestamp: Date.now(),
      action_type: actionType,
      hash_signature: this.generateHash(data),
      local_checksum: this.calculateChecksum(data),
      data,
      synced: false,
      syncAttempts: 0,
    };

    this.syncQueue.push(packet);
    this.saveQueueToLocalStorage();

    return packet;
  }

  public async syncPendingPackets(
    onlineCheck: () => boolean
  ): Promise<{ successful: number; failed: number }> {
    if (!onlineCheck()) {
      return { successful: 0, failed: 0 };
    }

    let successful = 0;
    let failed = 0;

    for (let i = 0; i < this.syncQueue.length; i++) {
      const packet = this.syncQueue[i];

      if (packet.synced) continue;

      try {
        const result = await this.sendPacketToServer(packet);

        if (result.success) {
          packet.synced = true;
          successful++;
        } else {
          packet.syncAttempts = (packet.syncAttempts || 0) + 1;
          if (packet.syncAttempts >= this.maxRetries) {
            // Move to failed queue or log
            failed++;
          }
        }
      } catch (error) {
        packet.syncAttempts = (packet.syncAttempts || 0) + 1;
        failed++;
      }
    }

    // Remove synced packets
    this.syncQueue = this.syncQueue.filter(p => !p.synced);
    this.saveQueueToLocalStorage();

    return { successful, failed };
  }

  private async sendPacketToServer(
    packet: SyncPacket
  ): Promise<{ success: boolean; serverData?: Record<string, unknown> }> {
    try {
      // Firebase API call would go here
      // For now, mock validation
      const validation = this.validatePacket(packet);
      if (!validation.valid) {
        return { success: false };
      }

      // Simulated server response
      return { success: true, serverData: packet.data };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false };
    }
  }

  private validatePacket(packet: SyncPacket): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Verify hash signature
    const expectedHash = this.generateHash(packet.data);
    if (expectedHash !== packet.hash_signature) {
      errors.push('Hash mismatch');
    }

    // Verify timestamp order (should be newer than last synced)
    // This would be checked against server

    // Verify logical consistency
    if (!packet.data || Object.keys(packet.data).length === 0) {
      errors.push('Empty packet data');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  public handleConflict(
    localPacket: SyncPacket,
    serverData: Record<string, unknown>
  ): Record<string, unknown> {
    // Economy values use server authority
    if (localPacket.action_type === 'ECONOMY_UPDATE') {
      return serverData;
    }

    // Match results use latest timestamp
    if (localPacket.action_type === 'MATCH_RESULT') {
      const serverTime = (serverData.timestamp as number) || 0;
      return serverTime > localPacket.timestamp ? serverData : localPacket.data;
    }

    // Rewards already granted are never revoked
    if (localPacket.action_type === 'SEASON_PROGRESS') {
      if (serverData.rewards && !localPacket.data.rewards) {
        // Server has rewards, keep them
        return { ...localPacket.data, ...serverData };
      }
    }

    return localPacket.data;
  }

  public getPendingPackets(): SyncPacket[] {
    return [...this.syncQueue];
  }

  private generatePacketId(): string {
    return `packet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHash(data: Record<string, unknown>): string {
    // Simple hash for demo (use crypto in production)
    return btoa(JSON.stringify(data)).substring(0, 32);
  }

  private calculateChecksum(data: Record<string, unknown>): string {
    let sum = 0;
    const str = JSON.stringify(data);
    for (let i = 0; i < str.length; i++) {
      sum += str.charCodeAt(i);
    }
    return sum.toString(16);
  }

  private saveQueueToLocalStorage(): void {
    try {
      localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('LocalStorage save error:', error);
    }
  }

  public loadQueueFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('syncQueue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('LocalStorage load error:', error);
    }
  }
}
