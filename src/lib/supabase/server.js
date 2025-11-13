// src/lib/supabase/server.js (最終修復版本：標準且防禦性的 Next.js Server Client 實作)

import { createServerClient as createServerClientCore } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createServerClient = () => {
  // 1. 獲取 cookies 實例，確保在每次呼叫時動態讀取
  const cookieStore = cookies(); 

  // 讀取環境變數 (必須在 .env.local 中設置)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // 這裡通常是開發環境的警告
    console.error("Supabase environment variables (URL or Anon Key) are missing.");
  }

  return createServerClientCore(
    supabaseUrl,
    supabaseKey, 
    {
      cookies: {
        // GET: 必須返回 RequestCookie 物件的 value (string) 或 undefined
        get: (name) => {
          // 直接調用 cookieStore.get(name)
          return cookieStore.get(name)?.value; 
        },
        
        // SET: 使用 Next.js 的 set 方法寫入
        set: (name, value, options) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (e) {
            // 在 Server Component 中，寫入 cookie 會失敗，這是預期的
            // 由於 fetchCountdownSetting 是讀取操作，這裡只做警告
            console.warn(`[Supabase Auth] Failed to set cookie ${name} in Server Component:`, e.message);
          }
        },

        // REMOVE: 使用 Next.js 的 delete 方法
        remove: (name, options) => {
          try {
            // Next.js cookies() 實例使用 delete(name)
            cookieStore.delete(name); 
          } catch (e) {
            console.warn(`[Supabase Auth] Failed to remove cookie ${name} in Server Component:`, e.message);
          }
        },
      },
    }
  );
};