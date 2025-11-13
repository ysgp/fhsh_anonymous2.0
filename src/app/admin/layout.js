// app/admin/layout.js
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

// 管理員菜單配置
const adminNavLinks = [
  { href: '/admin/dashboard', title: '🏠 儀表板' },
  { href: '/admin/pending', title: '📝 待審核列表' },
  { href: '/admin/approved', title: '📦 素材準備區' },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // 權限檢查邏輯
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // 如果沒有 session，且當前不在登入頁，則重定向到登入頁
        if (pathname !== '/admin/login') {
          router.replace('/admin/login');
        }
      } 
      // 如果在登入頁，且已經有 session，則重定向到儀表板
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

    return () => subscription.unsubscribe(); // 清理訂閱

  }, [router, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  // 如果正在檢查權限，顯示載入畫面
  if (loading && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-indigo-600">載入中，正在檢查管理員權限...</p>
      </div>
    );
  }

  // 如果是登入頁，直接渲染子內容（讓登入表單顯示）
  if (pathname === '/admin/login') {
      return <>{children}</>;
  }


  // 後台主介面佈局
  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* 側邊欄導航 */}
      <aside className="w-64 bg-indigo-700 text-white flex flex-col p-4 shadow-lg">
        <h2 className="text-2xl font-bold mb-8 border-b border-indigo-500 pb-3">管理中心</h2>
        <nav className="flex-grow space-y-2">
          {adminNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
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

      {/* 內容區 */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}