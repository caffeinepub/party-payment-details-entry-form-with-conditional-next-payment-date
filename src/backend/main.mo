import Map "mo:core/Map";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Iter "mo:core/Iter";



actor {
  type PartyPaymentEntry = {
    description : Text;
    entryLocation : Text;
    totalCost : Int;
    tipPercent : Int;
    tipAmount : Int;
    totalWithTip : Int;
    costPerPerson : Int;
    numPeople : Int;
  };

  type PartyMasterRecord = {
    partyName : Text;
    phoneNumber : Text;
    address : Text;
    panNumber : Text;
    dueAmount : Int;
  };

  let entries = Map.empty<Text, PartyPaymentEntry>();
  let partyMasters = Map.empty<Text, PartyMasterRecord>();

  public shared ({ caller }) func createEntry(id : Text, details : PartyPaymentEntry) : async () {
    entries.add(id, details);
  };

  public shared ({ caller }) func importPartyMasters(records : [(Text, PartyMasterRecord)]) : async () {
    for ((name, record) in records.values()) {
      partyMasters.add(name, record);
    };
  };

  public query ({ caller }) func getAllEntries() : async [PartyPaymentEntry] {
    entries.values().toArray();
  };

  public query ({ caller }) func lookupPartyMaster(partyName : Text) : async ?PartyMasterRecord {
    partyMasters.get(partyName);
  };
};
