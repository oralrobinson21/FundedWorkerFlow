export type UserMode = "poster" | "helper";
export type TaskStatus = "requested" | "unpaid" | "paid_waiting" | "assigned" | "in_progress" | "worker_marked_done" | "completed" | "canceled" | "disputed";
export type TaskCategory = 
  | "Cleaning & Housekeeping"
  | "Moving & Heavy Lifting"
  | "Delivery & Pickups"
  | "Handyman & Repairs"
  | "Yardwork & Outdoors"
  | "Errands & Small Tasks"
  | "Tech Help"
  | "Pet Care"
  | "Car Help"
  | "Home Organizing"
  | "Babysitting & Senior Help"
  | "Beauty & Personal Services"
  | "Other";
export type SupportTicketStatus = "open" | "in_review" | "closed";
export type DisputeStatus = "pending" | "in_review" | "resolved_helper" | "resolved_poster" | "resolved_split";
export type JobOfferStatus = "pending" | "declined" | "accepted";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";
export type ExtraWorkStatus = "pending" | "accepted" | "rejected" | "paid";

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  defaultZipCode?: string;
  accountNumber: string;
  stripeAccountId?: string;
  payoutsEnabled?: boolean;
  profilePhotoUrl?: string;
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
  posterPhotoUrl?: string;
  helperId?: string;
  helperName?: string;
  helperEmail?: string;
  confirmationCode: string;
  photosRequired: boolean;
  toolsRequired: boolean;
  toolsProvided: boolean;
  photos: string[];
  taskPhotoUrl?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  platformFeeAmount?: number;
  helperAmount?: number;
  paymentStatus?: PaymentStatus;
  tipAmount?: number;
  tipStripePaymentIntentId?: string;
  tipCreatedAt?: string;
  extraAmountPaid?: number;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  canceledAt?: string;
  canceledBy?: "poster" | "helper";
  disputeId?: string;
  disputedAt?: string;
  disputedBy?: "poster" | "helper";
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

export interface ExtraWorkRequest {
  id: string;
  taskId: string;
  helperId: string;
  amount: number;
  reason: string;
  photoUrls?: string[];
  status: ExtraWorkStatus;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
  respondedAt?: string;
  paidAt?: string;
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

export interface Dispute {
  id: string;
  taskId: string;
  initiatorId: string;
  initiatorRole: "poster" | "helper";
  reason: string;
  posterPhotoUrls: string[];
  helperPhotoUrls: string[];
  status: DisputeStatus;
  resolution?: string;
  amountReleased?: number;
  amountRefunded?: number;
  createdAt: string;
  resolvedAt?: string;
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

export const CATEGORIES: TaskCategory[] = [
  "Cleaning & Housekeeping",
  "Moving & Heavy Lifting",
  "Delivery & Pickups",
  "Handyman & Repairs",
  "Yardwork & Outdoors",
  "Errands & Small Tasks",
  "Tech Help",
  "Pet Care",
  "Car Help",
  "Home Organizing",
  "Babysitting & Senior Help",
  "Beauty & Personal Services",
  "Other",
];
export const PLATFORM_FEE_PERCENT = 0.15;

export const NEIGHBORHOODS = [
  "Bronx - 170th & Grand Concourse",
  "Bronx - Fordham",
  "Bronx - Hunts Point",
  "Bronx - Mott Haven",
  "Harlem",
  "Washington Heights",
  "Inwood",
  "Lower East Side",
  "East Village",
  "Chelsea",
  "Midtown",
  "Upper West Side",
  "Upper East Side",
  "Brooklyn - Williamsburg",
  "Brooklyn - Bushwick",
  "Brooklyn - Bedford-Stuyvesant",
  "Brooklyn - Crown Heights",
  "Brooklyn - Park Slope",
  "Brooklyn - Downtown Brooklyn",
  "Queens - Astoria",
  "Queens - Long Island City",
  "Queens - Jackson Heights",
  "Queens - Flushing",
  "Queens - Jamaica",
  "Staten Island - St. George",
  "Staten Island - New Dorp",
];

function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export { generateConfirmationCode, generateOTP };
