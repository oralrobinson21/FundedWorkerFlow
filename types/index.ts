export type UserMode = "poster" | "helper";
export type TaskStatus = "requested" | "accepted" | "in_progress" | "completed" | "canceled" | "disputed";
export type TaskCategory = "Cleaning" | "Moving" | "Handyman" | "Groceries" | "Other";
export type SupportTicketStatus = "open" | "in_review" | "closed";
export type JobOfferStatus = "pending" | "declined" | "accepted";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  defaultZipCode?: string;
  accountNumber: string;
  stripeAccountId?: string;
  payoutsEnabled?: boolean;
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
  posterEmail?: string;
  helperId?: string;
  helperName?: string;
  helperEmail?: string;
  confirmationCode: string;
  photosRequired: boolean;
  // Stripe/payment fields
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  platformFeeAmount?: number;
  helperAmount?: number;
  paymentStatus?: PaymentStatus;
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

export interface Conversation {
  id: string;
  taskId: string;
  threadId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarIndex: number;
  unreadCount: number;
  lastMessageTime: string;
  taskTitle: string;
  lastMessage: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isProof?: boolean;
}

export const CATEGORIES: TaskCategory[] = ["Cleaning", "Moving", "Handyman", "Groceries", "Other"];
export const PLATFORM_FEE_PERCENT = 0.10;

function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export { generateConfirmationCode, generateOTP };
