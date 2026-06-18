import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

class MockAuth {
  async signInWithPassword({ email }: { email: string }) {
    if (!email || !email.includes("@")) {
      return {
        data: { user: null, session: null },
        error: { message: "Invalid email" },
      };
    }
    const session = {
      access_token: "mock-access-token",
      user: { email, id: `mock-uid-${email}` },
    };
    localStorage.setItem(
      "spell_user",
      JSON.stringify({ email, loggedInAt: Date.now() })
    );
    return { data: { user: session.user, session }, error: null };
  }

  async signUp({ email }: { email: string }) {
    if (!email || !email.includes("@")) {
      return {
        data: { user: null, session: null },
        error: { message: "Invalid email" },
      };
    }
    const session = {
      access_token: "mock-access-token",
      user: { email, id: `mock-uid-${email}` },
    };
    localStorage.setItem(
      "spell_user",
      JSON.stringify({ email, loggedInAt: Date.now() })
    );
    return { data: { user: session.user, session }, error: null };
  }

  async signOut() {
    localStorage.removeItem("spell_user");
    return { error: null };
  }

  async getSession() {
    if (typeof window === "undefined") {
      return { data: { session: null }, error: null };
    }
    const userStr = localStorage.getItem("spell_user");
    if (!userStr) return { data: { session: null }, error: null };
    try {
      const parsed = JSON.parse(userStr);
      const session = {
        access_token: "mock-access-token",
        user: { email: parsed.email, id: `mock-uid-${parsed.email}` },
      };
      return { data: { session }, error: null };
    } catch {
      return { data: { session: null }, error: null };
    }
  }

  onAuthStateChange(
    callback: (event: string, session: any) => void
  ) {
    this.getSession().then(({ data: { session } }) => {
      callback(session ? "SIGNED_IN" : "SIGNED_OUT", session);
    });
    return {
      data: {
        subscription: {
          unsubscribe() {},
        },
      },
    };
  }
}

const mockSupabase = {
  auth: new MockAuth(),
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (mockSupabase as any);

export const isMockAuth = !isSupabaseConfigured;
