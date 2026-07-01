'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'

const PLAN_VND: Record<string, number> = { starter: 125000, popular: 375000, yearly: 2475000 }
const PLAN_USD: Record<string, string> = { starter: '$5', popular: '$15', yearly: '$99' }
const PLAN_LABEL: Record<string, string> = { starter: 'Gói Trải Nghiệm', popular: 'Gói Phổ Biến', yearly: 'Gói Hàng Năm' }
function fmtVnd(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

/* ── Inline QR Payment Section ── */
function InlinePayment() {
  const [plan, setPlan]         = useState<'starter' | 'popular' | 'yearly'>('popular')
  const [email, setEmail]       = useState('')
  const [qrUrl, setQrUrl]       = useState('')
  const [orderCode, setOrderCode] = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [copied, setCopied]     = useState(false)
  const [tab, setTab]           = useState<'bank' | 'momo'>('bank')
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null)

  const vnd = PLAN_VND[plan]

  // QR không cần order code — dùng VietQR trực tiếp theo số tiền
  const staticQr = `https://img.vietqr.io/image/ACB-36998866-compact2.png?amount=${vnd}&addInfo=${encodeURIComponent('AICD ' + plan.toUpperCase())}&accountName=${encodeURIComponent('LE THI THAO')}`

  // Khi có email hợp lệ → gọi /api/checkout để sinh order code cá nhân
  const generateOrder = useCallback(async (emailVal: string, planVal: string) => {
    if (!emailVal.includes('@') || !emailVal.includes('.')) {
      setQrUrl('')
      setOrderCode('')
      return
    }
    setLoading(true)
    try {
      const res  = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: emailVal, plan: planVal }),
      })
      const data = await res.json()
      if (data.orderCode) {
        setOrderCode(data.orderCode)
        setQrUrl(data.qrUrl)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => generateOrder(email, plan), 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [email, plan, generateOrder])

  const displayQr   = qrUrl || staticQr
  const displayCode = orderCode || `AICD ${plan.toUpperCase()}`

  const copy = () => {
    navigator.clipboard.writeText(displayCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const plans = [
    { id: 'starter' as const,  label: 'Trải Nghiệm', price: '$5' },
    { id: 'popular' as const,  label: 'Phổ Biến',     price: '$15' },
    { id: 'yearly'  as const,  label: 'Hàng Năm',     price: '$99' },
  ]

  return (
    <section id="payment" className="py-20 px-4" style={{ borderTop: '1px solid rgba(212,175,55,0.12)' }}>
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#D4AF37' }}>Thanh Toán</p>
        <h2 className="text-3xl md:text-4xl font-black text-center mb-2 text-white">Quét QR — Kích hoạt ngay</h2>
        <p className="text-center text-sm mb-10" style={{ color: 'rgba(212,175,55,0.45)' }}>
          Chọn gói · Nhập email · Quét QR chuyển khoản · Hệ thống tự động kích hoạt
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* ── LEFT: Plan + Email ── */}
          <div className="space-y-5">
            {/* Plan selector */}
            <div>
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(212,175,55,0.5)' }}>1. Chọn gói</p>
              <div className="grid grid-cols-3 gap-2">
                {plans.map(p => (
                  <button key={p.id} onClick={() => setPlan(p.id)}
                    className="rounded-xl py-3 px-2 text-center transition-all"
                    style={{
                      background: plan === p.id ? 'linear-gradient(135deg,#B8860B,#D4AF37,#FFD700)' : 'rgba(212,175,55,0.06)',
                      border: plan === p.id ? '1px solid #FFD700' : '1px solid rgba(212,175,55,0.2)',
                      color: plan === p.id ? '#000' : '#C9A96E',
                      boxShadow: plan === p.id ? '0 0 20px rgba(212,175,55,0.3)' : 'none',
                    }}>
                    <p className="text-xs font-semibold">{p.label}</p>
                    <p className="text-lg font-black">{p.price}</p>
                    <p className="text-xs opacity-70">{fmtVnd(PLAN_VND[p.id])}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Email input */}
            <div>
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(212,175,55,0.5)' }}>2. Nhập email nhận bản tin</p>
              <input
                type="email"
                placeholder="email@của-bạn.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-white text-sm focus:outline-none transition"
                style={{
                  background: 'rgba(212,175,55,0.06)',
                  border: email.includes('@') ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(212,175,55,0.2)',
                }}
              />
              {loading && (
                <p className="text-xs mt-2" style={{ color: 'rgba(212,175,55,0.5)' }}>⏳ Đang tạo mã riêng cho bạn...</p>
              )}
              {orderCode && !loading && (
                <p className="text-xs mt-2" style={{ color: '#4ade80' }}>✓ Mã đơn đã sẵn sàng — QR cập nhật tự động</p>
              )}
            </div>

            {/* Order code + copy */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <p className="text-xs mb-2" style={{ color: 'rgba(212,175,55,0.5)' }}>3. Nội dung chuyển khoản (ghi đúng)</p>
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono font-bold text-sm" style={{ color: '#FFD700' }}>{displayCode}</p>
                <button onClick={copy}
                  className="text-xs px-3 py-1.5 rounded-lg shrink-0 transition"
                  style={{
                    background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(212,175,55,0.12)',
                    border: '1px solid rgba(212,175,55,0.25)',
                    color: copied ? '#4ade80' : '#D4AF37',
                  }}>
                  {copied ? '✓ Đã copy' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Bank info */}
            <div className="space-y-0 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
              {[
                ['Ngân hàng', 'ACB'],
                ['Số tài khoản', '7326 6666 686'],
                ['Chủ tài khoản', 'PHẠM THỊ THÚY NGÂN'],
                ['Số tiền', fmtVnd(vnd)],
              ].map(([k, v], i) => (
                <div key={k} className="flex justify-between items-center px-4 py-3"
                  style={{ background: i % 2 === 0 ? 'rgba(212,175,55,0.04)' : 'rgba(0,0,0,0.3)', borderBottom: i < 3 ? '1px solid rgba(212,175,55,0.07)' : 'none' }}>
                  <span className="text-xs" style={{ color: 'rgba(212,175,55,0.5)' }}>{k}</span>
                  <span className="text-sm font-semibold text-white">{v}</span>
                </div>
              ))}
            </div>

            {/* Done button */}
            {!done ? (
              <button onClick={() => setDone(true)}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
                ✓ Tôi đã chuyển khoản xong
              </button>
            ) : (
              <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>Cảm ơn! Hệ thống đang xác nhận...</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(34,197,94,0.6)' }}>Email kích hoạt sẽ đến trong 5 phút · Kiểm tra cả mục Spam</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: QR ── */}
          <div className="flex flex-col items-center">
            {/* Tab bank / momo */}
            <div className="flex rounded-xl overflow-hidden mb-5 w-full max-w-xs"
              style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
              {(['bank', 'momo'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="flex-1 py-2.5 text-xs font-semibold transition"
                  style={{
                    background: tab === t ? 'linear-gradient(135deg,#B8860B,#D4AF37,#FFD700)' : 'transparent',
                    color: tab === t ? '#000' : 'rgba(212,175,55,0.5)',
                  }}>
                  {t === 'bank' ? '🏦 Ngân hàng / QR' : '📱 MoMo'}
                </button>
              ))}
            </div>

            {tab === 'bank' && (
              <>
                {/* QR Box */}
                <div className="relative rounded-2xl overflow-hidden mb-4"
                  style={{ background: 'white', padding: 12, width: 240, height: 240 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={displayQr} alt="VietQR ACB" width={216} height={216}
                    style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.8)' }}>
                      <div className="w-8 h-8 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-center mb-1" style={{ color: 'rgba(212,175,55,0.6)' }}>
                  Quét bằng <strong style={{ color: '#D4AF37' }}>bất kỳ app ngân hàng</strong> nào hỗ trợ VietQR
                </p>
                <p className="text-xs text-center" style={{ color: 'rgba(212,175,55,0.4)' }}>
                  QR tự điền số tiền {fmtVnd(vnd)} · {email.includes('@') ? 'Có mã cá nhân' : 'Nhập email để có mã riêng'}
                </p>
              </>
            )}

            {tab === 'momo' && (
              <div className="w-full max-w-xs space-y-4">
                <div className="rounded-xl p-5 space-y-3 w-full"
                  style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <div className="text-center">
                    <p className="text-xs mb-1" style={{ color: 'rgba(212,175,55,0.5)' }}>SĐT MoMo nhận tiền</p>
                    <p className="text-2xl font-black tracking-widest" style={{ color: '#FFD700' }}>0949 331 357</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(212,175,55,0.4)' }}>PHẠM THỊ THÚY NGÂN</p>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: 12 }} className="text-center">
                    <p className="text-xs mb-1" style={{ color: 'rgba(212,175,55,0.5)' }}>Số tiền</p>
                    <p className="text-xl font-bold text-white">{fmtVnd(vnd)}</p>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: 12 }}>
                    <p className="text-xs mb-1" style={{ color: 'rgba(212,175,55,0.5)' }}>Nội dung chuyển</p>
                    <p className="font-mono text-sm font-bold" style={{ color: '#FFD700' }}>{displayCode}</p>
                  </div>
                </div>
                <a href="https://zalo.me/g/s4z2fsnceun3fobbzjhd" target="_blank" rel="noopener noreferrer"
                  className="block w-full py-3 rounded-xl text-center text-xs font-semibold transition"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37' }}>
                  💬 Nhắn Zalo sau khi chuyển để kích hoạt nhanh
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

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

/* ── Logo với SVG thật ── */
function Logo({ size = 180, className = '' }: { size?: number; className?: string }) {
  return (
    <Image src="/logo.svg" alt="AI Connect Daily" width={size} height={size}
      className={`logo-blend ${className}`} priority unoptimized />
  )
}

/* ── Payment modal ── */
const BANK_ACCOUNT = '36998866'
const BANK_NAME = 'LÊ THỊ THẢO'
const BANK_ID = 'ACB'
const MOMO_PHONE = '0949331357'

function PaymentModal({ plan, onClose }: { plan: 'starter' | 'popular' | 'yearly'; onClose: () => void }) {
  const price  = plan === 'starter' ? '$5' : plan === 'popular' ? '$15' : '$99'
  const label  = plan === 'starter' ? 'Gói Trải Nghiệm' : plan === 'popular' ? 'Gói Phổ Biến' : 'Gói Hàng Năm'
  const vndAmt = PLAN_VND[plan] ?? 0

  // Step 1: nhập email → Step 2: hiện QR + order code
  const [step, setStep]       = useState<'email' | 'payment'>('email')
  const [email, setEmail]     = useState('')
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [orderCode, setOrderCode] = useState('')
  const [qrUrl, setQrUrl]     = useState('')
  const [tab, setTab]         = useState<'bank' | 'momo' | 'zalo'>('bank')
  const [copied, setCopied]   = useState(false)

  const handleCreateOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) return
    setLoading(true)
    try {
      const res  = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, plan }),
      })
      const data = await res.json()
      if (data.orderCode) {
        setOrderCode(data.orderCode)
        setQrUrl(data.qrUrl)
        setStep('payment')
      }
    } finally {
      setLoading(false)
    }
  }, [email, name, plan])

  const copyCode = () => {
    navigator.clipboard.writeText(orderCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = [
    { id: 'bank' as const, label: '🏦 Ngân hàng / QR' },
    { id: 'momo' as const, label: '📱 MoMo' },
    { id: 'zalo' as const, label: '💬 Zalo' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0A0A0A', border: '1px solid rgba(212,175,55,0.35)' }}>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
          <div>
            <p className="text-xs tracking-widest uppercase" style={{ color: '#D4AF37' }}>
              {step === 'email' ? 'Đăng ký' : 'Thanh toán'}
            </p>
            <p className="font-bold text-white">{label} — {price}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl leading-none">×</button>
        </div>

        {/* ── STEP 1: EMAIL ── */}
        {step === 'email' && (
          <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
            <p className="text-sm text-center" style={{ color: '#C9A96E' }}>
              Nhập email để tạo đơn hàng và nhận mã thanh toán riêng
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Họ tên (tuỳ chọn)"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder:text-zinc-600 text-sm focus:outline-none"
                style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
              />
              <input
                type="email"
                placeholder="Email nhận bản tin *"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-white placeholder:text-zinc-600 text-sm focus:outline-none"
                style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
              />
            </div>
            <button type="submit" disabled={loading || !email.includes('@')}
              className="w-full py-4 rounded-xl font-bold text-black tracking-wider transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #B8860B, #D4AF37, #FFD700, #D4AF37, #B8860B)' }}>
              {loading ? 'Đang tạo đơn...' : `Tạo đơn hàng ${fmtVnd(vndAmt)} →`}
            </button>
            <p className="text-xs text-center" style={{ color: 'rgba(212,175,55,0.35)' }}>
              Email sẽ nhận bản tin AI hàng ngày · Hủy bất cứ lúc nào
            </p>
          </form>
        )}

        {/* ── STEP 2: PAYMENT ── */}
        {step === 'payment' && (
          <>
            {/* Order code banner */}
            <div className="mx-6 mt-5 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <div>
                <p className="text-xs" style={{ color: 'rgba(212,175,55,0.6)' }}>Mã đơn hàng của bạn</p>
                <p className="font-mono font-bold tracking-wider" style={{ color: '#FFD700' }}>{orderCode}</p>
              </div>
              <button onClick={copyCode}
                className="text-xs px-3 py-1.5 rounded-lg transition shrink-0"
                style={{ background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(212,175,55,0.12)',
                  border: '1px solid rgba(212,175,55,0.25)', color: copied ? '#4ade80' : '#D4AF37' }}>
                {copied ? '✓ Đã copy' : 'Copy'}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex mt-4 mx-6 rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex-1 py-2.5 text-xs font-semibold transition"
                  style={{
                    color: tab === t.id ? '#000' : 'rgba(212,175,55,0.5)',
                    background: tab === t.id
                      ? 'linear-gradient(135deg,#B8860B,#D4AF37,#FFD700)'
                      : 'transparent',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6 pt-4">

              {/* Bank / VietQR tab */}
              {tab === 'bank' && (
                <div>
                  {/* VietQR — mã order được nhúng làm nội dung */}
                  <div className="mx-auto mb-4 rounded-2xl overflow-hidden flex items-center justify-center"
                    style={{ width: 200, height: 200, background: 'white', padding: 8 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrUrl} alt="QR ACB" width={184} height={184} style={{ objectFit: 'contain' }} />
                  </div>
                  {[
                    ['Ngân hàng', 'ACB'],
                    ['Số tài khoản', '7326 6666 686'],
                    ['Tên chủ TK', 'PHẠM THỊ THÚY NGÂN'],
                    ['Số tiền', fmtVnd(vndAmt)],
                    ['Nội dung CK', orderCode],
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="flex justify-between items-center py-2"
                      style={{ borderBottom: '1px solid rgba(212,175,55,0.07)' }}>
                      <span className="text-xs" style={{ color: 'rgba(212,175,55,0.45)' }}>{lbl}</span>
                      <span className="text-sm text-white font-medium"
                        style={lbl === 'Nội dung CK' ? { color: '#FFD700', fontFamily: 'monospace' } : {}}>
                        {val}
                      </span>
                    </div>
                  ))}
                  <p className="text-xs text-center mt-3" style={{ color: 'rgba(212,175,55,0.4)' }}>
                    QR tự điền số tiền · Hệ thống tự kích hoạt trong ~5 phút sau khi nhận tiền
                  </p>
                </div>
              )}

              {/* MoMo tab */}
              {tab === 'momo' && (
                <div className="space-y-4">
                  <div className="rounded-xl p-4 space-y-3"
                    style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'rgba(212,175,55,0.5)' }}>SĐT nhận tiền MoMo</p>
                      <p className="text-xl font-black tracking-widest" style={{ color: '#FFD700' }}>
                        {MOMO_PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(212,175,55,0.4)' }}>{BANK_NAME}</p>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: 10 }}>
                      <p className="text-xs mb-1" style={{ color: 'rgba(212,175,55,0.5)' }}>Số tiền</p>
                      <p className="text-white font-bold">{fmtVnd(vndAmt)}</p>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: 10 }}>
                      <p className="text-xs mb-1" style={{ color: 'rgba(212,175,55,0.5)' }}>Nội dung — ghi đúng mã này</p>
                      <p className="font-mono font-bold" style={{ color: '#FFD700' }}>{orderCode}</p>
                    </div>
                  </div>
                  <p className="text-xs text-center" style={{ color: 'rgba(212,175,55,0.4)' }}>
                    Hệ thống tự kích hoạt sau ~5 phút · hoặc nhắn Zalo nếu chờ lâu hơn
                  </p>
                </div>
              )}

              {/* Zalo tab */}
              {tab === 'zalo' && (
                <div className="text-center space-y-4">
                  <p className="text-sm" style={{ color: '#C9A96E' }}>Nhắn vào nhóm Zalo — admin xác nhận thủ công</p>
                  <a href="https://zalo.me/g/s4z2fsnceun3fobbzjhd" target="_blank" rel="noopener noreferrer"
                    className="block w-full py-4 rounded-xl font-bold text-black tracking-wider transition hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #B8860B, #D4AF37, #FFD700, #D4AF37, #B8860B)' }}>
                    💬 Vào nhóm Zalo ngay →
                  </a>
                  <div className="rounded-xl p-3 text-left"
                    style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <p className="text-xs mb-1" style={{ color: 'rgba(212,175,55,0.5)' }}>Gửi tin nhắn kèm mã đơn hàng</p>
                    <p className="text-sm font-mono" style={{ color: '#FFD700' }}>
                      Đăng ký {label} · {orderCode}
                    </p>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function SalesPage() {
  const [modal, setModal] = useState<null | 'starter' | 'popular' | 'yearly'>(null)

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Tier 1 — Starter */}
            <div className="rounded-2xl p-6 gold-border relative flex flex-col"
              style={{ background: 'rgba(0,0,0,0.7)' }}>
              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'rgba(212,175,55,0.5)' }}>Gói Trải Nghiệm</p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-4xl font-black gold-shimmer">$5</span>
                <span className="text-sm pb-1.5" style={{ color: 'rgba(212,175,55,0.5)' }}>/tháng</span>
              </div>
              <p className="text-xs mb-5" style={{ color: 'rgba(212,175,55,0.35)' }}>Bắt đầu miễn phí rủi ro</p>
              <ul className="space-y-2 mb-7 flex-1">
                {[
                  'Bản tin AI hàng ngày qua email',
                  'Tóm tắt 3-5 tool nổi bật',
                  'Giao lúc 3:00 chiều',
                  '4 nguồn tổng hợp',
                  'Hủy bất cứ lúc nào',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#C9A96E' }}>
                    <span className="mt-0.5 shrink-0" style={{ color: '#D4AF37' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => setModal('starter')}
                className="w-full py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition hover:opacity-90"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37' }}>
                Đăng ký ngay →
              </button>
            </div>

            {/* Tier 2 — Popular (highlighted) */}
            <div className="rounded-2xl p-6 relative overflow-hidden flex flex-col"
              style={{ background: 'linear-gradient(145deg, #0D0900, #1A1000)', border: '1px solid #D4AF37', boxShadow: '0 0 50px rgba(212,175,55,0.2)' }}>
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-black tracking-wider"
                style={{ background: 'linear-gradient(135deg, #B8860B, #FFD700)' }}>
                PHỔ BIẾN
              </div>
              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#D4AF37' }}>Gói Phổ Biến</p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-4xl font-black gold-shimmer">$15</span>
                <span className="text-sm pb-1.5" style={{ color: 'rgba(212,175,55,0.6)' }}>/tháng</span>
              </div>
              <p className="text-xs mb-5" style={{ color: 'rgba(212,175,55,0.35)' }}>Được yêu thích nhất</p>
              <ul className="space-y-2 mb-7 flex-1">
                {[
                  'Tất cả tính năng Trải Nghiệm',
                  'Kết nối cộng đồng AI exclusive',
                  'Group chat + Q&A hàng tuần',
                  'Chia sẻ tool bởi cộng đồng',
                  'Ưu tiên hỗ trợ qua Zalo',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white">
                    <span className="mt-0.5 shrink-0" style={{ color: '#D4AF37' }}>✦</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => setModal('popular')}
                className="w-full py-3.5 rounded-xl font-bold text-black text-sm tracking-widest uppercase transition hover:opacity-90 hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #B8860B 0%, #D4AF37 40%, #FFD700 60%, #D4AF37 80%, #B8860B 100%)', boxShadow: '0 4px 24px rgba(212,175,55,0.4)' }}>
                ✦ Đăng ký ngay
              </button>
            </div>

            {/* Tier 3 — Yearly */}
            <div className="rounded-2xl p-6 gold-border relative flex flex-col"
              style={{ background: 'rgba(5,3,0,0.85)' }}>
              <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider"
                style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}>
                TIẾT KIỆM NHẤT
              </div>
              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'rgba(212,175,55,0.5)' }}>Gói Hàng Năm</p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-4xl font-black gold-shimmer">$99</span>
                <span className="text-sm pb-1.5" style={{ color: 'rgba(212,175,55,0.5)' }}>/năm</span>
              </div>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs line-through" style={{ color: 'rgba(212,175,55,0.3)' }}>$180</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                  Tiết kiệm $81
                </span>
              </div>
              <ul className="space-y-2 mb-7 flex-1">
                {[
                  'Tất cả tính năng Phổ Biến',
                  'Bản tin video 2 lần / ngày',
                  '12 tháng không lo gia hạn',
                  'Ưu tiên hỗ trợ VIP',
                  'Bonus tài nguyên AI độc quyền',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#C9A96E' }}>
                    <span className="mt-0.5 shrink-0" style={{ color: '#D4AF37' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => setModal('yearly')}
                className="w-full py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition hover:opacity-90"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37' }}>
                Đăng ký năm →
              </button>
              <p className="text-center text-xs mt-2.5" style={{ color: 'rgba(212,175,55,0.35)' }}>Tương đương ~$8.3/tháng</p>
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
          INLINE QR PAYMENT
      ════════════════════════════════════ */}
      <InlinePayment />

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
            Từ $5/tháng · Kích hoạt ngay · Hủy bất cứ lúc nào
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setModal('popular')}
              className="px-8 py-4 rounded-xl font-bold text-black tracking-widest uppercase transition hover:opacity-90 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #B8860B, #D4AF37, #FFD700, #D4AF37, #B8860B)', boxShadow: '0 0 40px rgba(212,175,55,0.3)' }}>
              ✦ Gói Phổ Biến — $15/tháng
            </button>
            <button onClick={() => setModal('starter')}
              className="px-8 py-4 rounded-xl font-bold tracking-widest uppercase transition hover:opacity-90"
              style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}>
              Gói Trải Nghiệm — $5/tháng
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
