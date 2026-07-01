'use client'

import { useState } from 'react'
import Image from 'next/image'

/* ── Watermark SVG (inline, không cần file) ── */
function WatermarkSVG() {
  return (
    <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* Orbit ring */}
      <ellipse cx="200" cy="210" rx="155" ry="48" stroke="url(#goldRing)" strokeWidth="8"
        fill="none" transform="rotate(-18 200 210)" />
      {/* A letter */}
      <text x="60" y="270" fontFamily="Georgia, serif" fontSize="220" fontWeight="900"
        fill="url(#goldA)" letterSpacing="-10">A</text>
      {/* i letter */}
      <text x="238" y="270" fontFamily="Georgia, serif" fontSize="220" fontWeight="900"
        fill="url(#goldI)" letterSpacing="0">i</text>
      {/* Dot on i */}
      <circle cx="292" cy="52" r="18" fill="url(#goldDot)" />
      {/* Star sparkle */}
      <g transform="translate(330,70)">
        <line x1="0" y1="-14" x2="0" y2="14" stroke="#FFD700" strokeWidth="2.5" />
        <line x1="-14" y1="0" x2="14" y2="0" stroke="#FFD700" strokeWidth="2.5" />
        <line x1="-9" y1="-9" x2="9" y2="9" stroke="#D4AF37" strokeWidth="1.5" />
        <line x1="9" y1="-9" x2="-9" y2="9" stroke="#D4AF37" strokeWidth="1.5" />
      </g>
      <defs>
        <linearGradient id="goldA" x1="60" y1="60" x2="220" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD700"/>
          <stop offset="50%" stopColor="#D4AF37"/>
          <stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
        <linearGradient id="goldI" x1="238" y1="60" x2="310" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E8E8E8"/>
          <stop offset="40%" stopColor="#C0C0C0"/>
          <stop offset="100%" stopColor="#909090"/>
        </linearGradient>
        <linearGradient id="goldDot" x1="274" y1="34" x2="310" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD700"/>
          <stop offset="100%" stopColor="#B8860B"/>
        </linearGradient>
        <linearGradient id="goldRing" x1="45" y1="162" x2="355" y2="258" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B6914"/>
          <stop offset="40%" stopColor="#D4AF37"/>
          <stop offset="60%" stopColor="#FFD700"/>
          <stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ── Logo với fallback ── */
function Logo({ size = 180, className = '' }: { size?: number; className?: string }) {
  const [err, setErr] = useState(false)
  if (err) return (
    <div style={{ width: size, height: size }}>
      <WatermarkSVG />
    </div>
  )
  return (
    <Image src="/logo.png" alt="AI Connect Daily" width={size} height={size}
      className={`logo-blend ${className}`} priority onError={() => setErr(true)} />
  )
}

/* ── Payment modal ── */
function PaymentModal({ plan, onClose }: { plan: 'monthly' | 'yearly'; onClose: () => void }) {
  const [tab, setTab] = useState<'stripe' | 'momo' | 'bank' | 'zalo'>('stripe')
  const price = plan === 'monthly' ? '$9' : '$50'
  const label = plan === 'monthly' ? 'Gói Tháng' : 'Gói Năm'

  const tabs = [
    { id: 'stripe', label: '💳 Thẻ quốc tế' },
    { id: 'momo',   label: '📱 MoMo' },
    { id: 'bank',   label: '🏦 Ngân hàng' },
    { id: 'zalo',   label: '💬 Zalo' },
  ] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0D0D0D', border: '1px solid rgba(212,175,55,0.3)' }}>
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
          <div>
            <p className="text-xs tracking-widest uppercase" style={{ color: '#D4AF37' }}>Thanh toán</p>
            <p className="text-white font-bold">{label} — {price}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-3 text-xs font-semibold transition"
              style={{
                color: tab === t.id ? '#D4AF37' : 'rgba(212,175,55,0.4)',
                borderBottom: tab === t.id ? '2px solid #D4AF37' : '2px solid transparent',
                background: 'transparent',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === 'stripe' && (
            <div className="text-center space-y-4">
              <p className="text-sm" style={{ color: '#C9A96E' }}>Thanh toán an toàn bằng thẻ Visa / Mastercard / Amex</p>
              <a href="#" onClick={e => e.preventDefault()}
                className="block w-full py-4 rounded-xl font-bold text-black text-base tracking-wider transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #B8860B, #D4AF37, #FFD700, #D4AF37, #B8860B)' }}>
                Thanh toán {price} qua Stripe →
              </a>
              <p className="text-xs" style={{ color: 'rgba(212,175,55,0.4)' }}>🔒 Bảo mật 256-bit SSL · Hủy bất cứ lúc nào</p>
            </div>
          )}

          {tab === 'momo' && (
            <div className="text-center space-y-4">
              <p className="text-sm mb-3" style={{ color: '#C9A96E' }}>Quét mã MoMo hoặc chuyển đến số điện thoại</p>
              <div className="mx-auto w-40 h-40 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(212,175,55,0.05)', border: '1px dashed rgba(212,175,55,0.3)' }}>
                <span className="text-xs text-center" style={{ color: 'rgba(212,175,55,0.4)' }}>QR Code<br/>MoMo<br/>(cập nhật sau)</span>
              </div>
              <div className="rounded-xl p-4 text-left space-y-1"
                style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                <p className="text-xs" style={{ color: 'rgba(212,175,55,0.5)' }}>SĐT nhận tiền MoMo</p>
                <p className="text-white font-bold tracking-wider">[Số điện thoại MoMo]</p>
                <p className="text-xs" style={{ color: 'rgba(212,175,55,0.5)' }}>Nội dung: AI CONNECT {plan.toUpperCase()} [email]</p>
              </div>
            </div>
          )}

          {tab === 'bank' && (
            <div className="space-y-3">
              <p className="text-sm text-center mb-3" style={{ color: '#C9A96E' }}>Chuyển khoản ngân hàng nội địa</p>
              {[
                ['Ngân hàng', '[Tên ngân hàng]'],
                ['Số tài khoản', '[Số tài khoản]'],
                ['Tên chủ TK', '[Tên chủ tài khoản]'],
                ['Số tiền', plan === 'monthly' ? '~225,000đ' : '~1,250,000đ'],
                ['Nội dung CK', `AICD ${plan.toUpperCase()} [email của bạn]`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2"
                  style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
                  <span className="text-xs" style={{ color: 'rgba(212,175,55,0.5)' }}>{label}</span>
                  <span className="text-sm text-white font-medium">{value}</span>
                </div>
              ))}
              <p className="text-xs text-center pt-2" style={{ color: 'rgba(212,175,55,0.4)' }}>
                Sau khi chuyển khoản, nhắn Zalo để kích hoạt trong 1h
              </p>
            </div>
          )}

          {tab === 'zalo' && (
            <div className="text-center space-y-4">
              <p className="text-sm" style={{ color: '#C9A96E' }}>Nhắn tin để đăng ký thủ công — hỗ trợ 24/7</p>
              <a href="https://zalo.me/0000000000" target="_blank" rel="noopener noreferrer"
                className="block w-full py-4 rounded-xl font-bold text-black tracking-wider transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #B8860B, #D4AF37, #FFD700, #D4AF37, #B8860B)' }}>
                💬 Nhắn Zalo ngay →
              </a>
              <p className="text-xs" style={{ color: 'rgba(212,175,55,0.4)' }}>
                Ghi rõ: &quot;Đăng ký {label}&quot; — Admin sẽ phản hồi trong 30 phút
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function SalesPage() {
  const [modal, setModal] = useState<null | 'monthly' | 'yearly'>(null)

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ── Watermark ── */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden select-none">
        <div style={{ width: 600, height: 600, opacity: 0.038, mixBlendMode: 'screen' }}>
          <WatermarkSVG />
        </div>
      </div>

      {/* ── BG glow ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(ellipse, #D4AF37 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 right-[-200px] w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #D4AF37 0%, transparent 70%)' }} />
      </div>

      {/* ════════════════════════════════════
          HERO
      ════════════════════════════════════ */}
      <section className="relative pt-16 pb-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-4 float-anim">
            <Logo size={160} />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest uppercase gold-border"
            style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            Cập nhật mỗi ngày lúc 3:00 chiều
          </div>

          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            <span className="gold-shimmer">Dẫn đầu về AI</span>
            <br />
            <span className="text-white">trong 5 phút mỗi ngày</span>
          </h1>

          <p className="text-lg mb-2" style={{ color: '#C9A96E' }}>
            Mỗi chiều 3h — AI tự động thu thập, tóm tắt và gửi thẳng vào inbox của bạn.
          </p>
          <p className="text-sm mb-8" style={{ color: 'rgba(212,175,55,0.45)' }}>
            Không cần lướt hàng chục trang tin. Không bỏ lỡ tool nào quan trọng.
          </p>

          <button onClick={() => { const el = document.getElementById('pricing'); el?.scrollIntoView({ behavior: 'smooth' }) }}
            className="px-10 py-4 rounded-xl font-bold text-black text-base tracking-widest uppercase transition hover:opacity-90 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #B8860B 0%, #D4AF37 40%, #FFD700 60%, #D4AF37 80%, #B8860B 100%)', boxShadow: '0 0 40px rgba(212,175,55,0.35)' }}>
            ✦ Xem gói membership
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════
          NUMBERS
      ════════════════════════════════════ */}
      <section className="py-10 px-4" style={{ borderTop: '1px solid rgba(212,175,55,0.1)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { n: '500+', label: 'Members đang theo dõi' },
            { n: '365', label: 'Ngày cập nhật / năm' },
            { n: '4+', label: 'Nguồn AI hàng đầu' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-black gold-shimmer">{s.n}</p>
              <p className="text-xs mt-1 tracking-wide" style={{ color: 'rgba(212,175,55,0.5)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════
          PAIN POINTS
      ════════════════════════════════════ */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#D4AF37' }}>Vấn đề bạn đang gặp</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-white">
            AI thay đổi mỗi ngày —<br />bạn có đang bị bỏ lại phía sau?
          </h2>
          <div className="space-y-3">
            {[
              'Quá nhiều tool mới ra mỗi ngày, không biết cái nào đáng dùng',
              'Không có thời gian đọc hàng chục trang tin công nghệ',
              'Competitor của bạn đang dùng AI để làm việc nhanh hơn bạn',
              'Bỏ lỡ tool quan trọng = bỏ lỡ lợi thế cạnh tranh',
            ].map(p => (
              <div key={p} className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)' }}>
                <span style={{ color: '#D4AF37', flexShrink: 0 }}>✗</span>
                <p className="text-sm" style={{ color: '#C9A96E' }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          BENEFITS
      ════════════════════════════════════ */}
      <section className="py-16 px-4" style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#D4AF37' }}>Khi bạn là member</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-white">Mỗi ngày bạn nhận được</h2>
          <div className="flex justify-center mb-10">
            <div className="h-px w-20" style={{ background: 'linear-gradient(to right, transparent, #D4AF37, transparent)' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '📰', title: 'Bản tin AI hàng ngày', desc: 'Top 5-8 tool & tin tức AI nổi bật nhất — được lọc thủ công từ Product Hunt, TechCrunch, The Rundown AI...' },
              { icon: '🎬', title: 'Video tóm tắt 90 giây', desc: 'Claude viết script, Luma AI tạo video. Xem xong trong lúc uống cà phê, nắm ngay điểm quan trọng nhất.' },
              { icon: '⚡', title: 'Giao hàng đúng 3:00 chiều', desc: 'Tự động, đúng giờ, không cần nhớ. Inbox của bạn = trung tâm cập nhật AI cá nhân.' },
              { icon: '🔍', title: 'Phân tích sâu (bonus)', desc: 'Những tool thực sự đáng dùng — kèm hướng dẫn ứng dụng ngay vào công việc.' },
              { icon: '🌐', title: '4 nguồn tổng hợp', desc: 'Product Hunt · TechCrunch AI · The Rundown AI · Toolify.ai — tất cả trong 1 email duy nhất.' },
              { icon: '🔒', title: 'Hủy bất cứ lúc nào', desc: 'Không ràng buộc, không phức tạp. Hủy 1 click nếu bạn không hài lòng.' },
            ].map(b => (
              <div key={b.title} className="flex gap-4 p-5 rounded-xl transition-all duration-300 group gold-border"
                style={{ background: 'rgba(0,0,0,0.5)' }}>
                <span className="text-2xl shrink-0 mt-0.5">{b.icon}</span>
                <div>
                  <p className="font-bold text-white mb-1">{b.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(212,175,55,0.6)' }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          PRICING
      ════════════════════════════════════ */}
      <section id="pricing" className="py-20 px-4" style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#D4AF37' }}>Membership</p>
          <h2 className="text-3xl md:text-4xl font-black text-center mb-2 text-white">Chọn gói phù hợp</h2>
          <p className="text-center text-sm mb-12" style={{ color: 'rgba(212,175,55,0.45)' }}>
            Giá tính bằng USD · Thanh toán 1 lần · Kích hoạt ngay
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Monthly */}
            <div className="rounded-2xl p-7 gold-border relative"
              style={{ background: 'rgba(0,0,0,0.7)' }}>
              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'rgba(212,175,55,0.5)' }}>Gói tháng</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-black gold-shimmer">$9</span>
                <span className="text-sm pb-2" style={{ color: 'rgba(212,175,55,0.5)' }}>/tháng</span>
              </div>
              <p className="text-xs mb-6" style={{ color: 'rgba(212,175,55,0.35)' }}>Linh hoạt, hủy bất cứ lúc nào</p>
              <ul className="space-y-2.5 mb-8">
                {['Bản tin AI hàng ngày', 'Video tóm tắt 90 giây', 'Giao lúc 3:00 chiều', '4 nguồn tổng hợp', 'Hủy bất cứ lúc nào'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: '#C9A96E' }}>
                    <span style={{ color: '#D4AF37' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => setModal('monthly')}
                className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wider uppercase transition hover:opacity-90"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37' }}>
                Đăng ký tháng →
              </button>
            </div>

            {/* Yearly — highlighted */}
            <div className="rounded-2xl p-7 relative overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #0D0900, #1A1000)', border: '1px solid #D4AF37', boxShadow: '0 0 50px rgba(212,175,55,0.2)' }}>
              {/* Best value badge */}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-black tracking-wider"
                style={{ background: 'linear-gradient(135deg, #B8860B, #FFD700)' }}>
                BEST VALUE
              </div>

              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#D4AF37' }}>Gói năm</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-black gold-shimmer">$50</span>
                <span className="text-sm pb-2" style={{ color: 'rgba(212,175,55,0.6)' }}>/năm</span>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs line-through" style={{ color: 'rgba(212,175,55,0.3)' }}>$108</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>
                  Tiết kiệm $58
                </span>
              </div>

              <ul className="space-y-2.5 mb-8">
                {['Tất cả tính năng gói tháng', 'Tiết kiệm $58 so với tháng', '12 tháng không lo gia hạn', 'Ưu tiên hỗ trợ VIP', 'Bonus tài nguyên AI độc quyền'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white">
                    <span style={{ color: '#D4AF37' }}>✦</span> {f}
                  </li>
                ))}
              </ul>

              <button onClick={() => setModal('yearly')}
                className="w-full py-4 rounded-xl font-bold text-black text-base tracking-widest uppercase transition hover:opacity-90 hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #B8860B 0%, #D4AF37 40%, #FFD700 60%, #D4AF37 80%, #B8860B 100%)', boxShadow: '0 4px 24px rgba(212,175,55,0.4)' }}>
                ✦ Đăng ký năm ngay
              </button>
              <p className="text-center text-xs mt-3" style={{ color: 'rgba(212,175,55,0.4)' }}>Tương đương ~$4.2/tháng</p>
            </div>
          </div>

          {/* Payment icons */}
          <div className="mt-10 text-center">
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'rgba(212,175,55,0.4)' }}>Phương thức thanh toán</p>
            <div className="flex justify-center gap-3 flex-wrap">
              {['💳 Thẻ quốc tế (Stripe)', '📱 MoMo', '🏦 Chuyển khoản', '💬 Zalo'].map(m => (
                <span key={m} className="px-4 py-2 rounded-full text-xs"
                  style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', color: '#C9A96E' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          FAQ
      ════════════════════════════════════ */}
      <section className="py-16 px-4" style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#D4AF37' }}>FAQ</p>
          <h2 className="text-2xl font-bold text-center text-white mb-10">Câu hỏi thường gặp</h2>
          <div className="space-y-3">
            {[
              { q: 'Tôi nhận được gì sau khi đăng ký?', a: 'Ngay sau khi xác nhận thanh toán, bạn được thêm vào danh sách. Email đầu tiên sẽ đến vào chiều hôm đó lúc 3:00 (hoặc hôm sau nếu đã qua 3h).' },
              { q: 'Video AI trông như thế nào?', a: 'Video ngắn 60-90 giây do Luma AI tạo từ script viết bởi Claude — tóm tắt 3-5 tool nổi bật nhất trong ngày, kèm hình ảnh minh họa.' },
              { q: 'Có thể hủy không? Có mất tiền không?', a: 'Gói tháng: hủy bất kỳ lúc nào, không thu thêm. Gói năm: thanh toán 1 lần, không hoàn tiền nhưng không tự gia hạn.' },
              { q: 'Nội dung có phù hợp cho người mới bắt đầu không?', a: 'Có. Nội dung được viết đơn giản, dễ hiểu cho cả người mới lẫn người đã có kinh nghiệm với AI.' },
              { q: 'Tôi muốn dùng thử trước khi mua?', a: 'Nhắn Zalo để nhận 3 ngày trải nghiệm miễn phí. Không cần thẻ ngân hàng.' },
            ].map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════ */}
      <section className="py-20 px-4 text-center" style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }}>
        <div className="max-w-xl mx-auto">
          <Logo size={80} className="mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-4xl font-black mb-3">
            <span className="gold-shimmer">Bắt đầu dẫn đầu AI</span>
            <br /><span className="text-white text-2xl">từ chiều hôm nay</span>
          </h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(212,175,55,0.5)' }}>
            Chỉ $9/tháng · Hủy bất cứ lúc nào · Kích hoạt ngay
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setModal('yearly')}
              className="px-8 py-4 rounded-xl font-bold text-black tracking-widest uppercase transition hover:opacity-90 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #B8860B, #D4AF37, #FFD700, #D4AF37, #B8860B)', boxShadow: '0 0 40px rgba(212,175,55,0.3)' }}>
              ✦ Gói Năm — $50
            </button>
            <button onClick={() => setModal('monthly')}
              className="px-8 py-4 rounded-xl font-bold tracking-widest uppercase transition hover:opacity-90"
              style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}>
              Gói Tháng — $9
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center" style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
        <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(212,175,55,0.25)' }}>
          © 2025 AI Connect Daily · Kết nối – Ứng dụng – Dẫn đầu
        </p>
      </footer>

      {/* Payment modal */}
      {modal && <PaymentModal plan={modal} onClose={() => setModal(null)} />}
    </main>
  )
}

/* ── FAQ accordion item ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{ background: 'rgba(212,175,55,0.04)', border: `1px solid ${open ? 'rgba(212,175,55,0.35)' : 'rgba(212,175,55,0.1)'}` }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition"
        style={{ color: open ? '#D4AF37' : '#C9A96E' }}>
        <span className="text-sm font-semibold">{q}</span>
        <span className="text-lg shrink-0 ml-3 transition-transform" style={{ transform: open ? 'rotate(45deg)' : 'none', color: '#D4AF37' }}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(212,175,55,0.6)' }}>{a}</p>
        </div>
      )}
    </div>
  )
}
