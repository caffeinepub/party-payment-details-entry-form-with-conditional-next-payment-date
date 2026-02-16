import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Migration "migration";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // NEW SCHEMA
  type PartyPaymentEntry = {
    partyName : Text;
    address : Text;
    phoneNumber : Text;
    panNumber : Text;
    dueAmount : Int;
    date : Text;
    payment : Int;
    nextPaymentDate : Text;
    comments : Text;
    entryLocation : Text;
  };

  type UserProfile = {
    name : Text;
  };

  type PartyMasterRecord = {
    partyName : Text;
    phoneNumber : Text;
    address : Text;
    panNumber : Text;
    dueAmount : Int;
  };

  type EntryWithOwner = {
    owner : Principal;
    entry : PartyPaymentEntry;
  };

  let entries = Map.empty<Text, EntryWithOwner>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let partyMasters = Map.empty<Text, PartyMasterRecord>();

  // User registration and management
  public shared ({ caller }) func registerUser() : async () {
    AccessControl.assignRole(accessControlState, caller, caller, #user);
  };

  public shared ({ caller }) func revokeUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove users");
    };
    // Assign guest role to "revoke" user access
    AccessControl.assignRole(accessControlState, caller, user, #guest);
  };

  public shared ({ caller }) func updatePartyMasters(records : [(Text, PartyMasterRecord)]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update party masters");
    };
    partyMasters.clear();

    for ((name, record) in records.values()) {
      partyMasters.add(name, record);
    };
  };

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Look up PartyMaster for authenticated users
  public query ({ caller }) func lookupPartyMaster(partyName : Text) : async ?PartyMasterRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can lookup party masters");
    };
    partyMasters.get(partyName);
  };

  // Party payment entry management
  public shared ({ caller }) func createEntry(id : Text, entry : PartyPaymentEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create entries");
    };
    let entryWithOwner : EntryWithOwner = {
      owner = caller;
      entry = entry;
    };
    entries.add(id, entryWithOwner);
  };

  public shared ({ caller }) func updateEntry(id : Text, entry : PartyPaymentEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update entries");
    };
    switch (entries.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entryWithOwner) {
        if (entryWithOwner.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own entries");
        };
        let updatedEntryWithOwner : EntryWithOwner = {
          owner = entryWithOwner.owner;
          entry = entry;
        };
        entries.add(id, updatedEntryWithOwner);
      };
    };
  };

  public shared ({ caller }) func deleteEntry(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete entries");
    };
    switch (entries.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entryWithOwner) {
        if (entryWithOwner.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own entries");
        };
        entries.remove(id);
      };
    };
  };

  public query ({ caller }) func getEntry(id : Text) : async ?PartyPaymentEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view entries");
    };
    switch (entries.get(id)) {
      case (null) { null };
      case (?entryWithOwner) {
        if (entryWithOwner.owner == caller or AccessControl.isAdmin(accessControlState, caller)) {
          ?entryWithOwner.entry;
        } else {
          Runtime.trap("Unauthorized: Can only view your own entries");
        };
      };
    };
  };

  public query ({ caller }) func getAllEntries() : async [PartyPaymentEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view entries");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    entries.values()
      .filter(func(entryWithOwner : EntryWithOwner) : Bool {
        isAdmin or entryWithOwner.owner == caller
      })
      .map(func(entryWithOwner : EntryWithOwner) : PartyPaymentEntry {
        entryWithOwner.entry;
      })
      .toArray();
  };
};
