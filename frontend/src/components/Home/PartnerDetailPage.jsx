import { useState, useMemo, useEffect } from 'react'
import { buildDocs } from './PartnerList'

const PAGE_SIZE = 50

const normalize = (str) => (str || '').toLowerCase().replace(/\s+/g, '')

// แปลง URL ที่อยู่ในข้อความ (เช่น field contact) ให้กลายเป็นลิงก์กดได้
// รองรับกรณีมีช่องว่างแปลกๆ ต่อจาก https:// เช่น "https:// example.com"
function renderTextWithLinks(text) {
  if (!text) return null

  const urlRegex = /https?:\/\/\s*\S+/g
  const nodes = []
  let lastIndex = 0
  let match
  let key = 0

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const raw = match[0]
    const display = raw.trim()
    const href = raw.replace(/\s+/g, '')

    nodes.push(
      <a
        key={`link-${key++}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="break-all text-blue-600 underline"
      >
        {display}
      </a>
    )

    lastIndex = match.index + raw.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

// ตรวจสอบว่าวันหมดอายุ (expiry) ผ่านไปแล้วหรือไม่
// รองรับรูปแบบ "Exp.31/07/2569" หรือ "31/07/2569" (dd/mm/yyyy, ปี พ.ศ.)
function isExpired(expiry) {
  if (!expiry) return false

  const match = expiry.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!match) return false

  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  let year = parseInt(match[3], 10)

  if (
    Number.isNaN(day) ||
    Number.isNaN(month) ||
    Number.isNaN(year) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12
  ) {
    return false
  }

  // แปลงปี พ.ศ. เป็น ค.ศ. (ถ้าปีมากกว่า 2500 ถือว่าเป็น พ.ศ.)
  if (year > 2500) {
    year -= 543
  }

  const expiryDate = new Date(year, month - 1, day)
  if (Number.isNaN(expiryDate.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiryDate.setHours(0, 0, 0, 0)

  return expiryDate < today
}

export function PartnerDetailPage({ partner, onBack }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [zoomQr, setZoomQr] = useState(null) // เก็บ src ของรูป QR ที่กำลังขยายดู

  const subItems = partner?.subItems || []

  const filtered = useMemo(() => {
    if (!query) return subItems
    const q = normalize(query)
    return subItems.filter((s) => normalize(s.label).includes(q))
  }, [subItems, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    setPage(1)
  }, [query, partner])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (!partner) {
    return (
      <div className="mx-auto max-w-[900px] px-6 py-10">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-blue-600"
        >
          <i className="ti ti-arrow-left" />
          กลับหน้าแรก
        </button>
        <p className="mt-4 text-sm text-ink-soft">
          ไม่พบข้อมูลหมวดหมู่ที่เลือก
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 pb-16 pt-6">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-[13px] font-semibold text-blue-600"
      >
        <i className="ti ti-arrow-left" />
        กลับหน้าแรก
      </button>

      <div className="mb-5 flex items-center gap-2.5">
        <i
          className={`ti ${partner.icon || 'ti-building'} text-2xl text-blue-600`}
        />
        <h1 className="text-lg font-bold text-navy-900">{partner.name}</h1>

        <span className="rounded-[20px] bg-blue-600 px-2.5 py-0.5 font-mono text-[11px] font-bold text-white">
          {subItems.length}
        </span>
      </div>

      {subItems.length > 6 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2">
          <i className="ti ti-search text-ink-soft" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อบริษัท / โรงแรม..."
            className="w-full border-none text-[13px] outline-none"
          />
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mb-3 flex items-center justify-between text-[11.5px] text-ink-soft">
          <span>
            พบ {filtered.length} รายการ · หน้า {page}/{totalPages}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {paged.map((s, idx) => {
          const docs = buildDocs(s)
          const expired = isExpired(s.expiry)

          return (
            <div
              key={idx}
              className="rounded-md border border-line bg-white px-4 py-3"
            >
              <div
                className={`flex items-start gap-2 text-[13px] font-semibold ${
                  expired ? 'text-red-700' : 'text-navy-900'
                }`}
              >
                <i
                  className={`ti ${
                    expired ? 'ti-alert-triangle' : 'ti-building'
                  } mt-[2px] text-sm ${
                    expired ? 'text-red-600' : 'text-blue-600'
                  }`}
                />
                <span className="min-w-0 flex-1 break-words leading-snug">
                  {s.label}
                  {expired && (
                    <span className="ml-2 rounded-[20px] bg-red-600 px-2 py-[1px] text-[10px] font-bold text-white">
                      หมดอายุ
                    </span>
                  )}
                </span>
              </div>

              {(s.expiry || s.payorCode || s.contact || s.qr) && (
                <div className="mt-1.5 flex items-start gap-3 pl-[22px]">
                  <div className="min-w-0 flex-1 text-[11.5px] leading-relaxed text-ink-soft">
                    {s.expiry && <div>{s.expiry}</div>}
                    {s.payorCode && (
                      <div>Payor Code : {s.payorCode}</div>
                    )}
                    {s.contact && (
                      <div className="whitespace-pre-line">
                        กรณีมีปัญหาติดต่อ {renderTextWithLinks(s.contact)}
                      </div>
                    )}
                  </div>

                  {s.qr && (
                    <button
                      type="button"
                      onClick={() => setZoomQr(s.qr)}
                      className="shrink-0 rounded-md border border-line bg-white p-1"
                      title="คลิกเพื่อขยาย QR Code"
                    >
                      <img
                        src={s.qr}
                        alt={`QR Code - ${s.label}`}
                        className="h-20 w-20 object-contain"
                      />
                    </button>
                  )}
                </div>
              )}

              {docs.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 pl-[22px]">
                  {docs.map((d, di) => (
                    <a
                      key={di}
                      href={d.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-[20px] border border-blue-600 px-2.5 py-[3px] text-[11px] font-semibold text-blue-600 no-underline"
                    >
                      <i className="ti ti-file-text text-[11px]" />
                      {d.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="py-10 text-center text-[13px] text-ink-soft">
            ไม่พบรายการที่ค้นหา
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-soft disabled:opacity-40"
          >
            <i className="ti ti-chevron-left text-sm" />
          </button>

          <span className="px-2 text-[12px] font-semibold text-navy-900">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-soft disabled:opacity-40"
          >
            <i className="ti ti-chevron-right text-sm" />
          </button>
        </div>
      )}

      {/* Modal ขยายดู QR Code */}
      {zoomQr && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-6"
          onClick={() => setZoomQr(null)}
        >
          <div
            className="max-w-[90vw] rounded-lg bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setZoomQr(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft hover:bg-line/50"
              >
                <i className="ti ti-x text-base" />
              </button>
            </div>
            <img
              src={zoomQr}
              alt="QR Code ขยาย"
              className="max-h-[70vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}