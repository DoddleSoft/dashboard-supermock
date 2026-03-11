import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

let clientSingleton: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (clientSingleton) return clientSingleton;
  clientSingleton = createBrowserClient(supabaseUrl!, supabaseKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return clientSingleton;
};
