import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Task, JobOffer, ChatThread, ChatMessage, UserMode, TaskStatus, SupportTicket, generateConfirmationCode, generateOTP } from "@/types";

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  userMode: UserMode;
  tasks: Task[];
  jobOffers: JobOffer[];
  chatThreads: ChatThread[];
  chatMessages: Record<string, ChatMessage[]>;
  supportTickets: SupportTicket[];
  // Auth methods
  sendOTPCode: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOTPCode: (email: string, code: string) => Promise<{ success: boolean; user?: User; message: string }>;
  updateUserProfile: (phone?: string, defaultZipCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserMode: (mode: UserMode) => Promise<void>;
  // Task methods
  createTask: (taskData: Omit<Task, "id" | "posterId" | "posterName" | "createdAt" | "confirmationCode" | "status">) => Promise<Task>;
  sendOffer: (taskId: string, note: string, proposedPrice?: number) => Promise<void>;
  chooseHelper: (taskId: string, offerId: string) => Promise<{ checkoutUrl?: string }>;
  initializeStripeConnect: () => Promise<{ url?: string }>;
  completeTask: (taskId: string) => Promise<void>;
  cancelTask: (taskId: string, canceledBy: "poster" | "helper") => Promise<void>;
  disputeTask: (taskId: string) => Promise<void>;
  sendChatMessage: (threadId: string, text?: string, imageUrl?: string, isProof?: boolean) => Promise<void>;
  createChatThread: (taskId: string, posterId: string, helperId: string) => Promise<ChatThread>;
  createSupportTicket: (subject: string, message: string, taskId?: string) => Promise<void>;
  syncWithSupabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: "@citytasks_user",
  TASKS: "@citytasks_tasks",
  JOB_OFFERS: "@citytasks_job_offers",
  CHAT_THREADS: "@citytasks_chat_threads",
  CHAT_MESSAGES: "@citytasks_chat_messages",
  SUPPORT_TICKETS: "@citytasks_support_tickets",
  USER_MODE: "@citytasks_user_mode",
  OTP_CODES: "@citytasks_otp_codes",
};

