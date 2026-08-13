import { useState } from 'react'
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

export function ExpandableCards() {
  const { content } = useContent()
  const { FINANCE_DOCS, TEMPLATE_OPTIONS } = content
  const [open, setOpen] = useState(null)
  const toggle = (key) => setOpen(open === key ? null : key)

  // เลือก template จาก dropdown แล้วให้ผู้ใช้เลือกเองว่าจะเซฟไฟล์ไว้ที่ไหน
  // ใช้ File System Access API (showSaveFilePicker) ซึ่งจะเปิดหน้าต่าง "บันทึกเป็น" ของเครื่อง
  // ให้เลือกโฟลเดอร์ปลายทางได้จริง — รองรับเฉพาะ Chrome/Edge (Chromium)
  //
  // สำคัญ: ต้องเรียก showSaveFilePicker() ทันทีเป็นบรรทัดแรกในนี้ ห้ามมี await ใดๆ (เช่น fetch)
  // มาคั่นก่อน เพราะ browser ต้องเห็นว่าถูกเรียกจาก "user gesture" (การคลิก) สดๆ เท่านั้น
  // ถ้ามี await คั่นก่อน แม้แค่ fetch เร็วๆ ก็ตาม browser จะถือว่า gesture หมดอายุแล้ว แล้ว
  // throw error เงียบๆ (ไม่ใช่ AbortError) ซึ่งจะหลุดไป fallback ดาวน์โหลดอัตโนมัติทันทีโดยไม่ถาม
  // (นี่คือสาเหตุที่ก่อนหน้านี้มันดาวน์โหลดเลยไม่ขึ้นหน้าต่างให้เลือก)
  const handleTemplateSelect = async (e) => {
    const idx = e.target.value
    if (idx === '') return
    const t = TEMPLATE_OPTIONS[idx]
    const link = resolveLink(t)
    e.target.value = '' // รีเซ็ตกลับเป็น placeholder เผื่อเลือกซ้ำอันเดิมได้อีก
    if (!link) return

    const filename = t.file?.name || `${t.label}.pptx`
    const ext = filename.split('.').pop()?.toLowerCase()
    const mimeByExt = {
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ppt: 'application/vnd.ms-powerpoint',
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
    }

    // เช็คว่าเบราว์เซอร์รองรับ API นี้ไหม (Chrome/Edge เท่านั้น) — ถ้าไม่รองรับข้ามไป fallback เลย
    if (window.showSaveFilePicker) {
      let handle
      try {
        // เรียกทันทีตรงนี้ ยังอยู่ในช่วง user gesture จากการคลิก dropdown
        handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: mimeByExt[ext]
            ? [{ description: 'ไฟล์เอกสาร', accept: { [mimeByExt[ext]]: [`.${ext}`] } }]
            : undefined,
        })
      } catch (pickerErr) {
        // ผู้ใช้กด "ยกเลิก" ในหน้าต่างเลือกโฟลเดอร์ -> จบเลย ไม่ต้อง fallback ดาวน์โหลดซ้ำ
        if (pickerErr?.name === 'AbortError') return
        // เหตุผลอื่น (เช่นเบราว์เซอร์ block การเรียก) ค่อย fallback ไปดาวน์โหลดแบบเดิมด้านล่าง
        handle = null
      }

      if (handle) {
        try {
          const res = await fetch(link)
          if (!res.ok) throw new Error('fetch failed')
          const blob = await res.blob()
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
        } catch (writeErr) {
          window.open(link, '_blank', 'noopener,noreferrer')
        }
        return
      }
    }

    // Fallback: เบราว์เซอร์ไม่รองรับ showSaveFilePicker หรือเรียกไม่ได้
    // -> ดาวน์โหลดเข้าโฟลเดอร์ดาวน์โหลดเริ่มต้นของเครื่องแทน
    try {
      const res = await fetch(link)
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div
        className="cursor-pointer rounded-lg border border-line bg-white p-[17px]"
        id="sec-finance"
        data-card
        onClick={() => toggle('a')}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-[11px] flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-blue-tint">
              <i className="ti ti-cash text-lg text-blue-600" />
            </div>
            <h3 className="text-[13px] font-bold text-navy-900">การมอบหมายอำนาจการเงิน</h3>
            <p className="mt-px text-[11px] text-ink-soft">กลุ่ม 6</p>
          </div>
          <i className={`ti ti-chevron-down text-[15px] text-ink-soft transition-transform duration-200 ${open === 'a' ? 'rotate-180' : ''}`} />
        </div>
        <div className={`mt-2.5 border-t border-line pt-2.5 ${open === 'a' ? 'block' : 'hidden'}`}>
          {FINANCE_DOCS.map((doc, i) => {
            const link = resolveLink(doc)
            const rowContent = (
              <>
                <i className={`ti ${doc.icon || guessIcon(doc.text)} text-[13px] text-blue-600`} />
                {doc.text}
              </>
            )
            const rowClasses = 'flex items-center gap-2 border-b border-line py-2 text-[11px] last:border-b-0'

            // มีลิงก์ (href หรือไฟล์แนบ) -> คลิกได้ เปิดแท็บใหม่
            // ไม่มี -> แสดงเฉยๆ ไม่ทำเป็นลิงก์
            return link ? (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`${rowClasses} no-underline`}
              >
                {rowContent}
              </a>
            ) : (
              <div key={i} className={rowClasses}>
                {rowContent}
              </div>
            )
          })}
        </div>
      </div>
      <div
        className="cursor-pointer rounded-lg border border-line bg-white p-[17px]"
        id="sec-template"
        data-card
        onClick={() => toggle('b')}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-[11px] flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-blue-tint">
              <i className="ti ti-presentation text-lg text-blue-600" />
            </div>
            <h3 className="text-[13px] font-bold text-navy-900">Template Powerpoint</h3>
            <p className="mt-px text-[11px] text-ink-soft">Re-branding template</p>
          </div>
          <i className={`ti ti-chevron-down text-[15px] text-ink-soft transition-transform duration-200 ${open === 'b' ? 'rotate-180' : ''}`} />
        </div>
        <div className={`mt-2.5 border-t border-line pt-2.5 ${open === 'b' ? 'block' : 'hidden'}`}>
          <select
            onClick={(e) => e.stopPropagation()}
            onChange={handleTemplateSelect}
            defaultValue=""
            className="w-full rounded-xs border border-line px-[9px] py-2 text-xs"
          >
            <option value="" disabled>
              เลือกดูรายการ...
            </option>
            {TEMPLATE_OPTIONS.map((t, i) => {
              const link = resolveLink(t)
              return (
                <option key={i} value={i} disabled={!link}>
                  {t.label}
                  {!link ? ' (ยังไม่มีลิงก์/ไฟล์)' : ''}
                </option>
              )
            })}
          </select>
          {TEMPLATE_OPTIONS.length === 0 && (
            <p className="mt-2 text-center text-[11px] text-ink-soft">ยังไม่มีรายการ</p>
          )}
        </div>
      </div>
    </div>
  )
}