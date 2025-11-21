// app/admin/countdown/page.js (支援多倒數日版 - 置中調整)
'use client';

import { useState, useEffect, useCallback } from 'react';
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
    // 狀態管理：現在是一個事件陣列 (events)
    const [events, setEvents] = useState([]); 
    const [formData, setFormData] = useState({ event_name: '', target_date: '' });
    const [editingId, setEditingId] = useState(null); // 用來判斷現在是「新增」還是「編輯」
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState(null); // { type: 'success'/'error', message: '' }

    // 1. 獲取所有倒數日設定
    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            // 查詢所有設定，並按日期排序
            const { data, error } = await supabase
                .from('countdown_settings')
                .select('*')
                .order('target_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (e) {
            console.error("Error fetching events:", e.message);
            setStatus({ type: 'error', message: `載入失敗: ${e.message}` });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // 處理表單欄位變化
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 準備進入編輯模式
    const handleEditClick = (event) => {
        setEditingId(event.id);
        setFormData({
            event_name: event.event_name,
            target_date: event.target_date
        });
        setStatus(null);
        // 滾動到表單處 (選擇性優化)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 取消編輯，重置表單
    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ event_name: '', target_date: '' });
        setStatus(null);
    };

    // 刪除事件
    const handleDelete = async (id) => {
        if(!confirm('確定要刪除這個倒數日嗎？')) return;

        try {
            const { error } = await supabase
                .from('countdown_settings')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setStatus({ type: 'success', message: '刪除成功！' });
            fetchEvents(); // 重新整理列表
            
            // 如果刪除的是正在編輯的項目，重置表單
            if (editingId === id) handleCancelEdit();

        } catch (e) {
            setStatus({ type: 'error', message: `刪除失敗: ${e.message}` });
        }
    };

    // 2. 處理表單提交 (新增 或 更新)
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
            if (editingId) {
                // --- 更新模式 (Update) ---
                const { error } = await supabase
                    .from('countdown_settings')
                    .update({ 
                        event_name: formData.event_name, 
                        target_date: formData.target_date,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingId);

                if (error) throw error;
                setStatus({ type: 'success', message: '更新成功！' });

            } else {
                // --- 新增模式 (Insert) ---
                // 不帶 ID，讓資料庫自動生成 UUID
                const { error } = await supabase
                    .from('countdown_settings')
                    .insert([{ 
                        event_name: formData.event_name, 
                        target_date: formData.target_date,
                        is_active: true // 預設啟用
                    }]);

                if (error) throw error;
                setStatus({ type: 'success', message: '新增成功！' });
            }

            // 重置表單並重新載入
            handleCancelEdit();
            await fetchEvents(); 

        } catch (e) {
            console.error("Error saving:", e.message);
            setStatus({ type: 'error', message: `儲存失敗: ${e.message}` });
        } finally {
            setIsLoading(false);
        }
    };


    // ----------------- 渲染部分 -----------------
    
    if (isLoading && events.length === 0) {
        return <div className="text-center py-10 text-lg text-indigo-600">載入中...</div>;
    }

    return (
        // 🚨 主容器：確保內容水平置中 (items-center) 且頁面有足夠邊距 (p-4 sm:p-8)
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8"> 
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 border-b pb-2 w-full max-w-2xl text-center">
                🗓️ 多重倒數日管理
            </h1>

            {/* 核心容器：保持 max-w-2xl 確保內容不會過寬，並置中 */}
            <div className="w-full max-w-2xl space-y-8">
                
                {/* 狀態訊息 */}
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-md ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                        {status.message}
                    </motion.div>
                )}

                {/* --- 表單區塊 --- */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-800">
                            {editingId ? '✍️ 編輯倒數日' : '➕ 新增倒數日'}
                        </h2>
                        {editingId && (
                            <button onClick={handleCancelEdit} className="text-sm text-gray-500 hover:text-gray-700 underline">
                                取消編輯
                            </button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">事件名稱</label>
                                <input
                                    type="text"
                                    name="event_name"
                                    value={formData.event_name}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">目標日期</label>
                                <input
                                    type="date"
                                    name="target_date"
                                    value={formData.target_date}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                                ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'} 
                                focus:outline-none transition`}
                        >
                            {isLoading ? '處理中...' : (editingId ? '更新設定' : '新增倒數日')}
                        </button>
                    </form>
                </div>

                {/* --- 列表顯示區塊 --- */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">已建立的倒數日 ({events.length})</h2>
                    
                    {events.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">目前沒有任何設定，請由上方新增。</p>
                    ) : (
                        <div className="grid gap-4">
                            {events.map((event) => {
                                const days = calculateDaysRemaining(event.target_date);
                                const isPast = days <= 0;

                                return (
                                    <motion.div 
                                        key={event.id}
                                        layout
                                        className={`p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white shadow-sm
                                            ${editingId === event.id ? 'ring-2 ring-amber-400 border-transparent' : 'border-gray-200'}
                                        `}
                                    >
                                        <div className="mb-3 sm:mb-0">
                                            <h3 className="font-bold text-gray-900 text-lg">{event.event_name}</h3>
                                            <div className="text-sm text-gray-600 flex items-center gap-2">
                                                <span>📅 {event.target_date}</span>
                                                <span className={`font-medium px-2 py-0.5 rounded text-xs ${isPast ? 'bg-gray-200 text-gray-600' : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {isPast ? '已結束' : `還有 ${days} 天`}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => handleEditClick(event)}
                                                className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm transition"
                                            >
                                                編輯
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 text-sm transition"
                                            >
                                                刪除
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}