interface StoredOTP {
  email: string;
  code: string;
  expiresAt: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userMode, setUserModeState] = useState<UserMode>("poster");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [storedOTPs, setStoredOTPs] = useState<StoredOTP[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, tasksData, offersData, threadsData, msgsData, ticketsData, modeData, otpData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.JOB_OFFERS),
        AsyncStorage.getItem(STORAGE_KEYS.CHAT_THREADS),
        AsyncStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES),
        AsyncStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS),
        AsyncStorage.getItem(STORAGE_KEYS.USER_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.OTP_CODES),
      ]);

      if (userData) setUser(JSON.parse(userData));
      if (tasksData) setTasks(JSON.parse(tasksData));
      if (offersData) setJobOffers(JSON.parse(offersData));
      if (threadsData) setChatThreads(JSON.parse(threadsData));
      if (msgsData) setChatMessages(JSON.parse(msgsData));
      if (ticketsData) setSupportTickets(JSON.parse(ticketsData));
      if (modeData) setUserModeState(JSON.parse(modeData) as UserMode);
      if (otpData) setStoredOTPs(JSON.parse(otpData));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (userData: User | null) => {
    try {
      if (userData) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const saveOTPs = async (otps: StoredOTP[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OTP_CODES, JSON.stringify(otps));
    } catch (error) {
      console.error("Error saving OTPs:", error);
    }
  };

  const saveTasks = async (tasksData: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasksData));
    } catch (error) {
      console.error("Error saving tasks:", error);
    }
  };

  const saveJobOffers = async (offersData: JobOffer[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.JOB_OFFERS, JSON.stringify(offersData));
    } catch (error) {
      console.error("Error saving job offers:", error);
    }
  };

  const saveChatThreads = async (threadsData: ChatThread[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_THREADS, JSON.stringify(threadsData));
    } catch (error) {
      console.error("Error saving chat threads:", error);
    }
  };

  const saveChatMessages = async (msgsData: Record<string, ChatMessage[]>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(msgsData));
    } catch (error) {
      console.error("Error saving chat messages:", error);
    }
  };

  const saveSupportTickets = async (ticketsData: SupportTicket[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(ticketsData));
    } catch (error) {
      console.error("Error saving support tickets:", error);
    }
  };

  const saveUserMode = async (mode: UserMode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_MODE, JSON.stringify(mode));
    } catch (error) {
      console.error("Error saving user mode:", error);
    }
  };

  const sendOTPCode = async (email: string): Promise<{ success: boolean; message: string }> => {
    const code = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const newOTP: StoredOTP = { email, code, expiresAt };
    const updatedOTPs = storedOTPs.filter(otp => otp.email !== email || otp.expiresAt > Date.now());
    updatedOTPs.push(newOTP);
    setStoredOTPs(updatedOTPs);
    await saveOTPs(updatedOTPs);
    console.log(`[DEV] OTP Code for ${email}: ${code}`);
    return { success: true, message: `Code sent to ${email}` };
  };

  const verifyOTPCode = async (email: string, code: string): Promise<{ success: boolean; user?: User; message: string }> => {
    const otp = storedOTPs.find(o => o.email === email && o.code === code && o.expiresAt > Date.now());
    if (!otp) {
      return { success: false, message: "Invalid or expired code" };
    }
    const updatedOTPs = storedOTPs.filter(o => o.email !== email);
    setStoredOTPs(updatedOTPs);
    await saveOTPs(updatedOTPs);
    const newUser: User = {
      id: generateId(),
      email,
      accountNumber: generateId(),
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    await saveUser(newUser);

    // Sync user to backend
    try {
      const API_URL = "http://localhost:3001";
      await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
    } catch (err) {
      console.error("Failed to sync user to backend:", err);
    }

    return { success: true, user: newUser, message: "Logged in" };
  };

  const updateUserProfile = async (phone?: string, defaultZipCode?: string) => {
    if (!user) throw new Error("User not logged in");
    const updatedUser = { ...user, phone, defaultZipCode };
    setUser(updatedUser);
    await saveUser(updatedUser);
  };

  const login = async (name: string, phone?: string, defaultZipCode?: string) => {
    const newUser: User = {
      id: generateId(),
      name,
      phone,
      defaultZipCode,
      accountNumber: generateId(),
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    await saveUser(newUser);
  };

  const logout = async () => {
    setUser(null);
    await saveUser(null);
  };

  const setUserMode = async (mode: UserMode) => {
    setUserModeState(mode);
    await saveUserMode(mode);
  };

  const createTask = async (taskData: Omit<Task, "id" | "posterId" | "posterName" | "createdAt" | "confirmationCode" | "status">): Promise<Task> => {
    if (!user) throw new Error("User not logged in");
    
    try {
      const API_URL = "http://localhost:3001";
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create task");
      }

      const task = await response.json();
      const updatedTasks = [task, ...tasks];
      setTasks(updatedTasks);
      await saveTasks(updatedTasks);
      return task;
    } catch (err) {
      console.error("createTask error:", err);
      throw err;
    }
  };

  const sendOffer = async (taskId: string, note: string, proposedPrice?: number) => {
    if (!user) throw new Error("User not logged in");
    
    try {
      const API_URL = "http://localhost:3001";
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ note, proposedPrice }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send offer");
      }

      const offer = await response.json();
      const updatedOffers = [...jobOffers, offer];
      setJobOffers(updatedOffers);
      await saveJobOffers(updatedOffers);
    } catch (err) {
      console.error("sendOffer error:", err);
      throw err;
    }
  };

  const chooseHelper = async (taskId: string, offerId: string): Promise<{ checkoutUrl?: string }> => {
    if (!user) throw new Error("User not logged in");

    const offer = jobOffers.find(o => o.id === offerId);
    if (!offer) throw new Error("Offer not found");

    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error("Task not found");

    try {
      const API_URL = "http://localhost:3001";
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/choose-helper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ helperId: offer.helperId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to choose helper");
      }

      const result = await response.json();
      return { checkoutUrl: result.checkoutUrl };
    } catch (err) {
      console.error("chooseHelper error:", err);
      throw err;
    }
  };

  const initializeStripeConnect = async (): Promise<{ url?: string }> => {
    if (!user) throw new Error("User not logged in");
    try {
      const API_URL = "http://localhost:3001";
      const response = await fetch(`${API_URL}/api/stripe/connect/onboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to initialize Stripe");
      }

      return await response.json();
    } catch (err) {
      console.error("initializeStripeConnect error:", err);
      throw err;
    }
  };

  const completeTask = async (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status: "completed" as TaskStatus, completedAt: new Date().toISOString() } : task
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const cancelTask = async (taskId: string, canceledBy: "poster" | "helper") => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status: "canceled" as TaskStatus, canceledAt: new Date().toISOString(), canceledBy } : task
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const disputeTask = async (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status: "disputed" as TaskStatus } : task
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const sendChatMessage = async (threadId: string, text?: string, imageUrl?: string, isProof: boolean = false) => {
    if (!user) throw new Error("User not logged in");

    const newMessage: ChatMessage = {
      id: generateId(),
      threadId,
      senderId: user.id,
      senderName: user.name,
      text,
      imageUrl,
      isProof,
      createdAt: new Date().toISOString(),
    };

    const threadMessages = chatMessages[threadId] || [];
    const updatedMessages = { ...chatMessages, [threadId]: [...threadMessages, newMessage] };
    setChatMessages(updatedMessages);
    await saveChatMessages(updatedMessages);
  };

  const createChatThread = async (taskId: string, posterId: string, helperId: string): Promise<ChatThread> => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);

    const newThread: ChatThread = {
      id: generateId(),
      taskId,
      posterId,
      helperId,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      isClosed: false,
    };

    const updatedThreads = [...chatThreads, newThread];
    setChatThreads(updatedThreads);
    await saveChatThreads(updatedThreads);
    return newThread;
  };

  const createSupportTicket = async (subject: string, message: string, taskId?: string) => {
    if (!user) throw new Error("User not logged in");

    const newTicket: SupportTicket = {
      id: generateId(),
      userId: user.id,
      taskId,
      subject,
      message,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTickets = [...supportTickets, newTicket];
    setSupportTickets(updatedTickets);
    await saveSupportTickets(updatedTickets);
  };

  const syncWithSupabase = async () => {
    // TODO: Implement Supabase sync for new data model
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        userMode,
        tasks,
        jobOffers,
        chatThreads,
        chatMessages,
        supportTickets,
        sendOTPCode,
        verifyOTPCode,
        updateUserProfile,
        logout,
        setUserMode,
        createTask,
        sendOffer,
        chooseHelper,
        initializeStripeConnect,
        completeTask,
        cancelTask,
        disputeTask,
        sendChatMessage,
        createChatThread,
        createSupportTicket,
        syncWithSupabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
