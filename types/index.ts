export type UserMode = "poster" | "helper";
export type TaskStatus = "requested" | "offers_in" | "accepted" | "in_progress" | "completed" | "paid_out" | "canceled" | "disputed";
export type TaskCategory = "Cleaning" | "Moving" | "Handyman" | "Groceries" | "Other";
export type SupportTicketStatus = "open" | "in_review" | "closed";
export type JobOfferStatus = "pending" | "declined" | "accepted";
export type PaymentStatus = "authorized" | "captured" | "refunded" | "failed";

export interface User {
  id: string;
  name: string;
  phone?: string;
  defaultZipCode?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  zipCode: string;
  areaDescription: string | null;
  fullAddress: string | null;
  price: number;
  status: TaskStatus;
  posterId: string;
  posterName: string;
  helperId?: string;
  helperName?: string;
  confirmationCode: string;
  photosRequired: boolean;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  canceledAt?: string;
  canceledBy?: "poster" | "helper";
}

export interface JobOffer {
  id: string;
  taskId: string;
  helperId: string;
  helperName: string;
  note: string;
  proposedPrice?: number;
  status: JobOfferStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  taskId: string;
  paymentIntentId: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  taskId: string;
  posterId: string;
  helperId: string;
  createdAt: string;
  expiresAt: string;
  isClosed: boolean;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  text?: string;
  imageUrl?: string;
  isProof: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  taskId?: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORIES: TaskCategory[] = ["Cleaning", "Moving", "Handyman", "Groceries", "Other"];

export const PLATFORM_FEE_PERCENT = 0.10;

function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export { generateConfirmationCode };
