// app/countdown/page.js (新建立的倒數日頁面 - 使用公共只讀 Client)
import { createClient } from '@supabase/supabase-js';
import CountdownDisplay from '@/app/components/CountdownDisplay'; // 假設組件路徑正確
import Link from 'next/link';

// 創建一個簡單的公開只讀 Supabase Client，不使用 SSR helper
// 這能有效繞過 Next.js 的動態 API 檢查問題
const getPublicSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};


// 伺服器端數據獲取 (在 Server Component 中執行)
async function fetchCountdownSetting() {
    try {
        const supabase = getPublicSupabase(); 
        
        // 查詢：從 countdown_settings 表中，選擇 'event_name' 和 'target_date'
        const { data, error } = await supabase
            .from('countdown_settings')
            .select('event_name, target_date')
            .maybeSingle(); 

        if (error) throw error;

        // 如果沒有設定，返回 null
        if (!data || !data.target_date || !data.event_name) {
            return null;
        }

        return {
            eventName: data.event_name,
            targetDate: data.target_date,
        };

    } catch (e) {
        console.error("Error fetching countdown setting (Public):", e.message);
        return null; 
    }
}


export default async function CountdownPage() {
    // 在 Server Component 中 await 數據
    const countdownSetting = await fetchCountdownSetting();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            
            <header className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-indigo-700 mb-2">
                    🗓️ 倒數日資訊
                </h1>
                <p className="text-lg text-gray-500">
                    目前平台設定的公開倒數資訊
                </p>
            </header>

            {/* 倒數日顯示區 (將數據傳遞給 Client Component) */}
            <CountdownDisplay initialSetting={countdownSetting} />

            <div className="mt-8 text-center">
                <Link href="/" className="text-indigo-600 hover:text-indigo-800 transition duration-150 text-sm font-medium">
                    ← 返回目錄首頁
                </Link>
            </div>
        </div>
    );
}