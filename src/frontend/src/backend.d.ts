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
export interface UserProfile {
    name: string;
}
export interface PartyPaymentEntry {
    entryLocation: string;
    date: string;
    address: string;
    panNumber: string;
    partyName: string;
    comments: string;
    phoneNumber: string;
    nextPaymentDate: string;
    payment: bigint;
    dueAmount: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createEntry(id: string, entry: PartyPaymentEntry): Promise<void>;
    deleteEntry(id: string): Promise<void>;
    getAllEntries(): Promise<Array<PartyPaymentEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEntry(id: string): Promise<PartyPaymentEntry | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    lookupPartyMaster(partyName: string): Promise<PartyMasterRecord | null>;
    registerUser(): Promise<void>;
    revokeUser(user: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateEntry(id: string, entry: PartyPaymentEntry): Promise<void>;
    updatePartyMasters(records: Array<[string, PartyMasterRecord]>): Promise<void>;
}
