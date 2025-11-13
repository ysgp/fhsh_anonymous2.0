// app/admin/components/AdminSidebar.js
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { href: '/admin/dashboard', icon: '🏠', label: '儀表板' },
    { href: '/admin/pending', icon: '📝', label: '待審核稿件' },
    { href: '/admin/approved', icon: '🖼️', label: '素材準備區' },
    { href: '/admin/delete-requests', icon: '🗑️', label: '刪除請求' },
    { href: '/admin/countdown', icon: '🗓️', label: '倒數日設定' },
    // 💡 登出功能
    { href: '/admin/logout', icon: '➡️', label: '登出', isLogout: true }, 
];

// Sidebar 接受 isOpen (是否開啟) 和 onClose (關閉函式)
export default function AdminSidebar({ isOpen, onClose }) {
    const pathname = usePathname();

    return (
        <>
            {/* 1. 遮罩層 (僅手機顯示，用於點擊關閉) */}
            <div 
                className={`fixed inset-0 bg-black/50 z-30 transition-opacity lg:hidden ${
                    isOpen ? 'opacity-100 visible' : 'opacity-0 hidden'
                }`}
                onClick={onClose}
            ></div>

            {/* 2. 側邊欄本體 */}
            <nav 
                className={`fixed inset-y-0 left-0 w-64 bg-gray-900 text-white z-40 transform lg:translate-x-0 transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full' // 實現收合效果
                }`}
            >
                <div className="p-4 flex flex-col h-full">
                    {/* 標題/Logo */}
                    <div className="text-xl font-bold mb-8 border-b border-gray-700 pb-4">
                        🧑‍💻 管理員中心
                    </div>

                    {/* 導航連結 */}
                    <ul className="space-y-2 flex-grow">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            
                            return (
                                <li key={item.href}>
                                    <Link 
                                        href={item.href}
                                        onClick={onClose} // 點擊後關閉側邊欄
                                        className={`flex items-center p-3 rounded-lg transition duration-150 ${
                                            isActive 
                                            ? 'bg-indigo-600 text-white shadow-lg' 
                                            : 'text-gray-300 hover:bg-gray-700'
                                        }`}
                                    >
                                        <span className="mr-3 text-lg">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    
                    {/* 底部資訊 */}
                    <div className="mt-8 text-xs text-gray-500 border-t border-gray-700 pt-4">
                        <p>Version 2.0 Admin</p>
                    </div>
                </div>
            </nav>
        </>
    );
}