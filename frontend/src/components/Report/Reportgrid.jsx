import { useContent } from '../../context/ContentContext'
import { guessIcon } from '../../utils/guessIcon'

const DEFAULT_FROM = '#1B4F9C'
const DEFAULT_TO = '#2A63B8'
const DEFAULT_GLOW = '27,79,156'

export function ReportGrid() {
  const { content } = useContent()
  const REPORTS = content.REPORTS

  return (
    <div className="mx-auto max-w-[1680px] px-8 pb-[70px] pt-[22px]">
      <div className="mb-10 flex items-start gap-3">
        <span className="mt-1 h-6 w-1 rounded-full bg-navy-900" />
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">Report</h2>
          <p className="mt-1 text-sm text-ink-soft">เลือกระบบรายงานที่ต้องการเข้าใช้งาน</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-10 gap-y-14">
        {REPORTS.map((r) => (
          <a
            key={r.id}
            href={r.href || '#'}
            {...(r.href && { target: '_blank', rel: 'noopener noreferrer' })}
            className="group flex w-[150px] flex-col items-center gap-3.5 no-underline"
          >
            <div
              className="flex h-[76px] w-[76px] items-center justify-center rounded-full transition-all duration-200 group-hover:-translate-y-1.5"
              style={{
                background: `linear-gradient(145deg, ${r.from || DEFAULT_FROM}, ${r.to || DEFAULT_TO})`,
                boxShadow: `0 8px 20px -6px rgba(${r.glow || DEFAULT_GLOW},0.45)`,
              }}
            >
              <i className={`ti ${r.icon || guessIcon(r.name)} text-[30px] text-white`} />
            </div>
            <span className="text-center text-[13.5px] font-semibold leading-snug text-ink transition-colors group-hover:text-blue-600">
              {r.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}