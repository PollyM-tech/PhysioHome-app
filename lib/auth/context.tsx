import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  Account,
  currentAccount,
  logout,
  restoreSession,
  subscribeAuth,
} from "./client";

type AuthState = {
  user: Account | null;
  refreshUser: typeof currentAccount;
  signOut: typeof logout;
};
const Context = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const restore = useCallback(async () => {
    setError("");
    setReady(false);
    try {
      setUser(await restoreSession());
      setReady(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not restore your session.",
      );
    }
  }, []);
  useEffect(() => {
    const unsubscribe = subscribeAuth(setUser);
    void restore();
    return unsubscribe;
  }, [restore]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && user)
        void currentAccount().catch(() => {
          /* Keep the retryable state on connection failure. */
        });
    });
    return () => subscription.remove();
  }, [user]);
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          gap: 20,
          backgroundColor: "#fff",
        }}
      >
        {error ? (
          <>
            <Text
              accessibilityRole="alert"
              style={{ color: "#0B2545", textAlign: "center" }}
            >
              {error}
            </Text>
            <Pressable onPress={() => void restore()} style={{ padding: 16 }}>
              <Text style={{ color: "#087F83" }}>Try again</Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator
            accessibilityLabel="Restoring your session"
            color="#138A8A"
          />
        )}
      </View>
    );
  return (
    <Context.Provider
      value={{ user, refreshUser: currentAccount, signOut: logout }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const context = useContext(Context);
  if (!context) throw new Error("useAuth requires AuthProvider");
  return context;
}
