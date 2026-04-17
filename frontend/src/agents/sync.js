// AO Sync Agent - Multi-device sync & conflict resolution
export const SyncAgent = {
  detectConflicts(localMsg, remoteMsg) {
    return localMsg.id === remoteMsg.id && localMsg.content !== remoteMsg.content;
  },

  resolveConflict(local, remote, strategy = 'remote_priority') {
    switch (strategy) {
      case 'remote_priority':
        return remote;
      case 'timestamp':
        return new Date(local.created_at) > new Date(remote.created_at) ? local : remote;
      default:
        return remote;
    }
  },

  async syncMessages(localMessages, remoteMessages, chatId) {
    const conflicts = [];
    const merged = [...remoteMessages];

    localMessages.forEach(local => {
      const remote = remoteMessages.find(r => r.id === local.id);
      if (remote) {
        if (this.detectConflicts(local, remote)) {
          conflicts.push(local.id);
          const resolved = this.resolveConflict(local, remote);
          const index = merged.findIndex(m => m.id === resolved.id);
          merged[index] = resolved;
        }
      } else {
        merged.push(local);
      }
    });

    // Save merged
    console.log(`Sync complete for ${chatId}: ${conflicts.length} conflicts resolved`);
    return merged;
  }
};

