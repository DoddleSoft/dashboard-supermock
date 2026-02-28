import { createClient } from "@/lib/supabase/client";
import { User, AuthError, Session } from "@supabase/supabase-js";

export interface AuthFormData {
  email: string;
  password: string;
  fullName?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role?: "student" | "examiner" | "admin";
  captchaToken?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  session?: Session | null;
  user?: User;
}

export interface UserProfile {
  user_id: string;
  email: string;
  role: "student" | "examiner" | "admin";
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class AuthService {
  private supabase = createClient();

  /**
   * Sync user profile with auth session
   */
  async upsertUserFromSession(
    session: Session | null,
    opts?: {
      fullName?: string;
      role?: "student" | "examiner" | "admin";
    },
  ) {
    try {
      const user = session?.user;
      if (!user) {
        return;
      }

      const metadata: any = user.user_metadata || {};
      const full_name =
        opts?.fullName ??
        metadata.full_name ??
        metadata.name ??
        user.email?.split("@")[0] ??
        "User";

      const nowIso = new Date().toISOString();

      // First, try to check if user profile exists
      const { data: existingProfile } = await this.supabase
        .from("users")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (existingProfile) {
        // Profile exists, just update it
        const { error } = await this.supabase
          .from("users")
          .update({
            full_name,
            updated_at: nowIso,
            is_active: true,
          })
          .eq("user_id", user.id);

        if (error) {
          console.error("Error updating user profile:", error);
        }
      } else {
        // Profile doesn't exist, create it (no center_id needed)
        const { error } = await this.supabase.from("users").insert({
          user_id: user.id,
          email: user.email!,
          role: opts?.role || "admin", // Use provided role or default to admin
          full_name,
          is_active: true,
        });

        if (error) {
          console.error("Error creating user profile:", error);
          // Try upsert as fallback
          const { error: upsertError } = await this.supabase
            .from("users")
            .upsert(
              {
                user_id: user.id,
                email: user.email!,
                role: opts?.role || "admin",
                full_name,
                is_active: true,
              },
              { onConflict: "user_id" },
            );

          if (upsertError) {
            console.error("Error upserting user profile:", upsertError);
          }
        }
      }
    } catch (e) {
      console.error("Exception during user profile management:", e);
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (typeof window !== "undefined" ? window.location.origin : "");

      const { data: authData, error: authError } =
        await this.supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${siteUrl}/auth/callback`,
            data: {
              full_name: data.fullName,
              role: data.role || "admin",
            },
            captchaToken: data.captchaToken,
          },
        });

      if (authError) {
        console.error("Signup error:", authError);
        let errorMessage = authError.message;

        switch (authError.message) {
          case "User already registered":
            errorMessage =
              "An account with this email already exists. Please try signing in instead.";
            break;
          case "Password should be at least 6 characters":
            errorMessage = "Password must be at least 6 characters long.";
            break;
          case "Invalid email":
            errorMessage = "Please enter a valid email address.";
            break;
          case "Signup is disabled":
            errorMessage =
              "Account registration is currently disabled. Please contact support.";
            break;
          case "Email rate limit exceeded":
            errorMessage =
              "Too many signup attempts. Please wait a few minutes before trying again.";
            break;
          case "Database error saving new user":
            errorMessage =
              "Unable to create your account. This may be a temporary issue. Please try again in a few moments or contact support if the problem persists.";
            break;
          case "Error sending confirmation email":
            errorMessage =
              "There was an unexpected error. Please contact support to verify your account, or try signing in.";
            break;
          default:
            if (
              authError.message.includes("Error sending confirmation email") ||
              authError.message.includes("SMTP") ||
              authError.message.includes("mail")
            ) {
              errorMessage =
                "There was an unexpected error. Please contact support to verify your account, or try signing in.";
            } else if (authError.message.includes("email")) {
              errorMessage =
                "Please check that your email address is valid and not already in use.";
            } else if (authError.message.includes("password")) {
              errorMessage = "Password does not meet the requirements.";
            } else if (
              authError.message.includes("500") ||
              authError.message.includes("Internal")
            ) {
              errorMessage =
                "Our server is experiencing issues. Please try again in a few moments.";
            } else {
              errorMessage =
                "Unable to create account. Please try again or contact support if the issue persists.";
            }
            break;
        }

        return { success: false, error: errorMessage };
      }

      if (authData.user && !authData.session) {
        const verificationMessage =
          "Please check your email for a verification link to complete your sign-up.";

        return {
          success: true,
          error: verificationMessage,
          user: authData.user,
        };
      }

      if (authData.user && authData.session) {
        return {
          success: true,
          session: authData.session,
          user: authData.user,
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: "Failed to create account. Please try again.",
        };
      }

      return {
        success: true,
        session: authData.session,
        user: authData.user,
      };
    } catch (error) {
      return {
        success: false,
        error:
          "An unexpected error occurred during registration. Please check your internet connection and try again.",
      };
    }
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const { data: authData, error } =
        await this.supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (error) {
        // Handle specific error cases with user-friendly messages
        let errorMessage = error.message;

        switch (error.message) {
          case "Invalid login credentials":
            errorMessage =
              "Invalid email or password. Please check your credentials and try again.";
            break;
          case "captcha verification process failed":
          case "Captcha verification process failed":
            errorMessage =
              "Login CAPTCHA is currently enforced in Supabase Auth settings. Disable Bot/ CAPTCHA protection for sign-in or re-enable CAPTCHA on the login form.";
            break;
          case "Email not confirmed":
            errorMessage =
              "Please verify your email address before signing in. Check your inbox for a verification link.";
            break;
          case "Too many requests":
            errorMessage =
              "Too many login attempts. Please wait a few minutes before trying again.";
            break;
          case "User not found":
            errorMessage =
              "No account found with this email address. Please check your email or create a new account.";
            break;
          default:
            if (error.message.toLowerCase().includes("captcha")) {
              errorMessage =
                "Login CAPTCHA is currently enforced in Supabase Auth settings. Disable Bot/ CAPTCHA protection for sign-in or re-enable CAPTCHA on the login form.";
            } else {
              errorMessage = error.message;
            }
            break;
        }

        return { success: false, error: errorMessage };
      }

      if (!authData.session) {
        return {
          success: false,
          error: "Failed to create session. Please try again.",
        };
      }

      return {
        success: true,
        session: authData.session,
        user: authData.user,
      };
    } catch (error) {
      return {
        success: false,
        error:
          "An unexpected error occurred. Please check your internet connection and try again.",
      };
    }
  }

  /**
   * Get user's center and determine redirect path after login
   */
  async getUserRedirectPath(): Promise<{
    success: boolean;
    path?: string;
    centerName?: string;
    error?: string;
  }> {
    try {
      const {
        data: { user: authUser },
      } = await this.supabase.auth.getUser();

      if (!authUser) {
        return {
          success: false,
          error: "Authentication failed. Please try again.",
        };
      }

      // Get user profile including role
      const { data: userProfile, error: profileError } = await this.supabase
        .from("users")
        .select("user_id, full_name, role")
        .eq("user_id", authUser.id)
        .single();

      if (profileError || !userProfile) {
        // No profile yet → onboarding (owner registers and verifies)
        return { success: true, path: "/auth/onboarding" };
      }

      const role = userProfile.role as string;

      // ── Owner flow ─────────────────────────────────────────────
      if (role === "owner") {
        const { data: centers } = await this.supabase
          .from("centers")
          .select("slug, name")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (centers && centers.length > 0) {
          return {
            success: true,
            path: `/dashboard/${centers[0].slug}`,
            centerName: centers[0].name,
          };
        }
        return { success: true, path: "/auth/onboarding" };
      }

      // ── Admin / Examiner flow ───────────────────────────────────
      if (role === "admin" || role === "examiner") {
        // Check center membership (admins/examiners are auto-registered to centers)
        const { data: membership } = await this.supabase
          .from("center_members")
          .select("center_id, centers(slug, name)")
          .eq("user_id", authUser.id)
          .limit(1)
          .single();

        if (membership && (membership.centers as any)) {
          const c = membership.centers as unknown as {
            slug: string;
            name: string;
          };
          return {
            success: true,
            path: `/dashboard/${c.slug}`,
            centerName: c.name,
          };
        }

        // No center affiliation found - this shouldn't happen for admins/examiners
        return {
          success: false,
          error: "No center access found. Please contact your administrator.",
        };
      }

      // Fallback
      return { success: true, path: "/auth/onboarding" };
    } catch (error) {
      console.error("Error determining redirect path:", error);
      return { success: false, error: "Failed to determine redirect path" };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(
    redirectPath: string = "/dashboard",
  ): Promise<AuthResponse> {
    try {
      const origin = window.location.origin;
      const callbackUrl = `${origin}/auth/callback`;

      // Always use redirect mode to avoid COOP issues
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          scopes: "openid profile email",
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to initiate Google sign-in. Please try again.",
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        error: "Password reset instructions sent to your email",
      };
    } catch (error) {
      const authError = error as AuthError;
      return { success: false, error: authError.message };
    }
  }

  /**
   * Update password (for password reset)
   */
  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        // Handle specific error cases with user-friendly messages
        let errorMessage = error.message;

        switch (error.message) {
          case "Password should be at least 6 characters":
            errorMessage = "Password must be at least 6 characters long.";
            break;
          case "New password should be different from the old password.":
            errorMessage =
              "Please choose a different password from your current one.";
            break;
          default:
            if (error.message.includes("password")) {
              errorMessage = "Password does not meet the requirements.";
            }
            break;
        }

        return { success: false, error: errorMessage };
      }

      if (!data.user) {
        return {
          success: false,
          error: "Failed to update password. Please try again.",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          "An unexpected error occurred while updating your password. Please try again.",
      };
    }
  }

  /**
   * Change password (requires current password verification)
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: sessionData } = await this.supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session?.user?.email) {
        return { success: false, error: "Not authenticated" };
      }

      if (newPassword !== confirmPassword) {
        return { success: false, error: "Passwords do not match" };
      }

      // Re-authenticate with current password
      const { error: signInError } =
        await this.supabase.auth.signInWithPassword({
          email: session.user.email,
          password: currentPassword,
        });

      if (signInError) {
        return { success: false, error: "Current password is incorrect" };
      }

      // Update to new password
      const { error: updateError } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Create user profile in public.users table
   */
  async createUserProfile(
    userId: string,
    email: string,
    fullName: string,
    role: "student" | "examiner" | "admin" = "admin",
  ): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .insert({
          user_id: userId,
          email: email,
          role: role,
          full_name: fullName,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create user profile",
      };
    }
  }

  /**
   * Get user profile from public.users table
   */
  async getUserProfile(
    userId: string,
  ): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        profile: data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch user profile",
      };
    }
  }

  /**
   * Get user's centers
   */
  async getUserCenters(userId: string): Promise<{
    success: boolean;
    centers?: Array<{ slug: string; name: string; center_id: string }>;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("centers")
        .select("center_id, name, slug")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        centers: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch user centers",
      };
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign out failed",
      };
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) {
        throw error;
      }

      return session;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error) {
        throw error;
      }

      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export helper functions for convenience
export const signInWithEmail = (email: string, password: string) =>
  authService.login({ email, password });

export const signUpWithEmail = (
  email: string,
  password: string,
  fullName: string,
) => authService.register({ email, password, fullName });

export const signInWithGoogle = (redirectPath?: string) =>
  authService.signInWithGoogle(redirectPath);

export const resetPassword = (email: string) =>
  authService.resetPassword(email);

export const getCurrentUser = () => authService.getCurrentUser();

export const getUser = () => authService.getCurrentUser();

export const updatePassword = (newPassword: string) =>
  authService.updatePassword(newPassword);

export const changePassword = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) => authService.changePassword(currentPassword, newPassword, confirmPassword);
