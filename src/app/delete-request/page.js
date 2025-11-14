// app/delete-request/page.js (最終修正版 - 確保文字為黑色)
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function DeleteRequestPage() {
  const [formData, setFormData] = useState({
    post_link: '',
    contact_ig: '',
    reason: '',
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    if (!formData.post_link.trim() || !formData.contact_ig.trim() || !formData.reason.trim()) {
      setMessage('⚠️ 所有欄位都必須填寫。');
      setStatus('error');
      return;
    }

    try {
      // 將請求插入到新的 delete_requests 表格
      const { data, error } = await supabase
        .from('delete_requests')
        .insert([
          {
            post_link: formData.post_link.trim(),
            contact_ig: formData.contact_ig.trim(),
            reason: formData.reason.trim(),
          }
        ]);

      if (error) {
        // 由於 RLS 已經解決，這裡可能是其他數據庫錯誤
        throw new Error(error.message);
      }
      
      setStatus('success');
      setMessage('✅ 刪除請求已成功提交，我們將盡快處理！');
      setFormData({
        post_link: '',
        contact_ig: '',
        reason: '',
      });

    } catch (e) {
      console.error('提交刪除請求失敗:', e);
      setMessage(`❌ 發生系統錯誤：${e.message}。請稍後再試。`);
      setStatus('error');
    }
  };

  const getStatusDisplay = () => {
    if (status === 'success') {
      return (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md mt-6">
          {message}
        </div>
      );
    }
    if (status === 'error') {
      return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md mt-6">
          {message}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <header>
          <h2 className="text-3xl font-extrabold text-gray-900 text-center">
            🔥 已發布貼文刪除請求
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            請僅用於請求刪除**已發布**到社群平台的貼文。
          </p>
        </header>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            
            {/* 貼文連結/ID */}
            <div>
              <label htmlFor="post_link" className="block text-sm font-medium text-gray-700">
                已發布的貼文連結或ID：
              </label>
              <input
                id="post_link"
                name="post_link"
                type="text"
                value={formData.post_link}
                onChange={handleChange}
                disabled={status === 'loading'}
                required
                // 修正：確保輸入的文字為黑色
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-base text-gray-900" 
                placeholder="https://www.instagram.com/p/XXXXXX"
              />
            </div>

            {/* 聯絡IG帳號 */}
            <div>
              <label htmlFor="contact_ig" className="block text-sm font-medium text-gray-700">
                您的聯絡 IG 帳號 (必填)：
              </label>
              <input
                id="contact_ig"
                name="contact_ig"
                type="text"
                value={formData.contact_ig}
                onChange={handleChange}
                disabled={status === 'loading'}
                required
                // 修正：確保輸入的文字為黑色
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-base text-gray-900"
                placeholder="@your_ig_handle"
              />
            </div>

            {/* 刪除原因 */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                要求刪除的原因：
              </label>
              <textarea
                id="reason"
                name="reason"
                rows="3"
                value={formData.reason}
                onChange={handleChange}
                disabled={status === 'loading'}
                required
                // 修正：確保輸入的文字為黑色
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-base text-gray-900"
                placeholder="請簡述您要求刪除的原因..."
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition"
          >
            {status === 'loading' ? '⏳ 正在提交請求...' : '提交刪除請求'}
          </button>
        </form>
        
        {/* 狀態訊息顯示 */}
        {getStatusDisplay()}
        
      </div>

      <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-indigo-500 hover:text-indigo-700 transition duration-150">
                返回目錄
            </Link>
        </div>
    </div>
  );

}
