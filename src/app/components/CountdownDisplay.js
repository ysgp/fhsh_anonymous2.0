// app/components/CountdownDisplay.js
'use client'; 

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 輔助函數：計算倒數日
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


export default function CountdownDisplay({ initialSetting }) {
    const [setting, setSetting] = useState(initialSetting);
    const [days, setDays] = useState(null);

    // 1. 處理倒數計時邏輯
    useEffect(() => {
        if (setting && setting.targetDate) {
            // 立即計算一次
            setDays(calculateDaysRemaining(setting.targetDate));
            
            // 設置每天重新計算的計時器 (如果需要精準到分鐘/秒，則需要更複雜的計時器)
            // 這裡我們假設只需要顯示天數，因此不需要頻繁更新
        } else {
             setDays(null);
        }
    }, [setting]);

    // ---------------- 渲染部分 ----------------

    // 情況 A: 資料庫中沒有倒數日設定
    if (!setting || !setting.targetDate) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-gray-400 w-full max-w-sm text-center"
            >
                <p className="text-xl font-semibold text-gray-700">😴 尚未設定公開倒數日</p>
                <p className="text-sm text-gray-500 mt-1">請聯繫管理員進行設定。</p>
            </motion.div>
        );
    }

    const isPast = days <= 0;
    const displayDays = Math.abs(days);

    // 情況 B: 正常顯示倒數日
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-8 rounded-2xl shadow-2xl w-full max-w-md text-center transform transition-all duration-500 
                ${isPast ? 'bg-red-50 border-4 border-red-500' : 'bg-indigo-50 border-4 border-indigo-500'}`}
        >
            <p className="text-sm font-medium text-gray-600 mb-2">
                {isPast ? '🎉 事件已發生：' : '🗓️ 倒數事件：'}
            </p>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {setting.eventName}
            </h2>

            <div className={`text-7xl font-extrabold transition-colors duration-500 
                ${isPast ? 'text-red-700' : 'text-indigo-700'}`}>
                {displayDays}
            </div>

            <p className="text-xl font-medium text-gray-600 mt-2">
                {isPast ? '天前' : '天後'}
            </p>
            <p className="text-sm text-gray-500 mt-4">
                目標日期: {setting.targetDate}
            </p>
        </motion.div>
    );
}