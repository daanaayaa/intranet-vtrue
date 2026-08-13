import { useContent } from '../../context/ContentContext'

// แปลง URL ของไฟล์ที่อัปโหลดให้เปิดจาก Frontend ได้ (relative path จาก backend -> absolute)
// รูปแบบเดียวกับ getFileUrl ใน Announcement.jsx / CollectionEditor.jsx / OnCall.jsx
function getFileUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`
  return `${API_URL}${url}`
}

// แต่ละปุ่มอาจมี "href" (ลิงก์ภายนอก/tel:) หรือ "file" (ไฟล์ที่อัปโหลด เช่น jpg/pdf) อย่างใดอย่างหนึ่ง
// href มาก่อนถ้ามีทั้งคู่ — เหมือน resolveLink ใน Announcement.jsx
function resolveLink(item) {
  if (item?.href) return item.href
  if (item?.file?.url) return getFileUrl(item.file.url)
  return null
}

export function ContactCard() {
  const { content } = useContent()
  const CONTACT_LINKS = content.CONTACT_LINKS

  return (
    <div className="relative overflow-hidden rounded-lg bg-[#4A5568] px-[19px] py-[17px]" id="sec-contact" data-card>
      <div className="mb-[5px] text-[9px] font-bold tracking-[1.2px] text-white/50 uppercase">Contact Tools</div>
      <div className="mb-0.5 font-display text-base font-semibold text-white">ติดต่อภายใน</div>
      <div className="mb-[13px] text-[10.5px] leading-[1.5] text-white/55">หมายเลขโทรภายใน · สายด่วนแผนก </div>
      <div className="flex flex-wrap gap-2">
        {CONTACT_LINKS.map((c, i) => {
          const link = resolveLink(c)
          const btnClasses =
            'flex flex-1 items-center justify-center gap-1.5 rounded-xs border border-white/20 bg-white/[0.08] px-3 py-2 text-[11px] font-semibold text-white'
          const content = (
            <>
              <i className={`ti ${c.icon || 'ti-phone-call'}`} />
              {c.label}
            </>
          )

          // tel: ลิงก์ให้เปิดในแท็บเดียวกัน (โทรออกเลย), ลิงก์อื่น/ไฟล์แนบเปิดแท็บใหม่
          const isTel = link?.startsWith('tel:')

          return link ? (
            <a
              key={i}
              href={link}
              {...(!isTel && { target: '_blank', rel: 'noopener noreferrer' })}
              className={`${btnClasses} no-underline`}
            >
              {content}
            </a>
          ) : (
            <div key={i} className={btnClasses}>
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}