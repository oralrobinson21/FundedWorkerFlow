import { Task } from "@/types";

export type RootStackParamList = {
  Main: undefined;
  Onboarding: undefined;
  CreateTask: undefined;
  TaskDetail: { task: Task };
  Chat: { threadId: string; taskId: string; otherUserName: string };
  Payment: { task: Task };
  CompletionPhoto: { task: Task };
  Approval: { task: Task };
  Rating: { task: Task };
};

export type MainTabParamList = {
  HomeTab: undefined;
  MessagesTab: undefined;
  ActivityTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  TaskDetail: { task: Task };
};

export type MessagesStackParamList = {
  Messages: undefined;
  Chat: { threadId: string; taskId: string; otherUserName: string };
};

export type ActivityStackParamList = {
  Activity: undefined;
  TaskDetail: { task: Task };
};

export type ProfileStackParamList = {
  Profile: undefined;
};
