import Anthropic from '@anthropic-ai/sdk'
import type { ToolItem } from '@/lib/supabase'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function generateVideoScript(items: ToolItem[], date: string): Promise<string> {
  const toolList = items
    .slice(0, 8)
    .map((item, i) => `${i + 1}. [${item.source}] ${item.title}\n   ${item.description}`)
    .join('\n\n')

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `Bạn là người dẫn chương trình tech/AI cho người Việt Nam. Hãy viết script video ngắn (60-90 giây) tóm tắt các tool và tin tức công nghệ mới nhất hôm nay ${date}.

Danh sách tin tức/tool hôm nay:
${toolList}

Yêu cầu script:
- Mở đầu hấp dẫn (5 giây): chào người xem, ngày hôm nay
- Phần chính (50-70 giây): điểm qua 4-5 tool/tin nổi bật nhất, mỗi mục 10-15 giây
- Kết thúc (5-10 giây): kêu gọi subscribe để không bỏ lỡ
- Ngôn ngữ: tiếng Việt, trẻ trung, dễ hiểu
- Format: [SCENE X] để đánh dấu từng cảnh
- Kèm gợi ý hình ảnh/visual cho từng cảnh trong ngoặc []

Chỉ trả về script, không giải thích thêm.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')
  return content.text
}

export async function generateEmailSummary(items: ToolItem[], date: string): Promise<string> {
  const toolList = items
    .slice(0, 6)
    .map((item, i) => `${i + 1}. **${item.title}** (${item.source})\n   ${item.description}\n   🔗 ${item.url}`)
    .join('\n\n')

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `Viết email newsletter tiếng Việt, ngắn gọn, hấp dẫn cho ngày ${date} với nội dung:

${toolList}

Format HTML email đẹp với:
- Tiêu đề hấp dẫn
- Tóm tắt 1-2 câu cho mỗi tool
- Nút CTA màu sắc cho mỗi tool
- Chữ ký cuối email

Chỉ trả về HTML, không markdown wrapper.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')
  return content.text
}
