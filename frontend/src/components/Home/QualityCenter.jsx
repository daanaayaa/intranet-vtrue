import { useContent } from '../../context/ContentContext'
import { guessIcon } from '../../utils/guessIcon'

// แปลง URL ของไฟล์ที่อัปโหลดให้เปิดจาก Frontend ได้ (relative path จาก backend -> absolute)
// รูปแบบเดียวกับ getFileUrl ใน Announcement.jsx / CollectionEditor.jsx / OnCall.jsx
function getFileUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`
  return `${API_URL}${url}`
}

// แต่ละรายการอาจมี "href" (ลิงก์ภายนอก) หรือ "file" (ไฟล์ที่อัปโหลด เช่น jpg/pdf) อย่างใดอย่างหนึ่ง
// href มาก่อนถ้ามีทั้งคู่ — เหมือน resolveLink ใน Announcement.jsx
function resolveLink(item) {
  if (item?.href) return item.href
  if (item?.file?.url) return getFileUrl(item.file.url)
  return null
}

export function QualityCenter() {
  const { content } = useContent()
  const QUALITY = content.QUALITY

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white" id="sec-quality" data-card>
      <div className="flex items-center gap-2 border-b border-line px-[18px] py-[13px]">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-teal-tint">
          <i className="ti ti-shield-check text-teal" />
        </div>
        <h3 className="text-[13px] font-bold text-navy-900">ศูนย์รวมระบบคุณภาพและความปลอดภัย</h3>
      </div>
      <div className="px-[18px] py-4">
        <div className="grid grid-cols-3 gap-[9px] max-[560px]:grid-cols-2">
          {QUALITY.map(q => {
            const link = resolveLink(q)
            const cellClasses =
              'flex flex-col items-center gap-[7px] rounded-md border border-line px-2 py-3 text-center transition-colors hover:border-blue-500/40'
            const cellContent = (
              <>
                <div className={`flex h-[38px] w-[38px] items-center justify-center rounded-[10px] ${q.warn ? 'bg-coral-tint' : 'bg-teal-tint'}`}>
                  <i className={`ti ${q.icon || guessIcon(q.label)} text-lg ${q.warn ? 'text-coral' : 'text-teal'}`} />
                </div>
                <span className="text-[10px] leading-[1.3] font-semibold">{q.label}</span>
              </>
            )

            // มีลิงก์ (href หรือไฟล์แนบ) -> คลิกได้ เปิดแท็บใหม่
            // ไม่มี -> แสดงเฉยๆ ไม่ทำเป็นลิงก์
            return link ? (
              <a
                key={q.label}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cellClasses} no-underline`}
              >
                {cellContent}
              </a>
            ) : (
              <div className={cellClasses} key={q.label}>
                {cellContent}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}