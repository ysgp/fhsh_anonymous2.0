// app/submit-guide/page.js
import Link from 'next/link';

export default function SubmitGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-2xl border-t-4 border-indigo-600">
        
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            📋 投稿規範與要求
          </h1>
          <p className="text-lg text-gray-600">
            請仔細閱讀以下所有規範，確保您的投稿能夠順利通過審核。
          </p>
        </header>

        {/* 規範區塊 */}
        <section className="space-y-8">
          
          <div className="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-500">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-3">
              1. 內容原則
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>內容必須與校園生活、課程、活動或學生日常相關。</li>
              <li>嚴禁涉及人身攻擊、歧視、色情、暴力等違反法律或善良風俗的內容。</li>
              <li>禁止政治宣傳或未經授權的商業廣告。</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
            <h2 className="text-2xl font-semibold text-yellow-700 mb-3">
              2. 格式要求
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>**文字內容：** 請控制在 200 字以內，確保標點符號及語句完整。</li>
              <li>**圖片素材：** 圖片必須清晰且具有版權。若附帶圖片，我們將使用它作為社群貼文的主要視覺。建議圖片比例接近 1:1 或 4:5。</li>
              <li>請務必提供您的 **IG 帳號**作為聯絡方式或標記創作者。</li>
            </ul>
          </div>

          <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
            <h2 className="text-2xl font-semibold text-red-700 mb-3">
              3. 審核與發布
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>所有投稿內容都將經過管理員人工審核，審核結果以電子郵件或您提供的聯絡方式通知。</li>
              <li>**刪除請求：** 如果您的貼文已經發布並需要刪除，請使用專門的
                <Link href="/delete-request" className="text-red-600 hover:underline font-bold ml-1">
                  貼文刪除請求頁面
                </Link>
                進行申請。
              </li>
              <li>投稿即代表同意平台在審核通過後，對內容進行必要的編輯和排版以符合社群風格。</li>
            </ul>
          </div>

        </section>

        <footer className="mt-10 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            感謝您對校園內容平台的貢獻！
          </p>
        </footer>

      </div>
    </div>
  );
}