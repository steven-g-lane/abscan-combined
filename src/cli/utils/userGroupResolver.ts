import { execSync } from 'child_process';

interface ResolvedOwnership {
  userName: string | null;
  groupName: string | null;
}

/**
 * Cache for user and group name lookups to avoid repeated system calls
 */
class UserGroupCache {
  private userCache = new Map<number, string | null>();
  private groupCache = new Map<number, string | null>();

  getUserName(uid: number): string | null {
    if (this.userCache.has(uid)) {
      return this.userCache.get(uid)!;
    }

    const userName = this.resolveUserName(uid);
    this.userCache.set(uid, userName);
    return userName;
  }

  getGroupName(gid: number): string | null {
    if (this.groupCache.has(gid)) {
      return this.groupCache.get(gid)!;
    }

    const groupName = this.resolveGroupName(gid);
    this.groupCache.set(gid, groupName);
    return groupName;
  }

  private resolveUserName(uid: number): string | null {
    try {
      if (process.platform === 'win32') {
        // Windows doesn't have traditional UID/GID system
        return null;
      }

      // Use `id -un <uid>` to resolve username
      const result = execSync(`id -un ${uid}`, { 
        encoding: 'utf8', 
        timeout: 1000,
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();
      
      return result || null;
    } catch (error) {
      // User ID doesn't exist or command failed
      return null;
    }
  }

  private resolveGroupName(gid: number): string | null {
    try {
      if (process.platform === 'win32') {
        // Windows doesn't have traditional UID/GID system
        return null;
      }

      if (process.platform === 'darwin') {
        // macOS - use dscl to lookup group name
        const result = execSync(`dscl . -search /Groups PrimaryGroupID ${gid}`, { 
          encoding: 'utf8', 
          timeout: 1000,
          stdio: ['ignore', 'pipe', 'ignore']
        });
        
        // Parse output: "groupname		PrimaryGroupID = ( 20 )"
        const lines = result.trim().split('\n');
        for (const line of lines) {
          const match = line.match(/^(\w+)\s+PrimaryGroupID/);
          if (match) {
            return match[1];
          }
        }
        return null;
      } else {
        // Linux/Unix - use getent or id command
        try {
          const result = execSync(`getent group ${gid}`, { 
            encoding: 'utf8', 
            timeout: 1000,
            stdio: ['ignore', 'pipe', 'ignore']
          });
          
          // Parse output: "groupname:x:20:users"
          const parts = result.trim().split(':');
          return parts[0] || null;
        } catch {
          // Fallback to id command
          const result = execSync(`id -gn ${gid}`, { 
            encoding: 'utf8', 
            timeout: 1000,
            stdio: ['ignore', 'pipe', 'ignore']
          }).trim();
          
          return result || null;
        }
      }
    } catch (error) {
      // Group ID doesn't exist or command failed
      return null;
    }
  }

  clear(): void {
    this.userCache.clear();
    this.groupCache.clear();
  }
}

// Global cache instance
const globalUserGroupCache = new UserGroupCache();

/**
 * Resolves numeric UID and GID to human-readable names
 */
export function resolveUserGroupNames(uid?: number, gid?: number): ResolvedOwnership {
  if (uid === undefined && gid === undefined) {
    return { userName: null, groupName: null };
  }

  const userName = uid !== undefined ? globalUserGroupCache.getUserName(uid) : null;
  const groupName = gid !== undefined ? globalUserGroupCache.getGroupName(gid) : null;

  return { userName, groupName };
}

/**
 * Formats user and group names with fallback to numeric IDs
 */
export function formatOwnershipWithFallback(
  uid?: number, 
  gid?: number, 
  userName?: string | null, 
  groupName?: string | null
): { owner: string; group: string } {
  const resolvedOwnership = userName !== undefined && groupName !== undefined
    ? { userName, groupName }
    : resolveUserGroupNames(uid, gid);

  const owner = resolvedOwnership.userName || (uid !== undefined ? uid.toString() : 'unknown');
  const group = resolvedOwnership.groupName || (gid !== undefined ? gid.toString() : 'unknown');

  return { owner, group };
}

/**
 * Clear the user/group name cache (useful for testing or long-running processes)
 */
export function clearUserGroupCache(): void {
  globalUserGroupCache.clear();
}