'use client'

import { useState } from 'react'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    })
    const data = await res.json()

    if (res.ok) {
      setStatus('success')
      setMessage('Đăng ký thành công! Kiểm tra email để xác nhận.')
      setEmail('')
      setName('')
    } else {
      setStatus('error')
      setMessage(data.error || 'Đăng ký thất bại. Thử lại nhé!')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-8 text-sm text-purple-300">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Cập nhật mỗi ngày lúc 8:00 sáng
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            🛠️ Daily
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Tool</span>
            <br />Digest
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-4 leading-relaxed">
            Tin tức AI tool mới nhất mỗi ngày.
            <br />
            Tóm tắt bằng video ngắn. Gửi thẳng vào email.
          </p>

          <p className="text-slate-400 mb-12">
            Không cần lướt hàng chục trang tin — chúng tôi làm thay bạn.
          </p>

          {/* Subscribe Form */}
          {status === 'success' ? (
            <div className="bg-green-500/20 border border-green-500/40 rounded-2xl p-8">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-xl font-bold text-green-400 mb-2">Đã đăng ký thành công!</h3>
              <p className="text-slate-300">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3 max-w-md mx-auto w-full">
              <input
                type="text"
                placeholder="Tên của bạn (không bắt buộc)"
                value={name}
                onChange={e => setName(e.target.value)}
                className="px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-400 transition"
              />
              <input
                type="email"
                placeholder="Email của bạn *"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-400 transition"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Đang đăng ký...' : '📬 Đăng ký miễn phí'}
              </button>
              {status === 'error' && (
                <p className="text-red-400 text-sm text-center">{message}</p>
              )}
              <p className="text-slate-500 text-sm text-center">Miễn phí · Hủy bất cứ lúc nào</p>
            </form>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-100">
            Mỗi ngày bạn nhận được gì?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🔍',
                title: 'Scrape tự động',
                desc: 'Bot thu thập tin tức mới nhất từ Product Hunt, TechCrunch, The Rundown AI và nhiều nguồn khác.',
              },
              {
                icon: '🎬',
                title: 'Video tóm tắt AI',
                desc: 'Claude viết script, Luma AI tạo video ngắn 60-90 giây tóm tắt những tool nổi bật nhất.',
              },
              {
                icon: '📧',
                title: 'Gửi thẳng vào email',
                desc: 'Mỗi sáng 8h, email tóm tắt + link video đến thẳng hộp thư của bạn. Không cần tìm kiếm.',
              },
            ].map(f => (
              <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sources */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-400 mb-6">Nguồn dữ liệu tổng hợp từ</p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Product Hunt', 'TechCrunch AI', 'The Rundown AI', 'Toolify.ai'].map(s => (
              <span key={s} className="px-4 py-2 bg-white/10 rounded-full text-sm text-slate-300">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-slate-500 text-sm border-t border-white/10">
        <p>© 2025 Daily Tool Digest · Được xây dựng với Next.js + Claude + Luma AI</p>
      </footer>
    </main>
  )
}
