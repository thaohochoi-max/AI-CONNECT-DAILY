'use client'

import { useEffect, useState } from 'react'

type DigestItem = { title: string; source: string; description: string; url: string }

type Digest = {
  id: string
  date: string
  items: DigestItem[]
  status: string
  script: string | null
  videos?: { video_url: string | null; status: string }[]
}

type Stats = { subscribers: number; totalDigests: number; sentToday: boolean }

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  scripted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  video_generating: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  video_ready: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  sent: 'bg-green-500/20 text-green-400 border-green-500/30',
}

// ── Login gate ──────────────────────────────────────────────────────────────
function LoginGate({ onLogin }: { onLogin: (s: string) => void }) {
  const [val, setVal] = useState('')
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white text-center mb-2">🛠️ Admin</h1>
        <p className="text-slate-400 text-center text-sm mb-8">Nhập CRON_SECRET để tiếp tục</p>
        <form onSubmit={e => { e.preventDefault(); if (val) { localStorage.setItem('admin_secret', val); onLogin(val) } }}
          className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="CRON_SECRET"
            value={val}
            onChange={e => setVal(e.target.value)}
            autoFocus
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
          />
          <button type="submit"
            className="py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium text-white transition">
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main dashboard ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [secret, setSecret] = useState<string | null>(null)
  const [digests, setDigests] = useState<Digest[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [runningStep, setRunningStep] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const s = localStorage.getItem('admin_secret')
    if (s) { setSecret(s); fetchData(s) }
    else setLoading(false)
  }, [])

  async function fetchData(s: string) {
    setLoading(true)
    const [dr, sr] = await Promise.all([
      fetch('/api/admin/digests', { headers: { Authorization: `Bearer ${s}` } }),
      fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${s}` } }),
    ])
    if (dr.status === 401) { localStorage.removeItem('admin_secret'); setSecret(null); setLoading(false); return }
    if (dr.ok) setDigests(await dr.json())
    if (sr.ok) setStats(await sr.json())
    setLoading(false)
  }

  async function callAPI(path: string, method = 'POST', body?: object) {
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: body ? JSON.stringify(body) : undefined,
    })
    return res.json()
  }

  async function runPipeline() {
    setRunningStep('pipeline'); setLog(['→ Chạy toàn bộ pipeline...'])
    const data = await callAPI('/api/cron/daily', 'GET')
    setLog(data.log || [String(data.error || 'Done')])
    setRunningStep(null); fetchData(secret!)
  }

  async function triggerStep(path: string, body?: object) {
    setRunningStep(path)
    setLog(prev => [...prev, `→ ${path}...`])
    const data = await callAPI(path, 'POST', body)
    setLog(prev => [...prev, `✓ ${JSON.stringify(data).slice(0, 300)}`])
    setRunningStep(null); fetchData(secret!)
  }

  if (!secret) return <LoginGate onLogin={s => { setSecret(s); fetchData(s) }} />

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">🛠️ Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Daily Tool Digest</p>
          </div>
          <button onClick={() => { localStorage.removeItem('admin_secret'); setSecret(null) }}
            className="text-slate-500 hover:text-red-400 text-sm transition">
            Đăng xuất
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Subscribers', value: stats.subscribers, color: 'text-purple-400' },
              { label: 'Tổng digest', value: stats.totalDigests, color: 'text-blue-400' },
              { label: 'Hôm nay gửi', value: stats.sentToday ? '✓ Rồi' : '✗ Chưa', color: stats.sentToday ? 'text-green-400' : 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-4">Chạy thủ công</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={runPipeline} disabled={!!runningStep}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:opacity-90 disabled:opacity-40 transition text-sm">
              {runningStep === 'pipeline' ? '⏳ Đang chạy...' : '▶ Chạy toàn bộ pipeline'}
            </button>
            <button onClick={() => triggerStep('/api/scrape')} disabled={!!runningStep}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm disabled:opacity-40 transition">
              1️⃣ Scrape
            </button>
          </div>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div className="bg-black/50 border border-white/10 rounded-xl p-4 mb-6 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
            {log.map((line, i) => (
              <p key={i} className={
                line.includes('ERROR') || line.includes('error') ? 'text-red-400'
                : line.startsWith('✓') ? 'text-green-400'
                : 'text-slate-300'
              }>{line}</p>
            ))}
          </div>
        )}

        {/* Digests list */}
        <h2 className="font-semibold mb-3">Lịch sử Digest</h2>
        {loading ? (
          <p className="text-slate-400 text-sm py-8 text-center">Đang tải...</p>
        ) : digests.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-12">
            Chưa có digest. Nhấn "Chạy toàn bộ pipeline" để bắt đầu!
          </p>
        ) : (
          <div className="space-y-3">
            {digests.map(d => {
              const dateStr = new Date(d.date).toLocaleDateString('vi-VN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })
              const isOpen = expanded === d.id
              return (
                <div key={d.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {/* Digest header */}
                  <button onClick={() => setExpanded(isOpen ? null : d.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition text-left">
                    <div>
                      <p className="font-medium text-sm">{dateStr}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{d.items?.length || 0} items</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLOR[d.status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                        {d.status}
                      </span>
                      <span className="text-slate-500 text-xs">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="border-t border-white/10 p-4 space-y-4">
                      {/* Items */}
                      {d.items?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Items scraped</p>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {d.items.map((item, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <span className="text-slate-500 shrink-0 w-5">{i + 1}.</span>
                                <div>
                                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                                    className="text-purple-300 hover:underline font-medium">{item.title}</a>
                                  <span className="text-slate-500 ml-2">({item.source})</span>
                                  {item.description && <p className="text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Script preview */}
                      {d.script && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Script video</p>
                          <pre className="text-xs text-slate-300 bg-black/30 rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
                            {d.script}
                          </pre>
                        </div>
                      )}

                      {/* Video */}
                      {d.videos?.[0]?.video_url && (
                        <a href={d.videos[0].video_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm hover:bg-purple-500/30 transition">
                          ▶ Xem video Luma AI
                        </a>
                      )}

                      {/* Step buttons */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {d.status === 'pending' && (
                          <button onClick={() => triggerStep('/api/generate', { digestId: d.id })}
                            disabled={!!runningStep}
                            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs hover:bg-blue-500/30 disabled:opacity-40">
                            2️⃣ Generate script + email
                          </button>
                        )}
                        {d.status === 'scripted' && (
                          <button onClick={() => triggerStep('/api/video', { digestId: d.id })}
                            disabled={!!runningStep}
                            className="px-3 py-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs hover:bg-orange-500/30 disabled:opacity-40">
                            3️⃣ Tạo video Luma AI
                          </button>
                        )}
                        {(d.status === 'video_ready' || d.status === 'video_generating') && (
                          <>
                            <button onClick={() => callAPI(`/api/video?digestId=${d.id}`, 'GET').then(r => setLog(prev => [...prev, JSON.stringify(r)]))}
                              disabled={!!runningStep}
                              className="px-3 py-1.5 bg-slate-500/20 text-slate-300 border border-slate-500/30 rounded-lg text-xs hover:bg-slate-500/30 disabled:opacity-40">
                              🔄 Check video status
                            </button>
                            {d.status === 'video_ready' && (
                              <button onClick={() => triggerStep('/api/send', { digestId: d.id })}
                                disabled={!!runningStep}
                                className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs hover:bg-green-500/30 disabled:opacity-40">
                                4️⃣ Gửi email subscribers
                              </button>
                            )}
                          </>
                        )}
                        {d.status === 'scripted' && (
                          <button onClick={() => triggerStep('/api/send', { digestId: d.id })}
                            disabled={!!runningStep}
                            className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs hover:bg-green-500/30 disabled:opacity-40">
                            4️⃣ Gửi email (không có video)
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
