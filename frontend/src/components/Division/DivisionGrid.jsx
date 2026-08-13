import { useState, useEffect } from 'react'
import { useContent } from '../../context/ContentContext'
import { guessIcon } from '../../utils/guessIcon'

const DEFAULT_GRADIENT = ['#1B4F9C', '#2A63B8']

// แปลง URL ของไฟล์ที่อัปโหลดให้เปิดจาก Frontend ได้ (relative path จาก backend -> absolute)
// รูปแบบเดียวกับ getFileUrl ใน Announcement.jsx / CollectionEditor.jsx / OnCall.jsx
function getFileUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`
  return `${API_URL}${url}`
}

// แต่ละทีมย่อยอาจมี "href" (ลิงก์ภายนอก) หรือ "file" (ไฟล์ที่อัปโหลด เช่น jpg/pdf) อย่างใดอย่างหนึ่ง
// href มาก่อนถ้ามีทั้งคู่ — เหมือน resolveLink ใน Announcement.jsx
function resolveLink(item) {
  if (item?.href) return item.href
  if (item?.file?.url) return getFileUrl(item.file.url)
  return null
}

export function DivisionGrid({ initialActiveId }) {
  const { content } = useContent()
  const DIVISIONS = content.DIVISIONS
  const [active, setActive] = useState(null)

  // เปิด modal ของฝ่ายที่ถูกเลือกมาจาก dropdown ใน NavBar โดยอัตโนมัติ
  useEffect(() => {
    if (!initialActiveId) return
    const found = DIVISIONS.find((d) => d.id === initialActiveId)
    if (found) setActive(found)
  }, [initialActiveId, DIVISIONS])

  return (
    <div className="mx-auto max-w-[1680px] px-8 pb-[60px] pt-[22px]">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold text-ink">Division</h2>
        <p className="mt-1 text-sm text-ink-soft">เลือกฝ่ายงานเพื่อดูรายละเอียดและทีมย่อยภายใน</p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
        {DIVISIONS.map(d => (
          <div
            key={d.id}
            data-card
            onClick={() => setActive(d)}
            className="cursor-pointer overflow-hidden rounded-md border border-line bg-white transition-transform duration-150 hover:-translate-y-1 hover:shadow-lg"
          >
          <div
            className="flex h-[76px] items-center justify-center bg-cover bg-center"
            style={
              d.img
                ? { backgroundImage: `url(${d.img})` }
                : { background: `linear-gradient(135deg, ${(d.gradient || DEFAULT_GRADIENT)[0]}, ${(d.gradient || DEFAULT_GRADIENT)[1]})` }
            }
          >
            {!d.img && <i className={`ti ${d.icon || guessIcon(d.name)} text-[28px] text-white`} />}
          </div>
            <div className="p-[18px]">
              <h3 className="mb-1.5 text-[14.5px] font-bold text-ink">{d.name}</h3>
              <p className="mb-3 text-xs leading-relaxed text-ink-soft">{d.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-5"
          onClick={() => setActive(null)}
        >
          <div
            className="relative w-full max-w-[360px] max-h-[85vh] overflow-y-auto rounded-md bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActive(null)}
              className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 border-none"
            >
              <i className="ti ti-x text-[15px] text-ink" />
            </button>
            <div
              className="flex h-16 items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${(active.gradient || DEFAULT_GRADIENT)[0]}, ${(active.gradient || DEFAULT_GRADIENT)[1]})` }}
            >
              <i className={`ti ${active.icon || guessIcon(active.name)} text-2xl text-white`} />
            </div>
            <div className="p-[18px]">
              <h3 className="mb-1.5 text-[15px] font-bold text-ink">{active.name}</h3>
              <p className="mb-3.5 text-[12.5px] leading-relaxed text-ink-soft">{active.desc}</p>

              {active.subItems?.length > 0 && (
                <>
                  <div className="mb-2 text-[10.5px] font-bold uppercase tracking-wide text-ink-soft">
                    ทีมย่อยภายในฝ่าย
                  </div>
                  <div
                    className={
                      active.subItems.length > 4
                        ? 'mb-3.5 grid grid-cols-2 gap-1.5'
                        : 'mb-3.5 flex flex-col gap-1.5'
                    }
                  >
                    {active.subItems.map(s => {
                      const link = resolveLink(s)
                      const itemClasses =
                        'flex items-center gap-2 rounded-lg bg-paper px-2.5 py-2 transition-colors hover:bg-blue-tint'
                      const itemContent = (
                        <>
                          <i className={`ti ${s.icon} text-sm text-blue-600 shrink-0`} />
                          <span className="text-[12px] leading-tight text-ink">{s.label}</span>
                        </>
                      )

                      // มีลิงก์ (href หรือไฟล์แนบ) -> คลิกได้ เปิดแท็บใหม่
                      // ไม่มี -> แสดงเฉยๆ ไม่ทำเป็นลิงก์
                      return link ? (
                        <a
                          key={s.label}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${itemClasses} no-underline`}
                        >
                          {itemContent}
                        </a>
                      ) : (
                        <div key={s.label} className={itemClasses}>
                          {itemContent}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}