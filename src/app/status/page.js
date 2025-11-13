// app/status/page.js (Revised - Query by Username Only)
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

// Helper function to format the timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleString('zh-TW', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

// 根據狀態設定顏色
const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'published':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };


export default function StatusPage() {
  const [username, setUsername] = useState('');
  const [postList, setPostList] = useState(null); // 儲存查詢結果 (陣列)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuery = async (e) => {
    e.preventDefault();

    if (!username) {
      setError('請輸入您的臨時用戶名。');
      return;
    }

    setIsLoading(true);
    setPostList(null);
    setError(null);

    try {
      // 僅使用 temporary_username 進行查詢，不再使用 .single()
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('id, content, status, created_at, username_created_at')
        .eq('temporary_username', username)
        .order('created_at', { ascending: false }); // 最新投稿排在最前面

      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      if (!data || data.length === 0) {
        setError(`找不到與用戶名 "${username}" 相關的投稿紀錄。`);
        return;
      }

      // 檢查 30 天有效期 (前端邏輯) 並附加到每條紀錄
      const resultsWithExpiry = data.map(post => {
        const creationDate = new Date(post.username_created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return {
            ...post,
            isExpired: creationDate < thirtyDaysAgo
        };
      });

      setPostList(resultsWithExpiry);

    } catch (err) {
      console.error('查詢失敗:', err);
      setError(err.message || '查詢時發生未知錯誤，請檢查用戶名。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-xl mx-auto bg-white p-6 sm:p-10 rounded-xl shadow-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">🔍 稿件狀態查詢</h1>
          <p className="text-sm text-gray-500 mt-2">
            請輸入您投稿時設定的臨時用戶名，系統將列出所有相關投稿。
          </p>
        </header>

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <p className="font-bold">錯誤:</p>
            <p className="text-sm mt-1 break-words">{error}</p>
          </div>
        )}

        <form onSubmit={handleQuery} className="space-y-4">
          
          {/* 臨時用戶名 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              臨時用戶名
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="投稿時輸入的名稱"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150"
          >
            {isLoading ? '正在查詢...' : '查詢狀態'}
          </button>
        </form>

        {/* 查詢結果列表 */}
        {postList && postList.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              找到 {postList.length} 筆投稿紀錄:
            </h2>
            
            <div className="space-y-4">
              {postList.map((post) => (
                <div key={post.id} className="p-4 border rounded-lg shadow-sm bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <p className={`px-3 py-1 text-sm font-semibold rounded-full capitalize ${getStatusColor(post.status)}`}>
                      狀態: {post.status}
                    </p>
                    {post.isExpired && (
                        <span className="text-xs text-red-600 font-bold bg-red-50 p-1 rounded">
                            ⚠️ 用戶名過期
                        </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mb-2">ID: {post.id}</p>
                  
                  <div className="text-sm text-gray-700 border-l-4 border-indigo-300 pl-3 py-1 bg-indigo-50">
                    <p className="font-medium mb-1">投稿內容預覽:</p>
                    <p className="line-clamp-2 italic">{post.content}</p>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">投稿時間: {formatTimestamp(post.created_at)}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-600">
                若需刪文，請記下對應的 ID，前往「請求刪除稿件」。
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-indigo-500 hover:text-indigo-700 transition duration-150">
                返回目錄
            </Link>
        </div>
      </div>
    </div>
  );
}