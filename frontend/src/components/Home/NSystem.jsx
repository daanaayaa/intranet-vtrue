import { useContent } from '../../context/ContentContext'
import { guessIcon } from '../../utils/guessIcon'

export function NSystem() {
  const { content } = useContent()
  const N_SYSTEMS = content.N_SYSTEMS

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white" id="sec-nsystem" data-card>
      <div className="flex items-center gap-2 border-b border-line px-[18px] py-[13px]">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-blue-tint">
          <i className="ti ti-world text-blue-600" />
        </div>
        <h3 className="text-[13px] font-bold text-navy-900">ระบบงานออนไลน์โรงพยาบาล</h3>
      </div>
      <div className="px-[18px] py-4">
        <div className="grid grid-cols-3 gap-[11px] max-[560px]:grid-cols-1">
          {N_SYSTEMS.map(s => (
            <div className="flex flex-col items-center gap-1.5 rounded-md border border-line px-[9px] py-3.5 text-center" key={s.name}>
              <div className="flex h-11 w-11 items-center justify-center rounded-[11px] bg-teal">
                <i className={`ti ${s.icon || guessIcon(s.name)} text-xl text-white`} />
              </div>
              <h4 className="text-xs font-bold text-navy-900">{s.name}</h4>
              <p className="text-[9.5px] leading-[1.3] text-ink-soft">{s.desc}</p>
              {/* ปุ่มเข้าระบบ — คลิกได้เฉพาะเมื่อมี URL (s.href) จาก Admin, เปิดแท็บใหม่เสมอ
                  ถ้าไม่มี URL ให้แสดงปุ่มปกติแบบ disabled แทน ไม่ทำลาย layout เดิม */}
              {s.href ? (
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-[3px] flex items-center gap-1 rounded-[20px] border border-line bg-white px-3 py-[5px] text-[10px] font-bold text-blue-600 no-underline"
                >
                  <i className="ti ti-external-link" />เข้าระบบ
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  title="ยังไม่ได้ตั้งค่า URL ของระบบนี้"
                  className="mt-[3px] flex cursor-not-allowed items-center gap-1 rounded-[20px] border border-line bg-white px-3 py-[5px] text-[10px] font-bold text-blue-600/40"
                >
                  <i className="ti ti-external-link" />เข้าระบบ
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}