import { Platform } from "react-native";
import Constants from "expo-constants";

function getApiBaseUrl(): string {
  const envUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  if (Platform.OS === "web" && typeof window !== "undefined") {
    if (window.location.hostname.includes("replit")) {
      const hostname = window.location.hostname;
      const backendHost = hostname.replace(/-\d+-/, "-00-");
      return `https://${backendHost}`;
    }
    return "http://localhost:5000";
  }
  
  return "http://localhost:5000";
}

export const API_BASE_URL = getApiBaseUrl();

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
}
