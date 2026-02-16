import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PartyMasterRecord {
    address: string;
    panNumber: string;
    partyName: string;
    phoneNumber: string;
    dueAmount: bigint;
}
export interface PartyPaymentEntry {
    totalWithTip: bigint;
    entryLocation: string;
    tipAmount: bigint;
    totalCost: bigint;
    description: string;
    numPeople: bigint;
    costPerPerson: bigint;
    tipPercent: bigint;
}
export interface backendInterface {
    createEntry(id: string, details: PartyPaymentEntry): Promise<void>;
    getAllEntries(): Promise<Array<PartyPaymentEntry>>;
    importPartyMasters(records: Array<[string, PartyMasterRecord]>): Promise<void>;
    lookupPartyMaster(partyName: string): Promise<PartyMasterRecord | null>;
}
