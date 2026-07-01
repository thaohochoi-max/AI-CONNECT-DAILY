export const PLAN_AMOUNTS: Record<string, number> = {
  starter: 125000,
  popular: 375000,
  yearly:  2475000,
}

export const PLAN_LABELS: Record<string, string> = {
  starter: 'Gói Trải Nghiệm',
  popular: 'Gói Phổ Biến',
  yearly:  'Gói Hàng Năm',
}

export function generateOrderCode(plan: string, email: string): string {
  const slug = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 5)
  const ts   = Date.now().toString(36).toUpperCase().slice(-4)
  return `AICD-${plan.toUpperCase()}-${slug}${ts}`
}

// SePay gửi header: Authorization: Apikey <key>
export function verifySepayRequest(req: Request): boolean {
  const auth = req.headers.get('authorization') ?? ''
  const key  = auth.replace(/^Apikey\s+/i, '').trim()
  return !!process.env.SEPAY_API_KEY && key === process.env.SEPAY_API_KEY
}

export function getVietQRUrl(orderCode: string, plan: string): string {
  const amount  = PLAN_AMOUNTS[plan] ?? 0
  const content = encodeURIComponent(orderCode)
  const name    = encodeURIComponent('PHAM THI THUY NGAN')
  return `https://img.vietqr.io/image/TPBank-73266666686-compact2.png?amount=${amount}&addInfo=${content}&accountName=${name}`
}
