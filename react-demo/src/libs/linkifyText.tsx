import { ReactNode } from 'react'
import LinkifyIt from 'linkify-it'
import tlds from 'tlds'

const linkify = new LinkifyIt().tlds(tlds)

export const linkifyText = (text: string): ReactNode[] => {
  if (!text) return []

  const matches = linkify.match(text)

  // Nếu không có URL, trả về text nguyên bản
  if (!matches) return [text]

  const elements: ReactNode[] = []
  let lastIndex = 0

  matches.forEach((match, i) => {
    // Thêm văn bản thường trước URL
    if (match.index > lastIndex) elements.push(text.slice(lastIndex, match.index))

    // Thêm URL dưới dạng liên kết
    elements.push(
      <a
        key={`link-${i}`}
        href={match.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#1890ff', textDecoration: 'none' }}
      >
        {match.text}
      </a>,
    )

    lastIndex = match.lastIndex
  })

  // Thêm nội dung còn lại sau URL cuối cùng
  if (lastIndex < text.length) elements.push(text.slice(lastIndex))

  return elements
}
