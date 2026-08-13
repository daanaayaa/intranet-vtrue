// แปลง URL ของไฟล์ที่อัปโหลดให้เปิดจาก Frontend ได้ (relative path จาก backend -> absolute)
// รูปแบบเดียวกับ getFileUrl ใน Announcement.jsx / CollectionEditor.jsx / OnCall.jsx
function getFileUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`
  return `${API_URL}${url}`
}

// แต่ละ item ในโปรโมชันอาจมี "href" (ลิงก์ภายนอก) หรือ "file" (ไฟล์ที่อัปโหลด เช่น jpg/pdf) อย่างใดอย่างหนึ่ง
// href มาก่อนถ้ามีทั้งคู่ — เหมือน resolveLink ใน Announcement.jsx
function resolveLink(item) {
  if (item?.href) return item.href
  if (item?.file?.url) return getFileUrl(item.file.url)
  return null
}

export function PromoModal({ promo, onClose }) {
  if (!promo) return null

  const imgUrl = promo.img
    ? promo.img + (promo.img.indexOf('?') !== -1 ? '&' : '?') + 'v=' + (promo.updatedAt || promo.id || Date.now())
    : null

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[82vh] w-full max-w-[400px] overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 border-none"
        >
          <i className="ti ti-x text-[15px] text-ink" />
        </button>

        <div
          className="flex h-[110px] items-center justify-center"
          style={
            imgUrl
              ? { backgroundImage: 'url(' + imgUrl + ')', backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: 'linear-gradient(135deg, ' + promo.color + ', var(--color-blue-500))' }
          }
        >
          {!promo.img && <i className={`ti ${promo.icon} text-4xl text-white/85`} />}
        </div>

        <div className="p-[18px]">
          <span
            className="mb-2 inline-block rounded-[20px] px-2.5 py-[3px] text-[9px] font-bold text-white"
            style={{ background: promo.color }}
          >
            {promo.tag}
          </span>
          <h3 className="mb-3 text-[15px] font-bold text-ink">{promo.name}</h3>

          {promo.items?.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {promo.items.map((it) => {
                const link = resolveLink(it)

                const itemContent = (
                  <>
                    <i className={`ti ${it.icon} text-sm text-blue-600 shrink-0`} />
                    <span className="text-[12px] leading-tight text-ink">{it.label}</span>
                  </>
                )

                const itemClasses =
                  'flex items-center gap-2.5 rounded-lg border border-line bg-paper px-3 py-2.5 no-underline transition-colors hover:border-blue-500/40 hover:bg-blue-tint'

                // มีลิงก์ (href หรือ file) -> คลิกได้ เปิดแท็บใหม่
                // ไม่มี -> แสดงเฉยๆ ไม่ทำเป็นลิงก์
                return link ? (
                  <a
                    key={it.label}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={itemClasses}
                  >
                    {itemContent}
                  </a>
                ) : (
                  <div key={it.label} className={itemClasses}>
                    {itemContent}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}