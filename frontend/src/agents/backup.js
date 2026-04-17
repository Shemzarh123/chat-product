// AO Backup Agent - Auto-backup to minimize loss
export const BackupAgent = {
  shouldBackup(messages, lastBackupTime, inactivityMinutes = 30) {
    const now = Date.now();
    const inactive = (now - lastBackupTime) > (inactivityMinutes * 60 * 1000);
    const messageCount = messages.length;
    return inactive && messageCount > 5; // Backup if inactive + enough messages
  },

  getBackupPayload(messages, chatId) {
    return {
      chatId,
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.created_at,
        status: msg.status
      })),
      timestamp: new Date().toISOString()
    };
  },

  async triggerBackup(messages, chatId, backupStorage = localStorage) {
    const payload = this.getBackupPayload(messages, chatId);
    backupStorage.setItem(`backup_${chatId}`, JSON.stringify(payload));
    console.log('AO Backup triggered:', payload.timestamp);
  }
};

