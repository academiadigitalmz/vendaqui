export type ID = string;
export type ISODate = string;
export type Money = number;
export type Role = "seller" | "admin" | "student";
export type PaymentMethod = "mpesa" | "emola";
export type PayoutDestinationKind = "mpesa" | "emola" | "bank";
export type KycStatus =
  | "not_started"
  | "draft"
  | "pending"
  | "in_review"
  | "approved"
  | "changes_requested"
  | "rejected";

export interface ApiError {
  code: string;
  message: string;
  details?: { field?: string; reason?: string };
}

export interface User {
  id: ID;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  business?: { name: string; nuit: string; kycStatus: KycStatus };
}

export interface Session {
  token: string;
  user: User;
}
