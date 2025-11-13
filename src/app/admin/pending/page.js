// app/admin/pending/page.js (手機適用優化版)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
// 假設您沒有在 Pending 頁面使用 ImageComposer，如果需要，請在下方自行添加
// import ImageComposer from '../components/ImageComposer'; 

// Helper function to format the timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleString('zh-TW', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export default function PendingReviewPage() {
  const [pendingPosts, setPendingPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState({}); // 追蹤每條貼文的操作狀態

  // 1. 獲取待審核貼文列表
  const fetchPendingPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 僅獲取 status 為 'pending' 的貼文
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true }); // 最舊的投稿排在最前面

      if (error) {
        throw new Error(error.message);
      }
      
      setPendingPosts(data);
    } catch (e) {
      setError(`載入貼文失敗: ${e.message}`);
      console.error('Fetch Pending Posts Error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingPosts();
  }, [fetchPendingPosts]);

  // 2. 處理「核准」操作
  const handleApprove = async (postId) => {
    if (!window.confirm('確定要核准這篇投稿嗎？核准後將進入素材準備區。')) return;
    
    setActionStatus(prev => ({ ...prev, [postId]: 'approving' }));
    
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;
      
      // 成功後從列表中移除該貼文
      setPendingPosts(prev => prev.filter(post => post.id !== postId));
      
    } catch (e) {
      alert(`核准失敗: ${e.message}`);
      console.error('Approve Error:', e);
    } finally {
      setActionStatus(prev => ({ ...prev, [postId]: null }));
    }
  };

  // 3. 處理「拒絕」操作
  const handleReject = async (postId) => {
    if (!window.confirm('確定要拒絕這篇投稿嗎？')) return;
    
    setActionStatus(prev => ({ ...prev, [postId]: 'rejecting' }));
    
    try {
      // 💡 實際部署中，拒絕通常是將 status 設為 'rejected'，並讓前端過濾不顯示。
      // 但為了簡化，這裡直接刪除或標記為 'rejected' (這裡使用標記)。
      const { error } = await supabase
        .from('posts')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;

      // 成功後從列表中移除該貼文
      setPendingPosts(prev => prev.filter(post => post.id !== postId));

    } catch (e) {
      alert(`拒絕失敗: ${e.message}`);
      console.error('Reject Error:', e);
    } finally {
      setActionStatus(prev => ({ ...prev, [postId]: null }));
    }
  };

  // ----------------- 渲染部分 -----------------
  
  if (isLoading) {
    return <div className="text-center py-10 text-lg text-indigo-600">載入中...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-lg text-red-600">錯誤: {error}</div>;
  }

  return (
    // 🚨 確保在手機上有足夠 padding (p-4)
    <div className="min-h-screen bg-gray-50 p-4 sm:p-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 border-b pb-2">
        ⏳ 待審核稿件列表 ({pendingPosts.length})
      </h1>

      {pendingPosts.length === 0 ? (
        <div className="text-center py-20 text-xl text-gray-500 bg-white rounded-xl shadow-lg">
          🎉 目前沒有待審核的稿件！
        </div>
      ) : (
        <div className="space-y-6">
          {pendingPosts.map((post) => {
            const status = actionStatus[post.id];
            
            return (
              <div 
                key={post.id} 
                className={`bg-white p-6 rounded-xl shadow-xl border-l-4 border-yellow-500 transition-all ${status ? 'opacity-60' : 'opacity-100'}`}
              >
                
                {/* 頂部資訊區 (手機上垂直堆疊) */}
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 border-b pb-3">
                  <h2 className="text-lg font-semibold text-gray-800 break-all">
                    稿件 ID: {post.id}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 sm:mt-0 sm:text-right">
                    投稿時間: {formatTimestamp(post.created_at)}
                  </p>
                </div>

                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">臨時用戶名:</p>
                    <p className="text-xl font-bold text-indigo-600">{post.username}</p>
                </div>

                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">投稿內容:</p>
                    <p className="whitespace-pre-wrap text-gray-800 border p-3 rounded bg-gray-50">{post.content}</p>
                </div>
                
                {/* 圖片連結 (若存在) */}
                {post.image_path && (
                    <div className="mb-4 border-t pt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">圖片連結:</p>
                        <a 
                            href={post.image_path} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 text-sm break-all underline"
                        >
                            點擊查看圖片 (此連結為 Supabase Storage 公開連結)
                        </a>
                    </div>
                )}


                {/* 🚨 操作按鈕 - 手機優化：垂直堆疊 (flex-col)，中螢幕以上橫向排列 (sm:flex-row) */}
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0 mt-6">
                  <button
                    onClick={() => handleApprove(post.id)}
                    disabled={!!status}
                    // 🚨 w-full (手機佔滿寬度) sm:flex-1 (中螢幕以上平均分配)
                    className="w-full sm:flex-1 py-3 px-4 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {status === 'approving' ? '正在核准...' : '✅ 核准 (Approved)'}
                  </button>
                  <button
                    onClick={() => handleReject(post.id)}
                    disabled={!!status}
                    // 🚨 w-full (手機佔滿寬度) sm:flex-1 (中螢幕以上平均分配)
                    className="w-full sm:flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {status === 'rejecting' ? '正在拒絕...' : '❌ 拒絕 (Rejected)'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}