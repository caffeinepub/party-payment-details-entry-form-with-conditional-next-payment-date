import { useActor } from '@/hooks/useActor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PartyPaymentEntry, PartyPaymentFormData, PartyMaster } from './types';
import type { PartyPaymentEntry as BackendEntry, PartyMasterRecord } from '@/backend';

const ENTRIES_QUERY_KEY = ['partyPaymentEntries'];
const PARTY_MASTERS_QUERY_KEY = ['partyMasters'];

// Serialize frontend data to backend format
function serializeEntry(data: PartyPaymentFormData): BackendEntry {
  return {
    description: JSON.stringify(data),
    entryLocation: data.entryLocation || '',
    totalCost: BigInt(0),
    tipPercent: BigInt(0),
    tipAmount: BigInt(0),
    totalWithTip: BigInt(0),
    costPerPerson: BigInt(0),
    numPeople: BigInt(0),
  };
}

// Deserialize backend data to frontend format
function deserializeEntry(backendEntry: BackendEntry, index: number): PartyPaymentEntry {
  try {
    const data = JSON.parse(backendEntry.description) as PartyPaymentFormData;
    return {
      ...data,
      entryLocation: backendEntry.entryLocation || data.entryLocation || '',
      id: `entry-${index}`,
      createdAt: data.date,
    };
  } catch {
    // Fallback for invalid data
    return {
      id: `entry-${index}`,
      partyName: 'Unknown',
      address: '',
      phoneNumber: '',
      panNumber: '',
      dueAmount: '0',
      date: new Date().toISOString().split('T')[0],
      payment: '0',
      nextPaymentDate: '',
      comments: backendEntry.description,
      entryLocation: backendEntry.entryLocation || '',
      createdAt: new Date().toISOString().split('T')[0],
    };
  }
}

function serializePartyMaster(master: PartyMaster): PartyMasterRecord {
  return {
    partyName: master.partyName,
    phoneNumber: master.phoneNumber,
    address: master.address,
    panNumber: master.panNumber,
    dueAmount: BigInt(Math.floor(parseFloat(master.dueAmount || '0') * 100)),
  };
}

function deserializePartyMaster(record: PartyMasterRecord): PartyMaster {
  return {
    partyName: record.partyName,
    phoneNumber: record.phoneNumber,
    address: record.address,
    panNumber: record.panNumber,
    dueAmount: (Number(record.dueAmount) / 100).toFixed(2),
  };
}

export function useGetAllEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<PartyPaymentEntry[]>({
    queryKey: ENTRIES_QUERY_KEY,
    queryFn: async () => {
      if (!actor) return [];
      const backendEntries = await actor.getAllEntries();
      return backendEntries.map((entry, index) => deserializeEntry(entry, index));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PartyPaymentFormData) => {
      if (!actor) throw new Error('Actor not initialized');
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const backendEntry = serializeEntry(data);
      await actor.createEntry(id, backendEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
    },
  });
}

export function useImportPartyMasters() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (masters: PartyMaster[]) => {
      if (!actor) throw new Error('Actor not initialized');
      const records: [string, PartyMasterRecord][] = masters.map(m => [
        m.partyName,
        serializePartyMaster(m),
      ]);
      await actor.importPartyMasters(records);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTY_MASTERS_QUERY_KEY });
    },
  });
}

export function useLookupPartyMaster() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (partyName: string) => {
      if (!actor) return null;
      const record = await actor.lookupPartyMaster(partyName);
      return record ? deserializePartyMaster(record) : null;
    },
  });
}
