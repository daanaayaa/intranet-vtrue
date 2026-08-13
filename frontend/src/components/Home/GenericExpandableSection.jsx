import { useState } from 'react'
import { guessIcon } from '../../utils/guessIcon'

// แปลง URL ของไฟล์ที่อัปโหลดให้เปิดจาก Frontend ได้ (relative path จาก backend -> absolute)
// รูปแบบเดียวกับ getFileUrl ใน Announcement.jsx / CollectionEditor.jsx / OnCall.jsx
function getFileUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`
  return `${API_URL}${url}`
}

// แต่ละ item อาจมี "href" (ลิงก์ภายนอก) หรือ "file" (ไฟล์ที่อัปโหลด เช่น jpg/pdf) อย่างใดอย่างหนึ่ง
// href มาก่อนถ้ามีทั้งคู่ — เหมือน resolveLink ใน Announcement.jsx
function resolveLink(item) {
  if (item?.href) return item.href
  if (item?.file?.url) return getFileUrl(item.file.url)
  return null
}

// Section แบบการ์ดพับ/กางเดียว ใช้กับ custom sections ที่เลือกเทมเพลต "expandable"
// section.sub: คำอธิบายรองใต้ชื่อ (เช่น "กลุ่ม 6")
// item แต่ละอัน: { text, icon, href, file }
export function GenericExpandableSection({ section }) {
  const [open, setOpen] = useState(false)
  const items = section.items || []

  return (
    <div
      className="cursor-pointer rounded-lg border border-line bg-white p-[17px]"
      data-card
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-start justify-between">
        <div>
          <div
            className="mb-[11px] flex h-[38px] w-[38px] items-center justify-center rounded-[10px]"
            style={{ background: section.color }}
          >
            <i className={`ti ${section.icon} text-lg text-white`} />
          </div>
          <h3 className="text-[13px] font-bold text-navy-900">{section.label}</h3>
          {section.sub && <p className="mt-px text-[11px] text-ink-soft">{section.sub}</p>}
        </div>
        <i
          className={`ti ti-chevron-down text-[15px] text-ink-soft transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </div>
      <div className={`mt-2.5 border-t border-line pt-2.5 ${open ? 'block' : 'hidden'}`}>
        {items.map((item, i) => {
          const icon = item.icon || guessIcon(item.text)
          const link = resolveLink(item)
          const content = (
            <>
              <i className="text-[13px] text-blue-600" style={{ color: section.color }}>
                <i className={`ti ${icon}`} />
              </i>
              {item.text}
            </>
          )
          // มีลิงก์ (href หรือไฟล์แนบ เช่น PDF/JPG) -> คลิกได้ เปิดแท็บใหม่
          return link ? (
            <a
              key={i}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 border-b border-line py-2 text-[11px] no-underline last:border-b-0"
            >
              {content}
            </a>
          ) : (
            <div key={i} className="flex items-center gap-2 border-b border-line py-2 text-[11px] last:border-b-0">
              {content}
            </div>
          )
        })}
        {items.length === 0 && <p className="py-3 text-center text-[11px] text-ink-soft">ยังไม่มีรายการ</p>}
      </div>
    </div>
  )
}