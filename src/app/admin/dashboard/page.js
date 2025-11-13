// app/admin/dashboard/page.js (手機適用完整版)
'use client'; 

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
// 確保您的 supabase client 匯入路徑正確
import { supabase } from '@/lib/supabase/client'; 

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState({
    pending: 'N/A',
    approved: 'N/A',
    delete_requests: 'N/A',
    total_posts: 'N/A',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 獲取所有數據統計
  const fetchCounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 🚨 檢查用戶是否已登入 (避免因未登入而觸發 RLS 錯誤)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session) {
        console.error("Authentication Error: User is not logged in. Cannot fetch counts.");
        setError('數據載入失敗：您尚未登入管理員帳號或 Session 已過期。');
        setIsLoading(false);
        return; // 終止後續查詢
      }
      
      // 1. 待審核 (posts.status = 'pending')
      const { count: pendingCount, error: pendingError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (pendingError) throw pendingError;

      // 2. 已核准 (posts.status = 'approved')
      const { count: approvedCount, error: approvedError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');
      if (approvedError) throw approvedError;

      // 3. 刪除請求 (delete_requests.status = 'pending')
      const { count: deleteRequestCount, error: deleteRequestError } = await supabase
        .from('delete_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (deleteRequestError) throw deleteRequestError;

      // 4. 總稿件數 (posts 總計)
      const { count: totalPostCount, error: totalPostError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });
      if (totalPostError) throw totalPostError;

      setCounts({
        pending: pendingCount,
        approved: approvedCount,
        delete_requests: deleteRequestCount,
        total_posts: totalPostCount,
      });

    } catch (e) {
      console.error('Fetch Counts Error:', e.message);
      setError(`載入數據失敗: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // ----------------- 渲染部分 -----------------
  
  if (isLoading) {
    return <div className="text-center py-10 text-lg text-indigo-600">載入中...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-lg text-red-600">錯誤: {error}</div>;
  }

  // 快速行動按鈕列表
  const quickActions = [
    { href: "/admin/pending", text: `前往審核稿件 (${counts.pending})`, bgColor: "bg-yellow-500", hoverColor: "hover:bg-yellow-600" },
    { href: "/admin/approved", text: `前往素材準備區 (${counts.approved})`, bgColor: "bg-blue-500", hoverColor: "hover:bg-blue-600" },
    { href: "/admin/delete-requests", text: `處理刪除請求 (${counts.delete_requests})`, bgColor: "bg-red-600", hoverColor: "hover:bg-red-700" },
    { href: "/admin/countdown", text: `🗓️ 倒數日設定`, bgColor: "bg-purple-600", hoverColor: "hover:bg-purple-700" },
  ];

  return (
    // 🚨 p-4 (小螢幕 padding) sm:p-6 lg:p-10 (中/大螢幕 padding)
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 border-b pb-2">
        管理員儀表板
      </h1>

      {/* 數據統計區 */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">即時統計</h2>
        {/* 🚨 手機優化：小螢幕顯示 2 欄 (grid-cols-2)，中螢幕以上顯示 4 欄 (md:grid-cols-4) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {/* 待審核 */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
            <p className="text-3xl sm:text-4xl font-extrabold text-yellow-600">
              {isLoading ? '...' : counts.pending}
            </p>
            <p className="text-sm mt-2 text-gray-600">待審核稿件</p>
          </div>
          {/* 已核准 */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
            <p className="text-3xl sm:text-4xl font-extrabold text-blue-600">
              {isLoading ? '...' : counts.approved}
            </p>
            <p className="text-sm mt-2 text-gray-600">已核准稿件</p>
          </div>
          {/* 刪除請求 */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-l-4 border-red-600">
            <p className="text-3xl sm:text-4xl font-extrabold text-red-600">
              {isLoading ? '...' : counts.delete_requests}
            </p>
            <p className="text-sm mt-2 text-gray-600">待處理刪除請求</p>
          </div>
          {/* 總稿件數 */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-l-4 border-gray-400">
            <p className="text-3xl sm:text-4xl font-extrabold text-gray-600">
              {isLoading ? '...' : counts.total_posts}
            </p>
            <p className="text-sm mt-2 text-gray-600">posts 表格總計</p>
          </div>
        </div>
      </div>
      
      {/* 快速行動區 */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">快速行動</h2>
        {/* 🚨 手機優化：flex-col (手機垂直堆疊)，md:flex-row flex-wrap (中螢幕以上橫向排列並換行) */}
        <div className="flex flex-col md:flex-row flex-wrap gap-4">
          {quickActions.map(action => (
            <Link 
                key={action.href}
                href={action.href} 
                // 讓按鈕在手機上佔滿寬度 (w-full)，平板以上才恢復原本大小 (md:w-auto)
                className={`block w-full md:w-auto px-6 py-3 ${action.bgColor} text-white font-medium rounded-lg shadow-md ${action.hoverColor} transition text-base`}
            >
                {action.text}
            </Link>
          ))}
          <button 
                onClick={fetchCounts}
                disabled={isLoading}
                // 讓按鈕在手機上佔滿寬度 (w-full)，平板以上才恢復原本大小 (md:w-auto)
                className="block w-full md:w-auto px-6 py-3 border border-gray-300 bg-gray-50 text-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-100 transition disabled:opacity-50 text-base"
            >
                {isLoading ? '🔄 載入中...' : '🔄 刷新數據'}
          </button>
        </div>
      </div>
    </div>
  );
}