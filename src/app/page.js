// app/page.js (最終版 - 移除倒數日邏輯，新增獨立連結)
import Link from 'next/link';

// 頁面連結配置
const directoryLinks = [
  { href: '/submit', title: '🖊️ 前往匿名投稿', description: '發表您的文字或圖片內容' },
  { href: '/status', title: '🔍 查詢稿件狀態', description: '憑臨時用戶名和 ID 追蹤進度' },
  { href: '/delete-request', title: '🗑️ 請求刪除稿件', description: '提交刪除已投稿內容的申請' },
  { href: '/guidelines', title: '📄 投稿規範', description: '查閱平台的發文規定與守則' }, 
  // 💡 新增：倒數日頁面連結
  { href: '/countdown', title: '🗓️ 查看倒數日', description: '查看平台目前設定的公開倒數日' }, 
];

export default function DirectoryPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      
      {/* 標題區 */}
      <header className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-2">
          校園內容策展平台
        </h1>
        <p className="text-lg text-gray-500">
          請選擇您要進行的操作
        </p>
      </header>
      
      {/* 目錄連結卡片 */}
      <main className="w-full max-w-lg space-y-4">
        {directoryLinks.map((link) => (
          <Link 
            key={link.href} 
            href={link.href}
            className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.01] border border-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              {link.title}
            </h2>
            <p className="text-sm text-gray-500">
              {link.description}
            </p>
          </Link>
        ))}
      </main>

      {/* 底部資訊區 */}
      <footer className="mt-10 text-center">
        {/* 管理員登入連結 */}
        <Link href="/admin/login" className="text-sm text-gray-400 hover:text-indigo-600 transition">
          管理員登入
        </Link>
        <p className="text-xs text-gray-400 mt-2">
          © {currentYear} 校園內容策展平台. All rights reserved.
        </p>
      </footer>
    </div>
  );
}