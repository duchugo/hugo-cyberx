export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://khltriuoshamxuknmwzy.supabase.co";

export const ADMIN_EMAIL = "duc.lanrung@gmail.com";

// This key is publishable by design. Every write request is still authorized
// by verifying its Supabase access token on the server.
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_TvKnrUGjxBMVRvZzFSylvQ_3cSj-w5R";
