import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function initializeSupabase() {
  // Test connection
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase initialization failed:', error);
    return false;
  }
}

// User queries
export const userQueries = {
  async getUser(id: string) {
    return supabase.from('users').select('*').eq('id', id).single();
  },
  async getUserByEmail(email: string) {
    return supabase.from('users').select('*').eq('email', email).single();
  },
  async createUser(user: any) {
    return supabase.from('users').insert([user]).select().single();
  },
  async updateUser(id: string, updates: any) {
    return supabase.from('users').update(updates).eq('id', id).select().single();
  },
};

// Task queries
export const taskQueries = {
  async getTasks() {
    return supabase.from('tasks').select('*').order('createdAt', { ascending: false });
  },
  async getTaskById(id: string) {
    return supabase.from('tasks').select('*').eq('id', id).single();
  },
  async getCustomerTasks(customerId: string) {
    return supabase.from('tasks').select('*').eq('customerId', customerId).order('createdAt', { ascending: false });
  },
  async getAvailableTasks() {
    return supabase.from('tasks').select('*').eq('status', 'paid_waiting').order('createdAt', { ascending: false });
  },
  async createTask(task: any) {
    return supabase.from('tasks').insert([task]).select().single();
  },
  async updateTask(id: string, updates: any) {
    return supabase.from('tasks').update(updates).eq('id', id).select().single();
  },
};

// Message queries
export const messageQueries = {
  async getTaskMessages(taskId: string) {
    return supabase.from('messages').select('*').eq('taskId', taskId).order('timestamp', { ascending: true });
  },
  async sendMessage(message: any) {
    return supabase.from('messages').insert([message]).select().single();
  },
};

// Conversation queries
export const conversationQueries = {
  async getUserConversations(userId: string) {
    return supabase.from('conversations').select('*').or(`customerId.eq.${userId},workerId.eq.${userId}`).order('lastMessageTime', { ascending: false });
  },
  async getConversation(taskId: string, userId: string) {
    return supabase.from('conversations').select('*').eq('taskId', taskId).or(`customerId.eq.${userId},workerId.eq.${userId}`).single();
  },
  async createConversation(conversation: any) {
    return supabase.from('conversations').insert([conversation]).select().single();
  },
  async updateConversation(id: string, updates: any) {
    return supabase.from('conversations').update(updates).eq('id', id).select().single();
  },
};

// Rating queries
export const ratingQueries = {
  async createRating(rating: any) {
    return supabase.from('ratings').insert([rating]).select().single();
  },
  async getUserRatings(userId: string) {
    return supabase.from('ratings').select('*').eq('ratedUserId', userId);
  },
  async getTaskRating(taskId: string) {
    return supabase.from('ratings').select('*').eq('taskId', taskId).single();
  },
};

// Photo upload
export const photoQueries = {
  async uploadPhoto(bucket: string, filePath: string, file: any) {
    return supabase.storage.from(bucket).upload(filePath, file);
  },
  async getPhotoUrl(bucket: string, filePath: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data?.publicUrl;
  },
};
