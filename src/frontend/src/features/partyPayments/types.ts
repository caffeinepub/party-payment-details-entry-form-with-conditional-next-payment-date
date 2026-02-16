export interface PartyPaymentFormData {
  partyName: string;
  address: string;
  phoneNumber: string;
  panNumber: string;
  dueAmount: string;
  date: string;
  payment: string;
  nextPaymentDate: string;
  comments: string;
  entryLocation: string;
}

export interface PartyPaymentEntry extends PartyPaymentFormData {
  id: string;
  createdAt: string;
}

export interface PartyMaster {
  partyName: string;
  phoneNumber: string;
  address: string;
  panNumber: string;
  dueAmount: string;
}
