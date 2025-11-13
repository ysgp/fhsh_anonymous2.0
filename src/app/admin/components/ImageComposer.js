// app/admin/components/ImageComposer.js (修正版 - 修正 wrapText 函數)
'use client';

import { useState } from 'react';

// 假設：您的 IG 正方形底圖路徑
const TEMPLATE_PATH = '/ig-template.jpg';
const STORAGE_BUCKET = 'post-images'; 

// --- 字體設定 ---
const CUSTOM_FONT_FAMILY = 'Noto Sans TC Composer'; 
const MAX_FONT_SIZE = 48; // 繪製文字時的最大字體大小
const MIN_FONT_SIZE = 24; // 繪製文字時的最小字體大小
const LINE_HEIGHT_RATIO = 1.5; // 行高是字體大小的 1.5 倍

// 繪圖配置
const CANVAS_SIZE = 1080; // 最終輸出的像素 (IG 標準尺寸)
const PADDING_RATIO = 0.1; 
const PADDING = PADDING_RATIO * CANVAS_SIZE; 
const INNER_WIDTH = CANVAS_SIZE - 2 * PADDING; // 內容可用寬度/高度

// 獲取 Supabase Storage 的公開 URL
const getPublicImageUrl = (imagePath) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || !imagePath) return null;
    return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${imagePath}`;
};

// 輔助函數：將文字內容斷行以適應寬度 (已修正，可處理連續中文字元)
const wrapText = (ctx, text, maxWidth) => {
    const processedText = text.replace(/\n/g, ' \n ');
    // 這次我們將內容視為一系列字符，而不是單詞
    const characters = processedText.split(''); 
    let line = '';
    const lines = [];

    for(let n = 0; n < characters.length; n++) {
        const char = characters[n];
        
        // 遇到手動換行符號
        if (char === ' ') {
             if (characters[n+1] === '\n') {
                lines.push(line.trim());
                line = '';
                n++; // 跳過下一個 '\n'
                continue;
             }
        }

        const testLine = line + char;
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        // 檢查寬度是否超過限制
        if (testWidth > maxWidth && line.length > 0) {
            lines.push(line.trim()); // 推入前一行
            line = char; // 從當前字符開始新的一行
        } else {
            line = testLine; // 繼續添加到當前行
        }
    }
    lines.push(line.trim());
    return lines.filter(l => l.length > 0); 
};

// 載入圖片的 Promise 函數
const loadImage = (url) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // 必須設定，避免跨域問題
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`無法載入圖片: ${url}`));
    img.src = url;
});


export default function ImageComposer({ imagePath, postId, content }) {
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);
    const hasImage = !!imagePath;

    // --- 核心函數 1: 合成圖片下載 (無論有無圖片) ---
    const handleDownloadComposite = async () => {
        setDownloading(true);
        setError(null);

        try {
            // 確保字體已經載入
            if (!hasImage && typeof document !== 'undefined' && document.fonts) {
                 const fontReady = document.fonts.check(`normal ${MAX_FONT_SIZE}px ${CUSTOM_FONT_FAMILY}`);
                 if (!fontReady) {
                    await document.fonts.load(`normal ${MAX_FONT_SIZE}px ${CUSTOM_FONT_FAMILY}`);
                 }
            }

            const uploadedImageUrl = hasImage ? getPublicImageUrl(imagePath) : null;
            const templateImg = await loadImage(TEMPLATE_PATH);

            const canvas = document.createElement('canvas');
            canvas.width = CANVAS_SIZE;
            canvas.height = CANVAS_SIZE;
            const ctx = canvas.getContext('2d');
            
            // 2. 繪製底圖 (第一層)
            ctx.drawImage(templateImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            
            if (hasImage && uploadedImageUrl) {
                // 模式 A: 繪製投稿圖片 (圖片疊加)
                const uploadedImg = await loadImage(uploadedImageUrl);
                const uploadAspect = uploadedImg.width / uploadedImg.height;
                
                let drawWidth, drawHeight;
                const IMAGE_DRAW_SIZE = INNER_WIDTH;

                // 保持圖片比例，以 Fit 模式繪製在 INNER_WIDTH 區域
                if (uploadAspect > 1) { 
                    drawWidth = IMAGE_DRAW_SIZE;
                    drawHeight = IMAGE_DRAW_SIZE / uploadAspect;
                } else { 
                    drawHeight = IMAGE_DRAW_SIZE;
                    drawWidth = IMAGE_DRAW_SIZE * uploadAspect;
                }

                const centerX = CANVAS_SIZE / 2;
                const centerY = CANVAS_SIZE / 2;
                
                const startX = centerX - drawWidth / 2;
                const startY = centerY - drawHeight / 2;

                ctx.drawImage(uploadedImg, startX, startY, drawWidth, drawHeight);

            } else {
                // 模式 B: 繪製文字內容 (自動調整字體大小)
                const MAX_CONTENT_HEIGHT = INNER_WIDTH; 

                let currentFontSize = MAX_FONT_SIZE;
                let lines = [];
                let finalLineHeight = 0;
                let contentFits = false;

                // 1. 迭代調整字體大小，直到內容可以垂直容納
                while (currentFontSize >= MIN_FONT_SIZE) {
                    finalLineHeight = currentFontSize * LINE_HEIGHT_RATIO;
                    
                    // 設置當前字體
                    ctx.font = `normal ${currentFontSize}px ${CUSTOM_FONT_FAMILY}, "Helvetica", sans-serif`; 

                    // 重新換行
                    lines = wrapText(ctx, content, INNER_WIDTH);
                    
                    // 計算所需的總高度
                    const requiredHeight = lines.length * finalLineHeight;

                    if (requiredHeight <= MAX_CONTENT_HEIGHT) {
                        contentFits = true;
                        break; // 內容合適，停止縮小
                    }
                    
                    currentFontSize -= 2; // 縮小字體 (每次減少 2px)
                }

                if (!contentFits) {
                    // 如果縮到最小字體仍不合適，則使用最小字體，並裁切行數
                    currentFontSize = MIN_FONT_SIZE;
                    finalLineHeight = currentFontSize * LINE_HEIGHT_RATIO;
                    ctx.font = `normal ${currentFontSize}px ${CUSTOM_FONT_FAMILY}, "Helvetica", sans-serif`;
                    lines = wrapText(ctx, content, INNER_WIDTH); 
                }
                
                // 2. 確定繪製的行數和位置
                const maxDisplayLines = Math.floor(MAX_CONTENT_HEIGHT / finalLineHeight);
                const displayLines = lines.slice(0, maxDisplayLines);

                const finalDisplayHeight = displayLines.length * finalLineHeight;
                
                let startY = CANVAS_SIZE / 2 - finalDisplayHeight / 2; // 垂直居中
                
                ctx.fillStyle = '#333333'; 
                ctx.textAlign = 'center';


                displayLines.forEach((line, index) => {
                    // 調整 Y 座標，使其在行高中垂直居中
                    const y = startY + (index + 1) * finalLineHeight - (finalLineHeight - currentFontSize) / 2;
                    ctx.fillText(line, CANVAS_SIZE / 2, y); 
                });

                // 3. 提示內容被裁切
                if (lines.length > maxDisplayLines) {
                    ctx.font = 'normal 30px "Helvetica", sans-serif'; 
                    ctx.fillStyle = '#888888';
                    // 將提示文字放在底部的 padding 區域
                    ctx.fillText('... [內容過長，已裁切]', CANVAS_SIZE / 2, CANVAS_SIZE - PADDING + 30); 
                }
            }

            // 4. 輸出並下載
            const dataURL = canvas.toDataURL('image/jpeg', 0.95); 
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `IG_Synth_${postId.substring(0, 8)}_${hasImage ? 'Image' : 'Text'}.jpg`; 
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);


        } catch (e) {
            console.error('圖片/文字合成失敗:', e);
            setError(e.message || '合成時發生錯誤。請檢查底圖路徑和字體是否正確。');
        } finally {
            setDownloading(false);
        }
    };

    // --- 核心函數 2: 原始圖片下載 (僅限有圖片時) ---
    const handleDownloadRawImage = () => {
        if (!imagePath) return; 
        
        const uploadedImageUrl = getPublicImageUrl(imagePath);
        if (!uploadedImageUrl) return setError('無法獲取原始圖片 URL。');

        const link = document.createElement('a');
        link.href = uploadedImageUrl;
        link.download = `Raw_Post_${postId.substring(0, 8)}.jpg`; 
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const buttonText = hasImage 
        ? (downloading ? '⚙️ 正在合成圖片...' : '🖼️ 下載合成素材')
        : (downloading ? '⚙️ 正在合成文字圖...' : '📝 下載合成文字圖');
        
    const composerType = hasImage ? '圖片疊加模式' : '文字繪製模式';

    return (
        <div className="mt-4 border-t pt-4 border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">素材下載區:</p>
            <p className="text-xs text-gray-500 mb-2">模式: {composerType}</p>
            
            {/* 1. 合成素材下載按鈕 (無論有無圖片，合成後的結果) */}
            <button
                onClick={handleDownloadComposite}
                disabled={downloading}
                className="w-full py-2 px-4 bg-purple-600 text-white font-medium rounded-lg shadow-md hover:bg-purple-700 transition disabled:opacity-50 text-sm"
            >
                {buttonText}
            </button>
            
            {/* 2. 原始圖片下載按鈕 (僅當有圖片時顯示) */}
            {hasImage && (
                <button
                    onClick={handleDownloadRawImage}
                    className="w-full mt-2 py-2 px-4 bg-gray-500 text-white font-medium rounded-lg shadow-md hover:bg-gray-600 transition text-sm"
                >
                    ⬇️ 下載原始投稿圖片
                </button>
            )}
            
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
    );
}