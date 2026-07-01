'use client'

import { useState } from 'react'
import Image from 'next/image'

function Logo({ size = 220, className = '' }: { size?: number; className?: string }) {
  const [error, setError] = useState(false)
  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size * 0.45 }}>
        <span className="gold-shimmer font-black tracking-widest text-4xl">Ai</span>
      </div>
    )
  }
  return (
    <Image src="/logo.png" alt="AI Connect Daily" width={size} height={size}
      className={`logo-blend ${className}`} priority onError={() => setError(true)} />
  )
}

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
    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* ── Background radial glow ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, #D4AF37 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(ellipse, #D4AF37 0%, transparent 70%)' }} />
      </div>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="max-w-2xl mx-auto w-full">

          {/* Logo */}
          <div className="float-anim mb-2 flex justify-center">
            <Logo size={220} />
          </div>

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-semibold tracking-widest uppercase gold-border"
            style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            Cập nhật mỗi ngày lúc 3:00 chiều
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight tracking-tight">
            <span className="gold-shimmer">AI Connect Daily</span>
          </h1>

          <p className="text-lg md:text-xl mb-3 leading-relaxed" style={{ color: '#C9A96E' }}>
            Cập nhật AI mới nhất · Kết nối · Ứng dụng · Dẫn đầu
          </p>

          <p className="text-sm mb-10 tracking-wide" style={{ color: 'rgba(212,175,55,0.5)' }}>
            Tin tức AI tool mỗi ngày — tóm tắt bằng video ngắn — gửi thẳng vào email của bạn
          </p>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-10">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.4))' }} />
            <span style={{ color: '#D4AF37', fontSize: 18 }}>✦</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(212,175,55,0.4))' }} />
          </div>

          {/* Subscribe Form */}
          {status === 'success' ? (
            <div className="rounded-2xl p-8 gold-border gold-glow"
              style={{ background: 'rgba(212,175,55,0.08)' }}>
              <p className="text-2xl mb-3">✦</p>
              <h3 className="text-xl font-bold mb-2 gold-shimmer">Chào mừng bạn!</h3>
              <p style={{ color: '#C9A96E' }}>{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3 w-full">
              <input
                type="text"
                placeholder="Họ tên của bạn (không bắt buộc)"
                value={name}
                onChange={e => setName(e.target.value)}
                className="px-5 py-4 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none transition"
                style={{
                  background: 'rgba(212,175,55,0.06)',
                  border: '1px solid rgba(212,175,55,0.25)',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.7)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.25)')}
              />
              <input
                type="email"
                placeholder="Email của bạn *"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="px-5 py-4 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none transition"
                style={{
                  background: 'rgba(212,175,55,0.06)',
                  border: '1px solid rgba(212,175,55,0.25)',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(212,175,55,0.7)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(212,175,55,0.25)')}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-8 py-4 rounded-xl font-bold text-base tracking-widest uppercase transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #B8860B 0%, #D4AF37 40%, #FFD700 60%, #D4AF37 80%, #B8860B 100%)',
                  color: '#000',
                  boxShadow: '0 0 30px rgba(212,175,55,0.3)',
                }}
              >
                {status === 'loading' ? 'Đang đăng ký...' : '✦ Đăng ký miễn phí'}
              </button>
              {status === 'error' && (
                <p className="text-red-400 text-sm text-center">{message}</p>
              )}
              <p className="text-xs tracking-widest uppercase text-center" style={{ color: 'rgba(212,175,55,0.4)' }}>
                Miễn phí · Bảo mật · Hủy bất cứ lúc nào
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#D4AF37' }}>Mỗi ngày bạn nhận được</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Trọn bộ AI Intelligence</h2>
            <div className="flex justify-center mt-4">
              <div className="h-px w-24" style={{ background: 'linear-gradient(to right, transparent, #D4AF37, transparent)' }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '⚡',
                title: 'Scrape tự động',
                desc: 'Bot thu thập tin tức mới nhất từ Product Hunt, TechCrunch, The Rundown AI và nhiều nguồn hàng đầu thế giới.',
                tag: 'Auto',
              },
              {
                icon: '🎬',
                title: 'Video AI tóm tắt',
                desc: 'Claude AI viết script, Luma AI tạo video ngắn 60–90 giây cô đọng những tool nổi bật nhất trong ngày.',
                tag: 'AI Generated',
              },
              {
                icon: '📩',
                title: 'Thẳng vào inbox',
                desc: 'Mỗi chiều 3h, email tóm tắt + link video gửi thẳng đến bạn. Không cần tìm kiếm, không bỏ lỡ.',
                tag: 'Daily 15:00',
              },
            ].map(f => (
              <div
                key={f.title}
                className="rounded-2xl p-6 gold-border transition-all duration-300 group relative overflow-hidden"
                style={{ background: 'rgba(0,0,0,0.6)' }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                  style={{ background: 'radial-gradient(ellipse at top, rgba(212,175,55,0.08) 0%, transparent 70%)' }} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{f.icon}</span>
                    <span className="text-xs px-2 py-1 rounded-full font-semibold tracking-widest uppercase"
                      style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(212,175,55,0.6)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sources ── */}
      <section className="py-16 px-4" style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase mb-8" style={{ color: 'rgba(212,175,55,0.5)' }}>
            Nguồn dữ liệu tổng hợp từ
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Product Hunt', 'TechCrunch AI', 'The Rundown AI', 'Toolify.ai'].map(s => (
              <span
                key={s}
                className="px-4 py-2 rounded-full text-sm font-medium tracking-wide"
                style={{
                  background: 'rgba(212,175,55,0.06)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: '#C9A96E',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-4 text-center" style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }}>
        <div className="mb-4 flex justify-center">
          <Logo size={48} className="opacity-60" />
        </div>
        <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(212,175,55,0.3)' }}>
          © 2025 AI Connect Daily · Kết nối – Ứng dụng – Dẫn đầu
        </p>
      </footer>
    </main>
  )
}
