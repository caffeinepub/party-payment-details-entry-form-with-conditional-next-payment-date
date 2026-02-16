import type { PartyMaster } from './types';

const STORAGE_KEY = 'partyMasters';

export function savePartyMasters(masters: PartyMaster[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(masters));
  } catch (error) {
    console.error('Failed to save party masters:', error);
  }
}

export function loadPartyMasters(): PartyMaster[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as PartyMaster[];
  } catch (error) {
    console.error('Failed to load party masters:', error);
    return [];
  }
}

export function normalizePartyMasterKey(name: string): string {
  return name.trim().toLowerCase();
}

export function findPartyMaster(name: string, masters: PartyMaster[]): PartyMaster | undefined {
  const normalizedName = normalizePartyMasterKey(name);
  return masters.find(m => normalizePartyMasterKey(m.partyName) === normalizedName);
}
