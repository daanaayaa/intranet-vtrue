import { useContent } from '../../context/ContentContext'

// แปลง URL ของไฟล์ที่อัปโหลดให้เปิดจาก Frontend ได้ (relative path จาก backend -> absolute)
// รูปแบบเดียวกับ getFileUrl ใน Announcement.jsx / CollectionEditor.jsx / OnCall.jsx
function getFileUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`
  return `${API_URL}${url}`
}

// แต่ละบริการอาจมี "href" (ลิงก์ภายนอก) หรือ "file" (ไฟล์ที่อัปโหลด เช่น jpg/pdf) อย่างใดอย่างหนึ่ง
// href มาก่อนถ้ามีทั้งคู่ — เหมือน resolveLink ใน Announcement.jsx
function resolveLink(item) {
  if (item?.href) return item.href
  if (item?.file?.url) return getFileUrl(item.file.url)
  return null
}

export function DigitalServices({ onOpenService }) {
  const { content } = useContent()
  const DIGITAL_SERVICES = content.DIGITAL_SERVICES

  const handleClick = (s) => {
    // มีเมนูย่อย (groups/tree) -> เข้าไปดูหน้าลิสต์ย่อยเหมือนเดิม
    if ((s.groups && s.groups.length > 0) || (s.tree && s.tree.length > 0)) {
      onOpenService(s)
      return
    }
    // ไม่มีเมนูย่อย แต่มีลิงก์/ไฟล์ตรงตัว -> เปิดแท็บใหม่ทันที (เช่น Office 365, BES, Fire Marshal)
    const link = resolveLink(s)
    if (link) window.open(link, '_blank', 'noopener,noreferrer')
  }

  return (
    <div id="sec-digital">
      <div className="mb-[11px] flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-sm font-semibold text-navy-900">
          <span className="h-[7px] w-[7px] rounded-full bg-coral" />Digital Services
        </div>
      </div>
      <div className="grid grid-cols-4 gap-[9px] max-[900px]:grid-cols-3 max-[560px]:grid-cols-2">
        {DIGITAL_SERVICES.map(s => (
          <button
            type="button"
            className="flex flex-col items-center gap-[7px] rounded-md border border-line bg-white px-1.5 py-3.5 text-center"
            key={s.label}
            onClick={() => handleClick(s)}
          >
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[11px]" style={{ background: s.color }}>
              <i className={"ti " + s.icon + " text-[19px] text-white"} />
            </div>
            <span className="text-[10px] font-semibold">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}