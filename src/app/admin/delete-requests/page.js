// app/admin/delete-requests/page.js (手機適用完整版)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
// 💡 假設您有安裝 framer-motion，如果您沒有，請移除以下匯入
import { motion } from 'framer-motion'; 

// Helper function to format the timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleString('zh-TW', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export default function DeleteRequestsPage() {
  const [deleteRequests, setDeleteRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. 獲取刪除請求列表 (從 delete_requests 表格)
  const fetchDeleteRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 僅獲取 status 為 'pending' 的刪除請求
      const { data, error } = await supabase
        .from('delete_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true }); // 較舊的請求排在前面

      if (error) {
        throw new Error(error.message);
      }
      
      setDeleteRequests(data);
    } catch (e) {
      setError(`載入刪除請求失敗: ${e.message}`);
      console.error('Fetch Delete Requests Error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeleteRequests();
  }, [fetchDeleteRequests]);

  // 2. 處理「標記為已處理/拒絕」操作
  const handleMarkAsProcessed = async (requestId, newStatus) => {
    if (!window.confirm(`確定要將此請求標記為【${newStatus === 'processed' ? '已手動處理' : '已拒絕'}】嗎？`)) return;

    try {
      const { error } = await supabase
        .from('delete_requests')
        .update({ status: newStatus, is_resolved: true })
        .eq('id', requestId);

      if (error) throw error;
      
      // 成功後從列表中移除該請求
      setDeleteRequests(prev => prev.filter(request => request.id !== requestId));
      
    } catch (e) {
      alert(`處理失敗: ${e.message}`);
      console.error('Processing Error:', e);
    }
  };

  // ----------------- 渲染部分 -----------------
  
  if (isLoading) {
    return <div className="text-center py-10 text-lg text-red-600">載入中...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-lg text-red-600">錯誤: {error}</div>;
  }

  return (
    // 🚨 確保在手機上有足夠 padding (p-4)
    <div className="min-h-screen bg-gray-50 p-4 sm:p-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 border-b pb-2">
        🗑️ 待處理刪除請求 ({deleteRequests.length})
      </h1>

      {deleteRequests.length === 0 ? (
        <div className="text-center py-20 text-xl text-gray-500 bg-white rounded-xl shadow-lg">
          🎉 目前沒有待處理的刪除請求！
        </div>
      ) : (
        <div className="space-y-6">
          {deleteRequests.map((request) => (
            // 💡 使用 motion.div (如果安裝了 framer-motion) 增加動畫效果
            <div 
              key={request.id} 
              className="bg-white p-6 rounded-xl shadow-xl border-l-4 border-red-500"
            >
              
              {/* 頂部資訊區 */}
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 border-b pb-3">
                <h2 className="text-lg font-semibold text-gray-800 break-all">
                  請求 ID: {request.id}
                </h2>
                <p className="text-sm text-gray-500 mt-1 sm:mt-0 sm:text-right">
                  提交時間: {formatTimestamp(request.created_at)}
                </p>
              </div>

              {/* 貼文連結/ID */}
              <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">要求刪除的貼文 ID/連結:</p>
                  <p className="text-lg font-bold text-red-600 break-all">{request.post_link}</p>
              </div>

              {/* 聯絡方式 */}
              <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">聯絡 IG 帳號:</p>
                  <p className="text-lg font-bold text-indigo-600">{request.contact_ig}</p>
              </div>
              
              {/* 刪除原因 */}
              <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">要求刪除的原因:</p>
                  <p className="whitespace-pre-wrap text-gray-800 border p-3 rounded bg-red-50">{request.reason}</p>
              </div>


              {/* 操作按鈕 */}
              {/* 🚨 手機優化：flex-col (手機垂直堆疊)，md:flex-row (中螢幕以上橫向排列) */}
              <div className="flex flex-col space-y-3 md:flex-row md:space-x-4 md:space-y-0 mt-6">
                <button
                  onClick={() => handleMarkAsProcessed(request.id, 'processed')}
                  // 🚨 w-full (手機佔滿寬度) md:flex-1 (中螢幕以上平均分配)
                  className="w-full md:flex-1 py-3 px-4 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 transition"
                >
                  ✅ 確認已手動處理 (標記為已處理)
                </button>
                <button
                  onClick={() => handleMarkAsProcessed(request.id, 'rejected')}
                   // 🚨 w-full (手機佔滿寬度) md:flex-1 (中螢幕以上平均分配)
                  className="w-full md:flex-1 py-3 px-4 bg-gray-400 text-white font-medium rounded-lg shadow-md hover:bg-gray-500 transition"
                >
                  ❌ 拒絕請求 (標記為已拒絕)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}