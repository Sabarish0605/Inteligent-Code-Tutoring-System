import { supabase, isMockAuth } from "@/lib/supabaseClient";
import type { VFSNode } from "@/lib/store/vfsStore";

const TABLE = "vfs_snapshots";

/**
 * Load the user's VFS from Supabase.
 * Returns null when using mock auth or when no snapshot exists yet.
 */
export async function loadVFS(userId: string): Promise<VFSNode[] | null> {
  if (isMockAuth) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("vfs_json")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[supabaseVFS] loadVFS error:", error.message);
    return null;
  }

  if (!data?.vfs_json) return null;

  return data.vfs_json as VFSNode[];
}

/**
 * Persist the user's VFS to Supabase (upsert by user_id).
 * No-op when using mock auth.
 */
export async function saveVFS(
  userId: string,
  nodes: VFSNode[]
): Promise<void> {
  if (isMockAuth) return;

  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      vfs_json: nodes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[supabaseVFS] saveVFS error:", error.message);
  }
}
