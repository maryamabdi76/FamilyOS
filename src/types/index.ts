// Domain types for the entities in scope for Phase 0/1 (spec §7, §43).
// Document/Product/Warranty/etc. types are added in Phase 2+ alongside
// their schema and features, rather than stubbed out ahead of time.

export type HouseholdRole = "OWNER" | "MEMBER";

export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Household {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  role: HouseholdRole;
  createdAt: string;
}

export interface Person {
  id: string;
  householdId: string;
  name: string;
  relationship: string | null;
  avatarUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
