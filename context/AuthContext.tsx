"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { authService, UserProfile } from "../helpers/auth";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: "student" | "examiner" | "admin"
  ) => Promise<{ success: boolean; error?: string }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateUserWithCenter: (
    centerId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial session
  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        const session = await authService.getSession();
        setSession(session);

        if (session?.user) {
          setUser(session.user);
          // Don't block on user profile loading
          loadUserProfile(session.user.id).catch(console.error);
        }
      } catch (error) {
        console.error("Error loading session:", error);
      } finally {
        // Always set loading to false after 1 second max
        setTimeout(() => setLoading(false), 100);
      }
    };

    loadSession();
  }, []);

  // Subscribe to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, !!session);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Don't block on user profile loading
        loadUserProfile(session.user.id).catch(console.error);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user profile from public.users table
  const loadUserProfile = async (userId: string) => {
    try {
      const { success, profile, error } = await authService.getUserProfile(
        userId
      );

      if (success && profile) {
        setUserProfile(profile);
      } else {
        console.log("No user profile found, will be created during onboarding");
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setUserProfile(null);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, fullName: string, role?: "student" | "examiner" | "admin") => {
    try {
      setLoading(true);

      // Register user with Supabase auth
      const authResult = await authService.register({
        email,
        password,
        fullName,
        role: role || "admin",
      });

      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error || "Registration failed",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const result = await authService.login({ email, password });

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Login failed",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);

      // Redirect to login after logout
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh user profile
  const refreshUserProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id);
    }
  };

  // Update user with center ID after onboarding
  const updateUserWithCenter = async (centerId: string) => {
    if (!user?.id) {
      return {
        success: false,
        error: "No user found",
      };
    }

    try {
      // First, check if user profile exists
      const { success: profileExists, profile } =
        await authService.getUserProfile(user.id);

      if (!profileExists || !profile) {
        // Create user profile if it doesn't exist
        console.log("Creating user profile for center association");
        const createResult = await authService.createUserProfile(
          user.id,
          user.email!,
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          centerId
        );

        if (createResult.success) {
          await refreshUserProfile();
          return { success: true };
        } else {
          return {
            success: false,
            error: createResult.error || "Failed to create user profile",
          };
        }
      } else {
        // Update existing profile
        const result = await authService.updateUserProfile(user.id, centerId);

        if (result.success) {
          await refreshUserProfile();
        }

        return result;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Update failed",
      };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUserProfile,
    updateUserWithCenter,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
