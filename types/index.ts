export type UserRole = "customer" | "worker";

export type TaskStatus = "unpaid" | "paid_waiting" | "assigned" | "worker_marked_done" | "completed" | "disputed";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarIndex: number;
  createdAt: string;
  avgRating?: number;
  totalRatings?: number;
  stripeConnectId?: string;
}

export interface Task {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  description: string;
  neighborhood: string;
  areaDescription: string | null;
  fullAddress: string | null;
  price: number;
  timeWindow: string;
  status: TaskStatus;
  workerId?: string;
  workerName?: string;
  createdAt: string;
  completedAt?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
}

export interface Message {
  id: string;
  taskId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  taskId: string;
  taskTitle: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarIndex: number;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Rating {
  id: string;
  taskId: string;
  ratedUserId: string;
  ratingUserId: string;
  ratingUserName: string;
  score: number;
  review?: string;
  createdAt: string;
}

export const NEIGHBORHOODS = [
  "Manhattan - Upper East Side",
  "Manhattan - Upper West Side",
  "Manhattan - Midtown",
  "Manhattan - Downtown",
  "Brooklyn - Williamsburg",
  "Brooklyn - Park Slope",
  "Brooklyn - DUMBO",
  "Brooklyn - Bushwick",
  "Queens - Astoria",
  "Queens - Long Island City",
  "Bronx - Riverdale",
  "Staten Island",
];

export const PLATFORM_FEE_PERCENT = 0.08;
