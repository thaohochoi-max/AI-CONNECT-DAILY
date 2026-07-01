'use client'

import { useEffect, useState } from 'react'

type Digest = {
  id: string
  date: string
  items: { title: string; source: string }[]
  status: string
  script: string | null
  videos?: { video_url: string | null; status: string }[]
}

type Stats = {
  subscribers: number
  totalDigests: number
  sentToday: boolean
}

export default function AdminPage() {
  const [digests, setDigests] = useState<Digest[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [runningStep, setRunningStep] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])

  const secret = typeof window !== 'undefined' ? localStorage.getItem('admin_secret') || '' : ''

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const s = localStorage.getItem('admin_secret') || ''

    const [digestsRes, statsRes] = await Promise.all([
      fetch('/api/admin/digests', { headers: { Authorization: `Bearer ${s}` } }),
      fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${s}` } }),
    ])

    if (digestsRes.ok) setDigests(await digestsRes.json())
    if (statsRes.ok) setStats(await statsRes.json())
    setLoading(false)
  }

  async function triggerStep(step: string, body?: object) {
    const s = localStorage.getItem('admin_secret') || ''
    setRunningStep(step)
    setLog(prev => [...prev, `→ Đang chạy: ${step}...`])

    const res = await fetch(`/api/${step}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s}` },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    setLog(prev => [...prev, `✓ ${step}: ${JSON.stringify(data).slice(0, 200)}`])
    setRunningStep(null)
    fetchData()
  }

  async function runFullPipeline() {
    const s = localStorage.getItem('admin_secret') || ''
    setRunningStep('pipeline')
    setLog([])
    setLog(['→ Chạy toàn bộ pipeline...'])
    const res = await fetch('/api/cron/daily', { headers: { Authorization: `Bearer ${s}` } })
    const data = await res.json()
    if (data.log) setLog(data.log)
    setRunningStep(null)
    fetchData()
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    scripted: 'bg-blue-500/20 text-blue-400',
    video_generating: 'bg-orange-500/20 text-orange-400',
    video_ready: 'bg-purple-500/20 text-purple-400',
    sent: 'bg-green-500/20 text-green-400',
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🛠️ Admin Dashboard</h1>
        <p className="text-slate-400 mb-8">Daily Tool Digest</p>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-slate-400 text-sm">Subscribers</p>
              <p className="text-3xl font-bold text-purple-400">{stats.subscribers}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-slate-400 text-sm">Tổng số digest</p>
              <p className="text-3xl font-bold">{stats.totalDigests}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-slate-400 text-sm">Hôm nay đã gửi</p>
              <p className={`text-3xl font-bold ${stats.sentToday ? 'text-green-400' : 'text-red-400'}`}>
                {stats.sentToday ? 'Có' : 'Chưa'}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="font-bold text-lg mb-4">Chạy thủ công</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runFullPipeline}
              disabled={!!runningStep}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {runningStep === 'pipeline' ? '⏳ Đang chạy...' : '▶ Chạy toàn bộ pipeline'}
            </button>
            <button
              onClick={() => triggerStep('scrape')}
              disabled={!!runningStep}
              className="px-5 py-2.5 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-50 transition"
            >
              1. Scrape
            </button>
          </div>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-8 font-mono text-sm">
            <p className="text-slate-400 text-xs mb-2">Pipeline log:</p>
            {log.map((line, i) => (
              <p key={i} className={line.startsWith('ERROR') ? 'text-red-400' : line.startsWith('✓') ? 'text-green-400' : 'text-slate-300'}>
                {line}
              </p>
            ))}
          </div>
        )}

        {/* Digests */}
        <h2 className="font-bold text-lg mb-4">Lịch sử Digest</h2>
        {loading ? (
          <p className="text-slate-400">Đang tải...</p>
        ) : (
          <div className="space-y-3">
            {digests.map(d => (
              <div key={d.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{new Date(d.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[d.status] || 'bg-slate-500/20 text-slate-400'}`}>
                    {d.status}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{d.items?.length || 0} items scraped</p>
                {d.videos?.[0]?.video_url && (
                  <a href={d.videos[0].video_url} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-purple-400 text-sm hover:underline">
                    ▶ Xem video
                  </a>
                )}
                {d.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => triggerStep('generate', { digestId: d.id })}
                      disabled={!!runningStep}
                      className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 disabled:opacity-50">
                      Generate script
                    </button>
                  </div>
                )}
                {d.status === 'scripted' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => triggerStep('video', { digestId: d.id })}
                      disabled={!!runningStep}
                      className="px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 disabled:opacity-50">
                      Tạo video Luma
                    </button>
                  </div>
                )}
                {d.status === 'video_ready' && (
                  <div className="mt-3">
                    <button onClick={() => triggerStep('send', { digestId: d.id })}
                      disabled={!!runningStep}
                      className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 disabled:opacity-50">
                      Gửi email subscribers
                    </button>
                  </div>
                )}
              </div>
            ))}
            {digests.length === 0 && (
              <p className="text-slate-500 text-center py-8">Chưa có digest nào. Chạy pipeline đầu tiên!</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
