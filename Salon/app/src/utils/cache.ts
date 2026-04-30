import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { tokenCache as clerkTokenCache } from "@clerk/clerk-expo/token-cache";

type TokenCache = NonNullable<typeof clerkTokenCache>;

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        const item = await SecureStore.getItemAsync(key);
        return item;
      } catch {
        await SecureStore.deleteItemAsync(key);
        return null;
      }
    },
    saveToken: async (key: string, token: string) => {
      await SecureStore.setItemAsync(key, token);
    },
  };
};

// SecureStore não é suportado no web
export const tokenCache: typeof clerkTokenCache =
  Platform.OS !== "web" ? createTokenCache() : undefined;