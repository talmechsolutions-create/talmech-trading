import path from 'path';
import { readJsonArray, writeJsonArray } from './marketplaceStore';
import { hasDatabaseConnection, listUsers, updateUserRegistrationStatus } from '@/lib/proDb';
import { canUseJsonFileStorage } from '@/lib/storageMode';

const dataDir = path.join(process.cwd(), 'data');
export const buyerUsersFile = path.join(dataDir, 'user-buyers.json');
export const sellerUsersFile = path.join(dataDir, 'user-sellers.json');
export const traderUsersFile = path.join(dataDir, 'user-traders.json');

export function userFileFor(role: string) {
  const r = String(role || '').toLowerCase();
  if (r.includes('seller') || r.includes('supplier') || r.includes('manufacturer')) return sellerUsersFile;
  if (r.includes('trader')) return traderUsersFile;
  return buyerUsersFile;
}

export async function allUsers() {
  if (hasDatabaseConnection()) return listUsers();
  if (!canUseJsonFileStorage()) return [];
  const [buyers, sellers, traders] = await Promise.all([readJsonArray(buyerUsersFile), readJsonArray(sellerUsersFile), readJsonArray(traderUsersFile)]);
  return [...buyers.map((u:any)=>({...u, table:'buyers'})), ...sellers.map((u:any)=>({...u, table:'sellers'})), ...traders.map((u:any)=>({...u, table:'traders'}))];
}

export async function updateUserStatus(id: string, status: string, reason?: string) {
  if (hasDatabaseConnection() || !canUseJsonFileStorage()) {
    return updateUserRegistrationStatus(id, status, reason);
  }
  for (const file of [buyerUsersFile, sellerUsersFile, traderUsersFile]) {
    const rows = await readJsonArray(file);
    const idx = rows.findIndex((r:any)=>r.id===id);
    if (idx >= 0) {
      rows[idx] = {...rows[idx], status, statusReason: reason || '', updatedAt: new Date().toISOString()};
      await writeJsonArray(file, rows);
      return rows[idx];
    }
  }
  return null;
}
