// app/admin/layout.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

// 管理員菜單配置 (已新增刪除請求和倒數日設定)
const adminNavLinks = [
  { href: '/admin/dashboard', title: '🏠 儀表板' },
  { href: '/admin/pending', title: '📝 待審核列表' },
  { href: '/admin/approved', title: '📦 素材準備區' },
  { href: '/admin/delete-requests', title: '🗑️ 刪除請求' }, // 新增
  { href: '/admin/countdown', title: '🗓️ 倒數日設定' }, // 新增
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  
  // 🚨 側邊欄狀態：預設在手機上收合 (false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // 每次切換路由時，在手機上自動關閉側邊欄
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);


  // 權限檢查邏輯 (保留您原本的邏輯)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (pathname !== '/admin/login') {
          router.replace('/admin/login');
        }
      } 
      else if (pathname === '/admin/login') {
        router.replace('/admin/dashboard');
      }
      
      setLoading(false);
    };

    checkAuth();
    
    // 監聽 Auth 狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/admin/login');
      } else if (pathname === '/admin/login') {
        router.replace('/admin/dashboard');
      }
    });

    return () => subscription.unsubscribe(); 

  }, [router, pathname]);


  // 如果正在檢查權限，顯示載入畫面
  if (loading && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-indigo-600">載入中，正在檢查管理員權限...</p>
      </div>
    );
  }

  // 如果是登入頁，直接渲染子內容
  if (pathname === '/admin/login') {
      return <>{children}</>;
  }


  // 後台主介面佈局
  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* 🚨 1. 遮罩層 (僅手機顯示，點擊關閉) */}
      <div 
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity lg:hidden ${
          isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 hidden'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      
      {/* 🚨 2. 側邊欄導航 (Sidebar) */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-indigo-700 text-white flex flex-col p-4 shadow-lg z-40 
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 ${ // 大螢幕永遠顯示
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full' // 手機控制收合
          }`}
      >
        <h2 className="text-2xl font-bold mb-8 border-b border-indigo-500 pb-3">管理中心</h2>
        <nav className="flex-grow space-y-2">
          {adminNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsSidebarOpen(false)} // 點擊後關閉手機側邊欄
              className={`block px-4 py-2 rounded-lg transition duration-150 ${
                pathname.startsWith(link.href) ? 'bg-indigo-500 font-bold' : 'hover:bg-indigo-600'
              }`}
            >
              {link.title}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition duration-150"
        >
          登出
        </button>
      </aside>

      {/* 🚨 3. 頂部導航/漢堡按鈕 (Mobile Header) */}
      {/* 只有在非登入頁 (pathname !== '/admin/login') 且螢幕尺寸為手機時顯示 */}
      <header className="sticky top-0 bg-white shadow p-4 lg:hidden z-20">
          <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-800">
                  管理員面板
              </h1>
              <button 
                  onClick={toggleSidebar}
                  className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                  aria-label="Toggle menu"
              >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                  </svg>
              </button>
          </div>
      </header>

      {/* 🚨 4. 內容區 (Main Content) */}
      {/* lg:ml-64 讓大螢幕的內容區騰出側邊欄的空間 */}
      <main className="lg:ml-64 flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}