'use client'

import { useEffect, useState } from 'react'

export default function UnsubscribePage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const e = params.get('email')
    if (e) setEmail(e)
  }, [])

  async function handleUnsubscribe() {
    if (!email) return
    setStatus('loading')
    const res = await fetch(`/api/subscribe?email=${encodeURIComponent(email)}`, { method: 'DELETE' })
    setStatus(res.ok ? 'success' : 'error')
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Hủy đăng ký</h1>
        {status === 'success' ? (
          <div className="bg-green-500/20 border border-green-500/40 rounded-2xl p-6">
            <p className="text-green-400">Đã hủy đăng ký thành công. Hẹn gặp lại!</p>
          </div>
        ) : (
          <>
            <p className="text-slate-400 mb-6">Bạn muốn hủy nhận bản tin Daily Tool Digest?</p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email của bạn"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white mb-4 focus:outline-none focus:border-red-400"
            />
            <button
              onClick={handleUnsubscribe}
              disabled={status === 'loading'}
              className="w-full px-6 py-3 bg-red-500/80 rounded-xl font-medium hover:bg-red-500 transition disabled:opacity-50"
            >
              {status === 'loading' ? 'Đang hủy...' : 'Xác nhận hủy đăng ký'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}
