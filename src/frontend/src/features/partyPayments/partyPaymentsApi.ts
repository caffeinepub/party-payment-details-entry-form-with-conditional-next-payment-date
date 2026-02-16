import { useActor } from '@/hooks/useActor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PartyPaymentEntry, PartyPaymentFormData, PartyMaster } from './types';
import type { PartyPaymentEntry as BackendEntry, PartyMasterRecord } from '@/backend';

const ENTRIES_QUERY_KEY = ['partyPaymentEntries'];
const PARTY_MASTERS_QUERY_KEY = ['partyMasters'];

// Convert frontend form data to backend entry format
function serializeEntry(data: PartyPaymentFormData): BackendEntry {
  return {
    partyName: data.partyName,
    address: data.address,
    phoneNumber: data.phoneNumber,
    panNumber: data.panNumber,
    dueAmount: BigInt(Math.floor(parseFloat(data.dueAmount || '0') * 100)),
    date: data.date,
    payment: BigInt(Math.floor(parseFloat(data.payment || '0') * 100)),
    nextPaymentDate: data.nextPaymentDate,
    comments: data.comments,
    entryLocation: data.entryLocation || '',
  };
}

// Convert backend entry to frontend format
function deserializeEntry(backendEntry: BackendEntry, id: string): PartyPaymentEntry {
  return {
    id,
    partyName: backendEntry.partyName,
    address: backendEntry.address,
    phoneNumber: backendEntry.phoneNumber,
    panNumber: backendEntry.panNumber,
    dueAmount: (Number(backendEntry.dueAmount) / 100).toFixed(2),
    date: backendEntry.date,
    payment: (Number(backendEntry.payment) / 100).toFixed(2),
    nextPaymentDate: backendEntry.nextPaymentDate,
    comments: backendEntry.comments,
    entryLocation: backendEntry.entryLocation,
    createdAt: backendEntry.date,
  };
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
      // Backend now returns entries without IDs, so we need to generate stable IDs
      // We'll use a combination of party name, date, and payment as a stable identifier
      return backendEntries.map((entry) => {
        const id = `${entry.partyName}-${entry.date}-${entry.payment}`.replace(/\s+/g, '-');
        return deserializeEntry(entry, id);
      });
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

export function useUpdateEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PartyPaymentFormData }) => {
      if (!actor) throw new Error('Actor not initialized');
      const backendEntry = serializeEntry(data);
      await actor.updateEntry(id, backendEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
    },
  });
}

export function useDeleteEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deleteEntry(id);
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
      await actor.updatePartyMasters(records);
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
