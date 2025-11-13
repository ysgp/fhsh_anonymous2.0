// app/admin/countdown/page.js (手機適用完整版)
'use client';

import { useState, useEffect, useCallback } from 'react';
// 確保您的客戶端 Supabase client 匯入路徑正確
import { supabase } from '@/lib/supabase/client'; 
import { motion } from 'framer-motion';

// 計算倒數日期的輔助函數
const calculateDaysRemaining = (targetDate) => {
    if (!targetDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0); 
    
    // 毫秒轉天數 (無條件進位)
    const differenceInTime = target.getTime() - today.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    return differenceInDays;
};


export default function AdminCountdownPage() {
    const [currentSetting, setCurrentSetting] = useState(null); 
    const [formData, setFormData] = useState({ event_name: '', target_date: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState(null); // { type: 'success'/'error', message: '' }

    // 1. 獲取當前最新的倒數日設定
    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        setStatus(null);
        try {
            // 查詢最新的設定（假設只有一筆或取最新的）
            const { data, error } = await supabase
                .from('countdown_settings')
                .select('event_name, target_date, updated_at')
                .order('updated_at', { ascending: false }) 
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setCurrentSetting(data);
                setFormData({
                    event_name: data.event_name || '',
                    target_date: data.target_date || '',
                });
            } else {
                setCurrentSetting(null);
            }

        } catch (e) {
            console.error("Error fetching settings:", e.message);
            setStatus({ type: 'error', message: `載入設定失敗: ${e.message}` });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // 處理表單欄位變化
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 2. 處理表單提交 (新增/更新設定)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus(null);

        if (!formData.event_name || !formData.target_date) {
             setStatus({ type: 'error', message: '請填寫完整的事件名稱和日期！' });
             setIsLoading(false);
             return;
        }

        try {
            // 由於設定只有一組，我們直接 Upsert (插入或更新)
            const { error } = await supabase
                .from('countdown_settings')
                .upsert([
                    { 
                        id: 1, // 假設我們使用固定的 ID 來確保只有一組設定
                        event_name: formData.event_name, 
                        target_date: formData.target_date, 
                    }
                ], { onConflict: 'id' }); // 如果 id 存在，則更新

            if (error) throw error;
            
            setStatus({ type: 'success', message: '倒數日設定已成功儲存並啟用！' });
            // 重新載入最新的設定
            await fetchSettings(); 

        } catch (e) {
            console.error("Error saving settings:", e.message);
            setStatus({ type: 'error', message: `儲存失敗: ${e.message}` });
        } finally {
            setIsLoading(false);
        }
    };


    // ----------------- 渲染部分 -----------------
    
    const daysRemaining = currentSetting ? calculateDaysRemaining(currentSetting.target_date) : null;
    const isPast = daysRemaining !== null && daysRemaining <= 0;
    
    if (isLoading && !currentSetting) {
        return <div className="text-center py-10 text-lg text-indigo-600">載入中...</div>;
    }

    return (
        // 🚨 主容器：確保在任何螢幕上都有 padding (p-4)，並使用 items-start 讓內容靠上
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6"> 
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 border-b pb-2 w-full max-w-xl text-center">
                🗓️ 倒數日設定管理
            </h1>

            {/* 核心容器：在手機上佔滿寬度 (w-full)，最大限制為 max-w-xl */}
            <div className="w-full max-w-xl bg-white p-6 sm:p-8 rounded-xl shadow-2xl space-y-6">
                
                {/* 狀態訊息顯示 */}
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-md ${status.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}
                    >
                        {status.message}
                    </motion.div>
                )}

                {/* 當前設定顯示區 */}
                <div className="p-4 border border-gray-200 rounded-lg">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">當前啟用設定:</h2>
                    {currentSetting && daysRemaining !== null ? (
                        <div className={`p-3 rounded-md ${isPast ? 'bg-red-50' : 'bg-indigo-50'}`}>
                            <p className="text-md font-bold text-gray-900 break-all">
                                事件名稱: {currentSetting.event_name}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                目標日期: {currentSetting.target_date}
                            </p>
                            <p className={`text-xl font-extrabold mt-2 ${isPast ? 'text-red-700' : 'text-indigo-700'}`}>
                                距離 {currentSetting.target_date} 還有 {Math.abs(daysRemaining)} {isPast ? '天 (已過)' : '天'}
                            </p>
                        </div>
                    ) : (
                         <p className="text-sm text-gray-500">
                             目前沒有設定任何公開倒數日。
                         </p>
                    )}
                </div>

                {/* 設置表單 */}
                <form onSubmit={handleSubmit} className="border-t pt-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800">設置新的倒數日</h2>
                    
                    <div>
                        <label htmlFor="event_name" className="block text-sm font-medium text-gray-700">事件名稱</label>
                        <input
                            type="text"
                            name="event_name"
                            id="event_name"
                            value={formData.event_name}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="target_date" className="block text-sm font-medium text-gray-700">目標日期</label>
                        <input
                            type="date"
                            name="target_date"
                            id="target_date"
                            value={formData.target_date}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
                    >
                        {isLoading ? '處理中...' : '💾 儲存並啟用設定'}
                    </button>
                </form>
            </div>
        </div>
    );
}