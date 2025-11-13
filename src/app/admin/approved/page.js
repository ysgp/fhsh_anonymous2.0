// app/admin/approved/page.js (無需修改，但需要資料庫支援 published_at 欄位)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import ImageComposer from '../components/ImageComposer'; 

// Helper function to format the timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleString('zh-TW', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export default function ApprovedPostsPage() {
  const [approvedPosts, setApprovedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState({}); 

  // 1. 獲取已核准貼文列表
  const fetchApprovedPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 僅獲取 status 為 'approved' 的貼文
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'approved')
        .order('reviewed_at', { ascending: false }); 

      if (error) {
        throw new Error(error.message);
      }
      
      setApprovedPosts(data);
    } catch (e) {
      setError(`載入貼文失敗: ${e.message}`);
      console.error('Fetch Approved Posts Error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovedPosts();
  }, [fetchApprovedPosts]);

  // 2. 處理「標記為已發佈」操作
  const handlePublish = async (postId) => {
    if (!window.confirm('確定要將此稿件標記為【已發佈】嗎？')) return;
    
    setActionStatus(prev => ({ ...prev, [postId]: 'publishing' }));
    
    try {
      const { error } = await supabase
        .from('posts')
        // 🚀 關鍵：這裡需要 published_at 欄位存在於資料庫中
        .update({ status: 'published', published_at: new Date().toISOString() }) 
        .eq('id', postId);

      if (error) throw error;
      
      setApprovedPosts(prev => prev.filter(post => post.id !== postId));
      
    } catch (e) {
      alert(`發佈失敗: ${e.message}`); // 這裡將顯示原始的錯誤訊息
      console.error('Publish Error:', e);
    } finally {
      setActionStatus(prev => ({ ...prev, [postId]: null }));
    }
  };

  // 3. 處理「退回待審核」操作 (已包含清空 published_at)
  const handleReturnToPending = async (postId) => {
    if (!window.confirm('確定要將此稿件退回【待審核】狀態嗎？')) return;
    
    setActionStatus(prev => ({ ...prev, [postId]: 'returning' }));
    
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: 'pending', reviewed_at: null, published_at: null }) // 清空發佈時間
        .eq('id', postId);

      if (error) throw error;

      setApprovedPosts(prev => prev.filter(post => post.id !== postId));

    } catch (e) {
      alert(`退回失敗: ${e.message}`);
      console.error('Return to Pending Error:', e);
    } finally {
      setActionStatus(prev => ({ ...prev, [postId]: null }));
    }
  };

  // ... (渲染部分保持不變) ...
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 border-b pb-2">
        🖼️ 素材準備區 ({approvedPosts.length})
      </h1>
      {approvedPosts.length === 0 ? (
        <div className="text-center py-20 text-xl text-gray-500 bg-white rounded-xl shadow-lg">
          🎉 目前沒有已核准的稿件，請先在「待審核區」核准貼文。
        </div>
      ) : (
        <div className="space-y-8">
          {approvedPosts.map((post) => {
            const status = actionStatus[post.id];
            
            return (
              <div 
                key={post.id} 
                className={`bg-white p-6 rounded-xl shadow-2xl border-l-4 border-blue-500 transition-all ${status ? 'opacity-60' : 'opacity-100'}`}
              >
                
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 border-b pb-3">
                  <h2 className="text-lg font-semibold text-gray-800 break-all">
                    稿件 ID: {post.id}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 sm:mt-0 sm:text-right">
                    核准時間: {formatTimestamp(post.reviewed_at)}
                  </p>
                </div>

                {/* 核心調整：內容/素材區塊 - 手機垂直堆疊，大螢幕橫向排列 */}
                <div className="flex flex-col lg:flex-row lg:space-x-8">
                    
                    {/* 左側：內容顯示區 */}
                    <div className="lg:w-1/2 mb-6 lg:mb-0">
                        <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700">臨時用戶名:</p>
                            <p className="text-xl font-bold text-indigo-600">{post.username}</p>
                        </div>

                        <div className="mb-4 border-b pb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">投稿內容:</p>
                            <p className="whitespace-pre-wrap text-gray-800 border p-3 rounded bg-gray-50">{post.content}</p>
                        </div>

                        {/* 圖片連結 (若存在) */}
                        {post.image_path && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">圖片連結:</p>
                                <a 
                                    href={post.image_path} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 text-sm break-all underline"
                                >
                                    點擊查看原始圖片 (Supabase Storage 公開連結)
                                </a>
                            </div>
                        )}
                        
                        {/* 🚨 操作按鈕 - 手機優化：垂直堆疊 (flex-col) */}
                        <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0 mt-6 pt-4 border-t">
                            <button
                                onClick={() => handlePublish(post.id)}
                                disabled={!!status}
                                className="w-full sm:flex-1 py-3 px-4 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {status === 'publishing' ? '正在發佈...' : '✅ 標記為已發佈'}
                            </button>
                            <button
                                onClick={() => handleReturnToPending(post.id)}
                                disabled={!!status}
                                className="w-full sm:flex-1 py-3 px-4 bg-yellow-600 text-white font-medium rounded-lg shadow-md hover:bg-yellow-700 transition disabled:opacity-50"
                            >
                                {status === 'returning' ? '正在退回...' : '🔄 退回待審核'}
                            </button>
                        </div>

                    </div>
                    
                    {/* 右側：圖片合成區 */}
                    <div className="lg:w-1/2">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                            🎨 素材合成工具
                        </h3>
                         {/* 圖片合成下載元件 */}
                        <ImageComposer 
                            imagePath={post.image_path} 
                            postId={post.id}
                            content={post.content} 
                        />
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}