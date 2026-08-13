import { useState } from 'react'
import { useContent } from '../../context/ContentContext'

// แปลง URL ของไฟล์ที่อัปโหลดให้เปิดจาก Frontend ได้ (relative path จาก backend -> absolute)
// รูปแบบเดียวกับ getFileUrl ใน Announcement.jsx / CollectionEditor.jsx / OnCall.jsx
function getFileUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`
  return `${API_URL}${url}`
}

// รับค่าที่เป็นได้ทั้ง href (string URL) หรือ file (object { id, name, url, size } จาก uploader)
// href มาก่อนถ้ามีทั้งคู่ — เหมือน resolveLink ใน Announcement.jsx
function resolveLink(href, file) {
  if (href) return href
  if (file?.url) return getFileUrl(file.url)
  return null
}

export function buildDocs(item) {
  const candidates = [
    { label: 'รายละเอียด', href: item.detailHref, file: item.detailFile },
    { label: 'เอกสารสัญญา', href: item.contractHref, file: item.contractFile },
    { label: 'เอกสารแนบท้ายสัญญา', href: item.attachmentHref, file: item.attachmentFile },
    { label: 'ลายเซ็นผู้มีอำนาจส่งตัว', href: item.signatureHref, file: item.signatureFile },
  ]
  const docs = candidates
    .map((d) => ({ label: d.label, link: resolveLink(d.href, d.file) }))
    .filter((d) => d.link)

  // รองรับข้อมูลเก่าที่มีแค่ href/file เดี่ยวๆ (ไม่มี 4 ประเภทเอกสารแยก)
  if (docs.length === 0) {
    const link = resolveLink(item.href, item.file)
    if (link) docs.push({ label: 'ลิงก์', link })
  }

  // รองรับ item.docs = [{ label, href, file }] แบบจำนวนไม่คงที่
  // (ใช้กับรายการที่แต่ละบริษัทมีเอกสารไม่เท่ากัน เช่น รายชื่อตรวจสุขภาพก่อนเข้าทำงาน)
  if (Array.isArray(item.docs)) {
    item.docs.forEach((d) => {
      const link = resolveLink(d.href, d.file)
      if (link) docs.push({ label: d.label, link })
    })
  }

  return docs
}

export function PartnerList({ onOpenPartner }) {
  const { content } = useContent()
  const PARTNERS = content.PARTNERS
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? PARTNERS : PARTNERS.slice(0, 4)

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white" id="sec-partner" data-card>
      <div className="flex items-center justify-between border-b border-line px-[18px] py-3.5">
        <div className="flex items-center gap-[9px]">
          <i className="ti ti-building text-blue-600" style={{ fontSize: 15 }} />
          <h3 className="text-[13px] font-bold text-navy-900">รายชื่อลูกค้าบริษัทคู่สัญญา</h3>
          <span className="rounded-[20px] bg-blue-600 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white">{PARTNERS.length}</span>
        </div>
      </div>

      <div className="py-1">
        {visible.map((p) => {
          const subItems = p.subItems || []
          const hasSub = subItems.length > 0
          const directLink = !hasSub ? resolveLink(p.href, p.file) : null

          const handleClick = () => {
            if (hasSub) onOpenPartner?.(p)
            else if (directLink) window.open(directLink, '_blank', 'noopener,noreferrer')
          }

          return (
            <div
              key={p.name}
              className="flex items-center justify-between border-b border-line px-[18px] py-2.5 last:border-b-0"
              onClick={handleClick}
              style={{ cursor: hasSub || directLink ? 'pointer' : 'default' }}
            >
              <div className="flex items-center gap-[9px] text-xs font-semibold text-navy-900">
                <i className={`ti ${p.icon || 'ti-building'} text-sm text-ink-soft`} />
                {p.name}
                {hasSub && (
                  <span className="rounded-[20px] bg-blue-50 px-2 py-[1px] font-mono text-[10px] font-bold text-blue-600">
                    {subItems.length}
                  </span>
                )}
              </div>
              {hasSub && <i className="ti ti-chevron-right text-ink-soft" />}
              {directLink && <i className="ti ti-external-link text-ink-soft" />}
            </div>
          )
        })}
      </div>

      <div className="px-[18px] py-[11px] text-center">
        <a
          href="#"
          className="flex items-center justify-center gap-1 text-[11px] font-semibold text-blue-600 no-underline"
          onClick={(e) => { e.preventDefault(); setExpanded(!expanded) }}
        >
          <i className={`ti ${expanded ? 'ti-chevron-up' : 'ti-chevron-down'}`} />
          <span>{expanded ? 'ย่อรายการ' : `ดูเพิ่มเติม ${PARTNERS.length - 4} รายการ`}</span>
        </a>
      </div>
    </div>
  )
}