import { useState } from 'react'
import { useContent } from '../../context/ContentContext'
import { guessIcon } from '../../utils/guessIcon'

// แปลง URL ของไฟล์ที่อัปโหลดให้เปิดจาก Frontend ได้ (relative path จาก backend -> absolute)
// รูปแบบเดียวกับ getFileUrl ใน CollectionEditor.jsx
function getFileUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`
  return `${API_URL}${url}`
}

// แต่ละ item อาจมี "href" (ลิงก์ภายนอก) หรือ "file" (ไฟล์ PDF ที่อัปโหลด) อย่างใดอย่างหนึ่ง
// ตาม schema ใน ADMIN_SCHEMAS — ฟังก์ชันนี้หาว่าควรลิงก์ไปที่ไหน (href มาก่อน)
function resolveLink(item) {
  if (item?.href) return item.href
  if (item?.file?.url) return getFileUrl(item.file.url)
  return null
}

export function OnCall() {
  const { content } = useContent()
  const { ONCALL, NEWS } = content
  const [openTitle, setOpenTitle] = useState(null)

  const toggle = (title) => {
    setOpenTitle(openTitle === title ? null : title)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white" id="sec-oncall" data-card>
      <div className="flex items-center gap-2 border-b border-line px-[18px] py-[13px]">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-violet-tint">
          <i className="ti ti-user-shield text-violet" />
        </div>
        <h3 className="text-[13px] font-bold text-navy-900">ตารางเวรผู้บริหาร / พยาบาล</h3>
      </div>
      <div className="px-[18px] py-4">
        <div className="grid grid-cols-3 gap-2.5 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
          {ONCALL.map(o => {
            const link = resolveLink(o)
            const cardClasses =
              "flex items-center gap-2.5 rounded-md border border-line bg-white px-[13px] py-[11px] text-xs font-bold"
            const cardContent = (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-tint">
                  <i className={"ti " + (o.icon || guessIcon(o.label)) + " text-blue-600"} />
                </div>
                {o.label}
              </>
            )

            // มี href หรือ file (PDF) -> เปิดแท็บใหม่ได้ ถ้าไม่มีเลยแสดงเป็นการ์ดปกติ กดไม่ได้
            return link ? (
              <a
                key={o.label}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClasses + " no-underline transition-colors hover:border-blue-500/40"}
              >
                {cardContent}
              </a>
            ) : (
              <div key={o.label} className={cardClasses}>
                {cardContent}
              </div>
            )
          })}
        </div>
        <div className="mt-[18px] mb-3.5 h-px bg-line" />
        <div className="mb-2.5 flex items-center gap-2 text-[12.5px] font-bold text-navy-900" id="sec-nursing">
          <i className="ti ti-news text-base text-teal" />ข่าวประชาสัมพันธ์พยาบาล
        </div>
        <div className="flex flex-col">
          {NEWS.map(n => {
            const hasSub = n.subItems && n.subItems.length > 0
            const isOpen = openTitle === n.title
            // href/file ระดับบนสุดของข่าว ใช้เฉพาะตอนไม่มี subItems (ตาม schema)
            const topLink = !hasSub ? resolveLink(n) : null

            const headerInner = (
              <>
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-teal-tint">
                  <i className={"ti " + (n.icon || guessIcon(n.title)) + " text-sm text-teal"} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-navy-900">{n.title}</div>
                  <div className="mt-px text-[10px] text-ink-soft">{n.sub}</div>
                </div>
                {hasSub && (
                  <i className={"ti " + (isOpen ? "ti-chevron-up" : "ti-chevron-down") + " mt-1 text-sm text-ink-soft"} />
                )}
              </>
            )

            return (
              <div className="border-b border-line py-2.5 last:border-b-0" key={n.title}>
                {hasSub ? (
                  // มีรายการย่อย -> เป็นปุ่ม accordion เปิด/ปิด เหมือนเดิม ไม่ใช่ลิงก์
                  <button
                    type="button"
                    onClick={() => toggle(n.title)}
                    className="flex w-full items-start gap-2.5 text-left cursor-pointer"
                  >
                    {headerInner}
                  </button>
                ) : topLink ? (
                  // ไม่มีรายการย่อย แต่มี href/file -> ทั้งแถวคลิกได้ เปิดแท็บใหม่
                  <a
                    href={topLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-start gap-2.5 text-left no-underline"
                  >
                    {headerInner}
                  </a>
                ) : (
                  // ไม่มีทั้งรายการย่อยและลิงก์ -> แสดงข่าวปกติ กดไม่ได้
                  <div className="flex w-full items-start gap-2.5 text-left cursor-default">
                    {headerInner}
                  </div>
                )}

                {hasSub && isOpen && (
                  <div className="mt-2 ml-[38px] flex flex-col gap-px overflow-hidden rounded-md border border-line">
                    {n.subItems.map((item, i) => {
                      const rowClasses =
                        "flex items-center gap-2 bg-blue-50/40 px-2.5 py-2 text-[11px] font-medium text-navy-900 no-underline transition-colors hover:bg-blue-50"

                      const rowContent = (
                        <>
                          <i className="ti ti-point text-[8px] text-blue-600" />
                          {item.label}
                        </>
                      )

                      const itemLink = resolveLink(item)

                      // มี href หรือ file (PDF) -> เปิดแท็บใหม่ ไม่มีเลย -> แถวปกติ กดไม่ได้
                      return itemLink ? (
                        <a
                          key={i}
                          href={itemLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={rowClasses}
                        >
                          {rowContent}
                        </a>
                      ) : (
                        <div key={i} className={rowClasses + " cursor-default opacity-70"}>
                          {rowContent}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}