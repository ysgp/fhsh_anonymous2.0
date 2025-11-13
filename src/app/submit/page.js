// app/submit/page.js (最終修正版 - 加入動畫與文字顏色修正)
'use client'; 

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client'; // 引入 Supabase 客戶端
import Link from 'next/link';
import { motion } from 'framer-motion'; // <--- 新增: 導入 framer-motion

// Helper: 生成一個隨機的 UUID 樣式字串作為臨時圖片名
const generateUuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 動畫變數
const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const resultVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};


export default function SubmitPage() {
  const [content, setContent] = useState('');
  const [username, setUsername] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null); // { success: true, postId: '...' }

  const handleFileChange = (e) => {
    // 只取第一個檔案
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content || !username) {
      alert('請填寫投稿內容和您的臨時用戶名。');
      return;
    }
    
    setIsSubmitting(true);
    setSubmissionResult(null);
    let imagePath = null;
    let postId = null;

    try {
      // 1. 圖片上傳 (如果存在)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${generateUuid()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post-images') // 請確保您的 Storage Bucket 名稱是 'post-images'
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`圖片上傳失敗: ${uploadError.message}`);
        }
        imagePath = fileName;
      }

      // 2. 寫入資料庫
      const { data, error: insertError } = await supabase
        .from('posts')
        .insert({
          content: content,
          temporary_username: username,
          image_path: imagePath,
          status: 'pending',
          // username_created_at 預設為 NOW()，無需手動設定
        })
        .select('id') // 獲取新插入的 ID
        .single();
        
      if (insertError) {
        throw new Error(`資料庫寫入失敗: ${insertError.message}`);
      }

      postId = data.id;

      // 3. 成功後清空表單並顯示結果
      setContent('');
      setUsername('');
      setImageFile(null);
      setSubmissionResult({ success: true, postId });

    } catch (error) {
      console.error('投稿失敗:', error);
      setSubmissionResult({ success: false, message: error.message || '未知錯誤' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 顯示成功訊息
  if (submissionResult && submissionResult.success) {
    return (
      // 使用 motion.div 加入動畫
      <motion.div 
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4"
        initial="hidden"
        animate="visible"
        variants={resultVariants}
      >
        <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md border-t-4 border-green-500">
          <h2 className="text-3xl font-bold text-green-600 mb-4">投稿成功！🎉</h2>
          <p className="text-gray-700 mb-4">
            您的投稿已進入審核流程。
          </p>
          <p className="text-gray-700 font-medium mb-6">
            您的投稿 ID 是：<span className="text-indigo-600 font-extrabold break-all">{submissionResult.postId}</span>
          </p>
          <p className="text-sm text-red-500 mb-6">
            請務必記下您的 **臨時用戶名** 和此 **投稿 ID**，這是您未來查詢狀態的唯一憑證。
          </p>
          <Link href="/" className="text-indigo-500 hover:text-indigo-700 font-medium transition duration-150">
            返回主目錄
          </Link>
        </div>
      </motion.div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      {/* 使用 motion.div 包裹表單容器，加入進入動畫 */}
      <motion.div 
        className="max-w-xl mx-auto bg-white p-6 sm:p-10 rounded-xl shadow-2xl border-t-4 border-indigo-500"
        initial="hidden"
        animate="visible"
        variants={formVariants}
      >
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">匿名投稿</h1>
          <p className="text-sm text-red-500">
            您的投稿將經過審核，並可能被發佈到校方 IG 帳號。
          </p>
          <Link href="/submit-guide" className="text-sm text-indigo-500 hover:text-indigo-700 transition duration-150 mt-1 block">
                → 點擊查看投稿規範 ←
          </Link>
        </header>

        {/* 錯誤訊息 - 使用 motion.div */}
        {submissionResult && !submissionResult.success && (
          <motion.div 
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <strong className="font-bold">投稿失敗:</strong>
            <span className="block sm:inline ml-2">{submissionResult.message}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 臨時用戶名 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              臨時用戶名 (必填，30天有效)
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="輸入一個用於查詢狀態的名稱"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" // <--- 修正文字顏色
              required
            />
          </div>

          {/* 投稿內容 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              投稿內容 (必填)
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="5"
              placeholder="請輸入您的匿名內容..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" // <--- 修正文字顏色
              required
            ></textarea>
          </div>

          {/* 圖片上傳 */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
              上傳圖片 (可選)
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {imageFile && <p className="mt-2 text-xs text-gray-500">已選擇檔案: {imageFile.name}</p>}
          </div>

          {/* 提交按鈕 */}
          <motion.button // <--- 使用 motion.button 加入動畫
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150"
          >
            {isSubmitting ? '正在提交中...' : '確認投稿'}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-indigo-500 hover:text-indigo-700 transition duration-150">
                返回目錄
            </Link>
        </div>
      </motion.div>
    </div>
  );
}