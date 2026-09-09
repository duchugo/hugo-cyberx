import { getRawDb } from "@/db";
export const ADMIN_EMAIL="duc.lanrung@gmail.com";
export function isAdminEmail(email:string|null){return email?.trim().toLowerCase()===ADMIN_EMAIL}
export async function ensureOwner(userId:string){const db=getRawDb();const owner=await db.prepare("SELECT user_id FROM site_owner WHERE id = 1").first<{user_id:string}>();if(owner)return owner.user_id===userId;await db.prepare("INSERT OR IGNORE INTO site_owner (id,user_id,created_at) VALUES (1,?,?)").bind(userId,Date.now()).run();const claimed=await db.prepare("SELECT user_id FROM site_owner WHERE id = 1").first<{user_id:string}>();return claimed?.user_id===userId}
export async function isOwner(userId:string|null){if(!userId)return false;const owner=await getRawDb().prepare("SELECT user_id FROM site_owner WHERE id = 1").first<{user_id:string}>();return owner?.user_id===userId}
