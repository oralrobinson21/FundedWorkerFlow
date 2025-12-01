import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Task, ChatThread, ChatMessage, UserMode, TaskStatus, SupportTicket, generateConfirmationCode } from "@/types";

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  userMode: UserMode;
  tasks: Task[];
  chatThreads: ChatThread[];
  chatMessages: Record<string, ChatMessage[]>;
  supportTickets: SupportTicket[];
  login: (name: string, phone?: string, defaultZipCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserMode: (mode: UserMode) => Promise<void>;
  createTask: (taskData: Omit<Task, "id" | "posterId" | "posterName" | "createdAt" | "confirmationCode">) => Promise<Task>;
  acceptTask: (taskId: string) => Promise<void>;
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
  CHAT_THREADS: "@citytasks_chat_threads",
  CHAT_MESSAGES: "@citytasks_chat_messages",
  SUPPORT_TICKETS: "@citytasks_support_tickets",
  USER_MODE: "@citytasks_user_mode",
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userMode, setUserModeState] = useState<UserMode>("poster");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, tasksData, threadsData, msgsData, ticketsData, modeData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.CHAT_THREADS),
        AsyncStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES),
        AsyncStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS),
        AsyncStorage.getItem(STORAGE_KEYS.USER_MODE),
      ]);

      if (userData) setUser(JSON.parse(userData));
      if (tasksData) setTasks(JSON.parse(tasksData));
      if (threadsData) setChatThreads(JSON.parse(threadsData));
      if (msgsData) setChatMessages(JSON.parse(msgsData));
      if (ticketsData) setSupportTickets(JSON.parse(ticketsData));
      if (modeData) setUserModeState(JSON.parse(modeData) as UserMode);
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
        if (isSupabaseAvailable) {
          await userQueries.createUser(userData);
        }
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const saveTasks = async (tasksData: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasksData));
    } catch (error) {
      console.error("Error saving tasks:", error);
    }
  };

  const saveConversations = async (convsData: Conversation[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convsData));
    } catch (error) {
      console.error("Error saving conversations:", error);
    }
  };

  const saveMessages = async (msgsData: Record<string, Message[]>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(msgsData));
    } catch (error) {
      console.error("Error saving messages:", error);
    }
  };

  const saveRatings = async (ratingsData: Rating[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratingsData));
    } catch (error) {
      console.error("Error saving ratings:", error);
    }
  };

  const saveHelperMode = async (helperMode: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HELPER_MODE, JSON.stringify(helperMode));
    } catch (error) {
      console.error("Error saving helper mode:", error);
    }
  };

  const toggleHelperMode = async () => {
    const newHelperMode = !isHelperMode;
    setIsHelperMode(newHelperMode);
    await saveHelperMode(newHelperMode);
  };

  const login = async (name: string, phone?: string, defaultZipCode?: string) => {
    const newUser: User = {
      id: generateId(),
      name,
      phone,
      defaultZipCode,
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
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_MODE, JSON.stringify(mode));
    } catch (error) {
      console.error("Error saving user mode:", error);
    }
  };

  const createTask = async (taskData: Omit<Task, "id" | "posterId" | "posterName" | "createdAt" | "confirmationCode">): Promise<Task> => {
    if (!user) throw new Error("User not logged in");
    
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      posterId: user.id,
      posterName: user.name,
      confirmationCode: generateConfirmationCode(),
      status: "open",
      createdAt: new Date().toISOString(),
    };
    
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    return newTask;
  };

  const payTask = async (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status: "paid_waiting" as TaskStatus } : task
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const acceptTask = async (taskId: string) => {
    if (!user) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, status: "assigned" as TaskStatus, workerId: user.id, workerName: user.name } : t
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);

    const existingConv = conversations.find(c => c.taskId === taskId);
    if (!existingConv) {
      const newConversation: Conversation = {
        id: generateId(),
        taskId,
        taskTitle: task.title,
        otherUserId: task.customerId,
        otherUserName: task.customerName,
        otherUserAvatarIndex: Math.floor(Math.random() * 6),
        lastMessage: "Job accepted! I'm on my way.",
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      };

      const workerConversation: Conversation = {
        ...newConversation,
        id: generateId(),
        otherUserId: user.id,
        otherUserName: user.name,
        otherUserAvatarIndex: user.avatarIndex,
      };

      const updatedConvs = [...conversations, newConversation, workerConversation];
      setConversations(updatedConvs);
      await saveConversations(updatedConvs);

      const initialMessage: Message = {
        id: generateId(),
        taskId,
        senderId: user.id,
        senderName: user.name,
        content: "Job accepted! I'm on my way.",
        timestamp: new Date().toISOString(),
        read: false,
      };

      const updatedMessages = { ...messages, [taskId]: [initialMessage] };
      setMessages(updatedMessages);
      await saveMessages(updatedMessages);
    }
  };

  const markJobDone = async (taskId: string, beforePhotoUrl?: string, afterPhotoUrl?: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId 
        ? { 
            ...task, 
            status: "worker_marked_done" as TaskStatus,
            beforePhotoUrl,
            afterPhotoUrl,
          } 
        : task
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const approveJob = async (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status: "completed" as TaskStatus, completedAt: new Date().toISOString() } : task
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const disputeJob = async (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status: "disputed" as TaskStatus } : task
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const sendMessage = async (taskId: string, content: string) => {
    if (!user) return;

    const newMessage: Message = {
      id: generateId(),
      taskId,
      senderId: user.id,
      senderName: user.name,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const taskMessages = messages[taskId] || [];
    const updatedMessages = { ...messages, [taskId]: [...taskMessages, newMessage] };
    setMessages(updatedMessages);
    await saveMessages(updatedMessages);

    const updatedConvs = conversations.map(conv =>
      conv.taskId === taskId
        ? { ...conv, lastMessage: content, lastMessageTime: newMessage.timestamp }
        : conv
    );
    setConversations(updatedConvs);
    await saveConversations(updatedConvs);
  };

  const markConversationRead = async (conversationId: string) => {
    const updatedConvs = conversations.map(conv =>
      conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
    );
    setConversations(updatedConvs);
    await saveConversations(updatedConvs);
  };

  const createRating = async (taskId: string, ratedUserId: string, score: number, review?: string) => {
    if (!user) return;

    const newRating: Rating = {
      id: generateId(),
      taskId,
      ratedUserId,
      ratingUserId: user.id,
      ratingUserName: user.name,
      score,
      review,
      createdAt: new Date().toISOString(),
    };

    const updatedRatings = [...ratings, newRating];
    setRatings(updatedRatings);
    await saveRatings(updatedRatings);

    if (isSupabaseAvailable) {
      await ratingQueries.createRating(newRating);
    }
  };

  const syncWithSupabase = async () => {
    if (!isSupabaseAvailable) return;
    try {
      const { data: tasksData } = await taskQueries.getTasks();
      if (tasksData && tasksData.length > 0) {
        setTasks(tasksData);
      }
    } catch (error) {
      console.error("Error syncing with Supabase:", error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        isHelperMode,
        tasks,
        conversations,
        messages,
        ratings,
        login,
        logout,
        switchRole,
        toggleHelperMode,
        createTask,
        payTask,
        acceptTask,
        markJobDone,
        approveJob,
        disputeJob,
        sendMessage,
        markConversationRead,
        createRating,
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
