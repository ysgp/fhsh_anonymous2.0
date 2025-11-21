// app/countdown/page.js (多倒數日版 - 垂直與水平置中)
import { createClient } from '@supabase/supabase-js';
import CountdownDisplay from '@/app/components/CountdownDisplay'; 
import Link from 'next/link';

// 創建一個簡單的公開只讀 Supabase Client
const getPublicSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};


// 伺服器端數據獲取：獲取所有啟用的事件
async function fetchCountdownEvents() {
    try {
        const supabase = getPublicSupabase(); 
        
        // 查詢所有啟用的倒數日，並按日期排序
        const { data, error } = await supabase
            .from('countdown_settings')
            .select('id, event_name, target_date')
            .eq('is_active', true) // 假設你有 is_active 欄位
            .order('target_date', { ascending: true }); 

        if (error) throw error;
        return data || [];

    } catch (e) {
        console.error("Error fetching countdown events:", e.message);
        return []; 
    }
}


export default async function CountdownPage() {
    // 在 Server Component 中 await 數據
    const events = await fetchCountdownEvents();

    return (
        // 🚨 核心修改點：items-center (水平置中) 和 justify-center (垂直置中)
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            
            <header className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-indigo-700 mb-2">
                    🗓️ 倒數日看板
                </h1>
                <p className="text-lg text-gray-500">
                    重要事件倒數
                </p>
            </header>

            {/* 倒數日列表顯示區 (使用 Grid 佈局讓多個卡片整齊排列) */}
            <div className="w-full max-w-4xl grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {events.length > 0 ? (
                    events.map((event) => (
                        // 確保每個 CountdownDisplay 容器都水平置中
                        <div key={event.id} className="flex justify-center">
                            <CountdownDisplay 
                                initialSetting={{
                                    eventName: event.event_name,
                                    targetDate: event.target_date
                                }} 
                            />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center text-gray-500 py-10">
                        目前沒有正在倒數的活動。
                    </div>
                )}
            </div>

            <div className="mt-12 text-center">
                <Link href="/" className="text-indigo-600 hover:text-indigo-800 transition duration-150 text-sm font-medium">
                    ← 返回目錄首頁
                </Link>
            </div>
        </div>
    );
}