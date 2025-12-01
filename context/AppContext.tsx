import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Task, Conversation, Message, UserRole, TaskStatus } from "@/types";

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  tasks: Task[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  login: (name: string, email: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: () => Promise<void>;
  createTask: (task: Omit<Task, "id" | "customerId" | "customerName" | "status" | "createdAt">) => Promise<Task>;
  payTask: (taskId: string) => Promise<void>;
  acceptTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  sendMessage: (taskId: string, content: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: "@citytasks_user",
  TASKS: "@citytasks_tasks",
  CONVERSATIONS: "@citytasks_conversations",
  MESSAGES: "@citytasks_messages",
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, tasksData, convsData, msgsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.MESSAGES),
      ]);

      if (userData) setUser(JSON.parse(userData));
      if (tasksData) setTasks(JSON.parse(tasksData));
      if (convsData) setConversations(JSON.parse(convsData));
      if (msgsData) setMessages(JSON.parse(msgsData));
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

  const login = async (name: string, email: string, role: UserRole) => {
    const newUser: User = {
      id: generateId(),
      name,
      email,
      role,
      avatarIndex: Math.floor(Math.random() * 6),
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    await saveUser(newUser);
  };

  const logout = async () => {
    setUser(null);
    await saveUser(null);
  };

  const switchRole = async () => {
    if (!user) return;
    const newRole: UserRole = user.role === "customer" ? "worker" : "customer";
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    await saveUser(updatedUser);
  };

  const createTask = async (taskData: Omit<Task, "id" | "customerId" | "customerName" | "status" | "createdAt">): Promise<Task> => {
    if (!user) throw new Error("User not logged in");
    
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      customerId: user.id,
      customerName: user.name,
      status: "unpaid",
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

  const completeTask = async (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status: "completed" as TaskStatus, completedAt: new Date().toISOString() } : task
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

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        tasks,
        conversations,
        messages,
        login,
        logout,
        switchRole,
        createTask,
        payTask,
        acceptTask,
        completeTask,
        sendMessage,
        markConversationRead,
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
