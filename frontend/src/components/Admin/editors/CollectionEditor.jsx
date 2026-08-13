import { useEffect, useState } from 'react'
import { useContent } from '../../../context/ContentContext'
import { UPLOAD_FOLDERS } from '../../../config/uploadFolders'

function emptyFromFields(fields) {
  const obj = {}

  fields.forEach((f) => {
    if (f.type === 'sublist' || f.type === 'tree') {
      obj[f.key] = []
    } else if (f.type === 'boolean') {
      obj[f.key] = false
    } else {
      obj[f.key] = ''
    }
  })

  return obj
}

// ============================================================
// Upload File
// ============================================================

async function uploadFile(file, folder) {
  const formData = new FormData()

  formData.append('folder', folder)
  formData.append('file', file)

  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const response = await fetch(`${API_URL}/api/uploads`, {
    method: 'POST',
    body: formData,
  })

  let data = {}

  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(
      data.error || 'อัปโหลดไฟล์ไม่สำเร็จ'
    )
  }

  return data
}

// แปลง URL จาก Backend ให้เปิดจาก Frontend ได้
function getFileUrl(url) {
  if (!url) return ''

  if (
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url
  }

  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3001'

  return `${API_URL}${url}`
}

// ============================================================
// Folder Select (ใช้ร่วมกันทั้งรูปและไฟล์)
// ============================================================

function FolderSelect({ value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-ink-soft/70">
        เลือกโฟลเดอร์ปลายทาง
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line bg-white px-3 py-2 text-[12.5px] outline-none focus:border-blue-500"
      >
        <option value="">-- กรุณาเลือกโฟลเดอร์ --</option>

        {UPLOAD_FOLDERS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label} — {f.desc}
          </option>
        ))}
      </select>
    </div>
  )
}

// ============================================================
// Image Field
// ============================================================

function ImageFieldInput({ value, onChange }) {
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!selectedFolder) {
      setError('กรุณาเลือกโฟลเดอร์ก่อนอัปโหลด')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพ')
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      setError('ไฟล์รูปใหญ่เกินไป (จำกัด 3MB)')
      return
    }

    try {
      setError('')
      setUploading(true)
      const result = await uploadFile(file, selectedFolder)
      onChange(result.url)
    } catch (err) {
      setError(err.message || 'อัปโหลดรูปไม่สำเร็จ')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="space-y-2">
          <img
            src={getFileUrl(value)}
            alt=""
            className="h-32 w-auto rounded-lg border border-line object-contain"
          />
          <button
            type="button"
            onClick={() => {
              onChange('')
              setSelectedFolder('')
            }}
            className="w-fit text-[11px] font-semibold text-coral"
          >
            ลบรูปภาพ
          </button>
        </div>
      ) : (
        <>
          <FolderSelect value={selectedFolder} onChange={setSelectedFolder} />

          <label
            className={`mt-2 flex items-center justify-center rounded-lg border border-dashed border-line bg-paper/30 px-4 py-6 text-[12px] text-ink-soft ${
              selectedFolder
                ? 'cursor-pointer hover:bg-paper'
                : 'cursor-not-allowed opacity-50'
            }`}
          >
            {uploading
              ? 'กำลังอัปโหลด...'
              : selectedFolder
                ? 'เลือกไฟล์รูปภาพ'
                : 'กรุณาเลือกโฟลเดอร์ก่อน'}

            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={uploading || !selectedFolder}
              className="hidden"
            />
          </label>
        </>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-coral">{error}</p>
      )}
    </div>
  )
}

// ============================================================
// PDF / Image / Office File Field (แนบไฟล์ทั่วไป — รองรับ PDF, รูปภาพ, และเอกสาร Office)
// ============================================================

// รายชื่อประเภทไฟล์ที่อนุญาตสำหรับ field แบบ "file" (ใช้ร่วมกันทุก collection)
// เพิ่ม PowerPoint / Word / Excel (ทั้งแบบใหม่ .xxxx และแบบเก่า .xxx) เข้ามาแล้ว
// หมายเหตุ: ถ้าอัปโหลดแล้วยังโดนปฏิเสธอยู่ ให้เช็ค fileFilter ฝั่ง backend (multer) ด้วย
// เพราะ backend อาจมี allowlist ของตัวเองแยกต่างหากจากฝั่ง frontend นี้
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  // PowerPoint
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // .ppt
  // Word
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  // Excel
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
]
const ALLOWED_FILE_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,.webp,.pptx,.ppt,.docx,.doc,.xlsx,.xls'

function FileFieldInput({ value, onChange }) {
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('')

  const fileInfo =
    value && typeof value === 'object'
      ? value
      : null

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!selectedFolder) {
      setError('กรุณาเลือกโฟลเดอร์ก่อนอัปโหลด')
      return
    }

    // เบราว์เซอร์บางตัว/บางเวอร์ชันอ่าน mimetype ของไฟล์ Office เก่า (.doc/.xls/.ppt)
    // ไม่ตรงมาตรฐาน หรือบางทีก็ส่งมาเป็นค่าว่าง — เผื่อไว้ด้วยการเช็คนามสกุลไฟล์เป็น fallback
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
    const allowedExts = ALLOWED_FILE_ACCEPT.split(',')
    const isAllowed =
      ALLOWED_FILE_TYPES.includes(file.type) || allowedExts.includes(ext)

    if (!isAllowed) {
      setError(
        'รองรับเฉพาะไฟล์ PDF, รูปภาพ (JPG/PNG/WEBP), PowerPoint, Word หรือ Excel เท่านั้น'
      )
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('ไฟล์ใหญ่เกินไป (จำกัด 10MB)')
      return
    }

    try {
      setError('')
      setUploading(true)

      const result = await uploadFile(file, selectedFolder)

      onChange({
        id: result.id,
        name: result.original_name,
        url: result.url,
        size: result.size_bytes,
      })
    } catch (err) {
      setError(err.message || 'อัปโหลดไฟล์ไม่สำเร็จ')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      {fileInfo ? (
        <div className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2">
          <span className="truncate text-[12px]">
            {fileInfo.name}
          </span>

          <div className="flex items-center gap-3">
            {fileInfo.url && (
              <a
                href={getFileUrl(fileInfo.url)}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-blue-600"
              >
                เปิดดู
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                onChange('')
                setSelectedFolder('')
              }}
              className="text-[11px] font-semibold text-coral"
            >
              ลบ
            </button>
          </div>
        </div>
      ) : (
        <>
          <FolderSelect value={selectedFolder} onChange={setSelectedFolder} />

          <label
            className={`mt-2 flex items-center justify-center rounded-lg border border-dashed border-line bg-paper/30 px-4 py-6 text-center text-[12px] text-ink-soft ${
              selectedFolder
                ? 'cursor-pointer hover:bg-paper'
                : 'cursor-not-allowed opacity-50'
            }`}
          >
            {uploading
              ? 'กำลังอัปโหลด...'
              : selectedFolder
                ? 'เลือกไฟล์ PDF, รูปภาพ, PowerPoint, Word หรือ Excel'
                : 'กรุณาเลือกโฟลเดอร์ก่อน'}

            <input
              type="file"
              accept={ALLOWED_FILE_ACCEPT}
              onChange={handleFile}
              disabled={uploading || !selectedFolder}
              className="hidden"
            />
          </label>
        </>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-coral">
          {error}
        </p>
      )}
    </div>
  )
}

// ============================================================
// Field Input
// ============================================================

function FieldInput({ field, value, onChange }) {
  if (field.type === 'textarea') {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-line px-3 py-2 text-[12.5px] outline-none focus:border-blue-500"
      />
    )
  }

  if (field.type === 'boolean') {
    return (
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 cursor-pointer accent-navy-900"
        />

        <span className="text-[12px] text-navy-900">
          {value ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
        </span>
      </label>
    )
  }

  if (field.type === 'icon') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-line bg-paper">
          <i
            className={`ti ${
              value || 'ti-help-circle'
            } text-[18px] text-navy-900`}
          />
        </div>

        <input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="เช่น ti-home"
          className="w-full rounded-md border border-line px-3 py-2 text-[12.5px] outline-none focus:border-blue-500"
        />
      </div>
    )
  }

  if (field.type === 'color') {
    const isHex = /^#/.test(value || '')

    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isHex ? value : '#1B3A6B'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-11 flex-shrink-0 cursor-pointer rounded-md border border-line"
        />

        <input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#1B3A6B"
          className="w-full rounded-md border border-line px-3 py-2 text-[12.5px] outline-none focus:border-blue-500"
        />
      </div>
    )
  }

  if (field.type === 'image') {
    return <ImageFieldInput value={value} onChange={onChange} />
  }

  if (field.type === 'file') {
    return <FileFieldInput value={value} onChange={onChange} />
  }

  return (
    <input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={
        field.type === 'url'
          ? 'https://...'
          : ''
      }
      className="w-full rounded-md border border-line px-3 py-2 text-[12.5px] outline-none focus:border-blue-500"
    />
  )
}

// ============================================================
// Sub List Editor
// ============================================================

function SubListEditor({ field, items, onChange }) {
  const list = Array.isArray(items) ? items : []
  const [primaryField, ...restFields] = field.fields
  const [openIdx, setOpenIdx] = useState(null)

  const updateItem = (idx, key, value) => {
    onChange(list.map((it, i) => (i === idx ? { ...it, [key]: value } : it)))
  }

  const addItem = () => {
    onChange([...list, emptyFromFields(field.fields)])
    setOpenIdx(list.length)
  }

  const removeItem = (idx) => {
    onChange(list.filter((_, i) => i !== idx))
    setOpenIdx(null)
  }

  const moveItem = (idx, dir) => {
    const target = idx + dir
    if (target < 0 || target >= list.length) return

    const next = [...list]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-bold text-navy-900">{field.label}</p>
          <p className="text-[10px] text-ink-soft">{list.length} รายการ</p>
        </div>

        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 rounded-md border-none bg-navy-900 px-2.5 py-1.5 text-[10.5px] font-bold text-white"
        >
          <i className="ti ti-plus" />
          เพิ่มรายการ
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {list.map((item, idx) => {
          const isOpen = openIdx === idx

          return (
            <div
              key={idx}
              className={`overflow-hidden rounded-lg border bg-white transition-shadow ${
                isOpen
                  ? 'border-blue-300 shadow-[0_2px_8px_rgba(37,99,235,.08)]'
                  : 'border-line'
              }`}
            >
              <div className="flex items-center gap-2 px-2.5 py-2">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-900/[.06] text-[10px] font-bold text-navy-900">
                  {idx + 1}
                </span>

                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex flex-1 items-center gap-1.5 overflow-hidden border-none bg-transparent text-left"
                >
                  <span className="truncate text-[12px] font-semibold text-navy-900">
                    {primaryField
                      ? item[primaryField.key] || '(ยังไม่ตั้งชื่อ)'
                      : `รายการที่ ${idx + 1}`}
                  </span>

                  {restFields.length > 0 && (
                    <i
                      className={`ti ti-chevron-down flex-shrink-0 text-[12px] text-ink-soft transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                <RowActions
                  size="xs"
                  onUp={() => moveItem(idx, -1)}
                  onDown={() => moveItem(idx, 1)}
                  onDelete={() => removeItem(idx)}
                />
              </div>

              {isOpen && (
                <div className="border-t border-line bg-paper/30 px-2.5 py-2.5">
                  {primaryField && (
                    <div className="mb-2">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-ink-soft/70">
                        {primaryField.label}
                      </label>

                      <FieldInput
                        field={primaryField}
                        value={item[primaryField.key]}
                        onChange={(v) => updateItem(idx, primaryField.key, v)}
                      />
                    </div>
                  )}

                  {restFields.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {restFields.map((f) => (
                        <div
                          key={f.key}
                          className={
                            f.type === 'textarea' ||
                            f.type === 'image' ||
                            f.type === 'file' ||
                            f.type === 'sublist' ||
                            f.type === 'tree'
                              ? 'col-span-2'
                              : ''
                          }
                        >
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-ink-soft/70">
                            {f.label}
                          </label>

                          {f.type === 'sublist' ? (
                            <SubListEditor
                              field={f}
                              items={item[f.key]}
                              onChange={(v) => updateItem(idx, f.key, v)}
                            />
                          ) : (
                            <FieldInput
                              field={f}
                              value={item[f.key]}
                              onChange={(v) => updateItem(idx, f.key, v)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {list.length === 0 && (
          <p className="rounded-lg border border-dashed border-line py-4 text-center text-[11px] text-ink-soft">
            ยังไม่มีรายการย่อย — กด "เพิ่มรายการ" เพื่อเริ่มต้น
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Tree Editor
// ============================================================

function emptyTreeNode() {
  return { label: '' }
}

function TreeNodeEditor({ nodes, onChange, depth = 0 }) {
  const list = Array.isArray(nodes) ? nodes : []

  const updateNode = (idx, patch) => {
    onChange(list.map((n, i) => (i === idx ? { ...n, ...patch } : n)))
  }

  const removeNode = (idx) => {
    onChange(list.filter((_, i) => i !== idx))
  }

  const addNode = () => {
    onChange([...list, emptyTreeNode()])
  }

  const addChild = (idx) => {
    const node = list[idx]
    const children = Array.isArray(node.children) ? node.children : []

    updateNode(idx, { children: [...children, emptyTreeNode()] })
  }

  const moveNode = (idx, dir) => {
    const target = idx + dir
    if (target < 0 || target >= list.length) return

    const next = [...list]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  return (
    <div className={depth > 0 ? 'mt-2 border-l-2 border-line pl-3' : ''}>
      <div className="flex flex-col gap-2">
        {list.map((node, idx) => (
          <div key={idx}>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-navy-900/[.06] text-[10px] font-bold text-navy-900">
                {idx + 1}
              </span>

              <input
                value={node.label || ''}
                onChange={(e) => updateNode(idx, { label: e.target.value })}
                placeholder="ข้อความหัวข้อ"
                className="flex-1 rounded-lg border border-line px-2.5 py-2 text-[12px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {depth === 0 && (
                <input
                  value={node.icon || ''}
                  onChange={(e) => updateNode(idx, { icon: e.target.value })}
                  placeholder="ti-icon"
                  className="w-24 flex-shrink-0 rounded-lg border border-line px-2 py-2 text-[11.5px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              )}

              <button
                type="button"
                onClick={() => addChild(idx)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border-none bg-blue-50 text-blue-600 hover:bg-blue-100"
                aria-label="เพิ่มหัวข้อย่อย"
                title="เพิ่มหัวข้อย่อย"
              >
                <i className="ti ti-plus" />
              </button>

              <RowActions
                onUp={() => moveNode(idx, -1)}
                onDown={() => moveNode(idx, 1)}
                onDelete={() => removeNode(idx)}
              />
            </div>

            {Array.isArray(node.children) && node.children.length > 0 && (
              <TreeNodeEditor
                nodes={node.children}
                onChange={(next) => updateNode(idx, { children: next })}
                depth={depth + 1}
              />
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addNode}
        className="mt-2 flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-[10.5px] font-semibold text-navy-900 hover:bg-paper"
      >
        <i className="ti ti-plus" />
        เพิ่มหัวข้อ{depth > 0 ? 'ย่อย' : ''}
      </button>
    </div>
  )
}

// ============================================================
// Row Actions
// ============================================================

function RowActions({ onUp, onDown, onDelete, size = 'sm' }) {
  const btnSize = size === 'xs' ? 'h-6 w-6' : size === 'sm' ? 'h-7 w-7' : 'h-6 w-6'
  const iconSize = size === 'xs' ? 'text-[11px]' : size === 'sm' ? 'text-[13px]' : 'text-[11px]'

  return (
    <div className="flex flex-shrink-0 items-center rounded-md border border-line bg-paper/30">
      <button
        type="button"
        onClick={onUp}
        className={`flex ${btnSize} items-center justify-center rounded-md border-none bg-transparent text-ink-soft hover:bg-white`}
        aria-label="เลื่อนขึ้น"
      >
        <i className={`ti ti-arrow-up ${iconSize}`} />
      </button>

      <div className="h-4 w-px bg-line" />

      <button
        type="button"
        onClick={onDown}
        className={`flex ${btnSize} items-center justify-center rounded-md border-none bg-transparent text-ink-soft hover:bg-white`}
        aria-label="เลื่อนลง"
      >
        <i className={`ti ti-arrow-down ${iconSize}`} />
      </button>

      <div className="h-4 w-px bg-line" />

      <button
        type="button"
        onClick={onDelete}
        className={`flex ${btnSize} items-center justify-center rounded-md border-none bg-transparent text-coral hover:bg-coral-tint`}
        aria-label="ลบรายการนี้"
      >
        <i className={`ti ti-trash ${iconSize}`} />
      </button>
    </div>
  )
}

// ============================================================
// Collection Editor
// ============================================================

export function CollectionEditor({ schema }) {
  const { content, updateCollection } = useContent()
  const savedItems = content[schema.key] || []

  const [draftItems, setDraftItems] = useState(savedItems)
  const [openIdx, setOpenIdx] = useState(null)
  const [justSaved, setJustSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    setDraftItems(content[schema.key] || [])
    setOpenIdx(null)
    setJustSaved(false)
    setSaveError('')
  }, [schema.key, content])

  const isDirty = JSON.stringify(draftItems) !== JSON.stringify(savedItems)

  const updateItem = (idx, key, value) => {
    setDraftItems((items) =>
      items.map((it, i) => (i === idx ? { ...it, [key]: value } : it))
    )
  }

  const addItem = () => {
    setDraftItems((items) => [...items, emptyFromFields(schema.fields)])
    setOpenIdx(draftItems.length)
  }

  const removeItem = (idx) => {
    if (!window.confirm('ยืนยันลบรายการนี้?')) return

    setDraftItems((items) => items.filter((_, i) => i !== idx))
    setOpenIdx(null)
  }

  const moveItem = (idx, dir) => {
    const target = idx + dir
    if (target < 0 || target >= draftItems.length) return

    setDraftItems((items) => {
      const next = [...items]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  // สำคัญ: updateCollection เป็น async (ยิงไปบันทึกที่ Neon) ต้อง await
  // และดัก error ไว้ (เช่น token หมดอายุ ยังไม่ login) ไม่งั้นจะขึ้น "บันทึกแล้ว"
  // ทั้งที่จริงๆ ไม่สำเร็จ
  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveError('')
      await updateCollection(schema.key, draftItems)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 1500)
    } catch (err) {
      setSaveError(err.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    if (!window.confirm('ยกเลิกการแก้ไขทั้งหมดที่ยังไม่บันทึก?')) return

    setDraftItems(savedItems)
    setOpenIdx(null)
    setSaveError('')
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-navy-900">{schema.label}</h2>

          {schema.description && (
            <p className="mt-0.5 text-[12px] text-ink-soft">{schema.description}</p>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="rounded-lg border border-line bg-white px-3.5 py-2 text-[11.5px] font-semibold text-ink-soft hover:bg-paper disabled:opacity-60"
            >
              ยกเลิกการแก้ไข
            </button>
          )}

          <button
            type="button"
            onClick={addItem}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-[11.5px] font-bold text-navy-900 hover:bg-paper disabled:opacity-60"
          >
            <i className="ti ti-plus" />
            เพิ่มรายการใหม่
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={`flex items-center gap-1.5 rounded-lg border-none px-3.5 py-2 text-[11.5px] font-bold text-white ${
              isDirty && !saving ? 'bg-navy-900 hover:bg-navy-800' : 'cursor-not-allowed bg-navy-900/40'
            }`}
          >
            <i className={justSaved ? 'ti ti-check' : 'ti ti-device-floppy'} />
            {saving ? 'กำลังบันทึก...' : justSaved ? 'บันทึกแล้ว ✓' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </div>
      </div>

      {saveError && (
        <p className="mb-3 rounded-md bg-coral-tint px-3 py-2 text-[12px] font-semibold text-coral">
          {saveError}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {draftItems.map((item, idx) => {
          const isOpen = openIdx === idx
          const title = schema.itemLabel
            ? schema.itemLabel(item)
            : item.label || item.name || item.title || `รายการที่ ${idx + 1}`

          return (
            <div
              key={idx}
              className={`overflow-hidden rounded-xl border bg-white transition-shadow ${
                isOpen
                  ? 'border-blue-300 shadow-[0_4px_16px_rgba(37,99,235,.08)]'
                  : 'border-line shadow-[0_1px_3px_rgba(11,40,80,.04)] hover:shadow-[0_2px_8px_rgba(11,40,80,.06)]'
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-navy-900/[.06] text-[11px] font-bold text-navy-900">
                  {idx + 1}
                </span>

                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex flex-1 items-center gap-2 overflow-hidden border-none bg-transparent text-left"
                >
                  <span className="truncate text-[13.5px] font-semibold text-navy-900">
                    {title || '(ยังไม่ตั้งชื่อ)'}
                  </span>

                  <i
                    className={`ti ti-chevron-down flex-shrink-0 text-[13px] text-ink-soft transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <RowActions
                  onUp={() => moveItem(idx, -1)}
                  onDown={() => moveItem(idx, 1)}
                  onDelete={() => removeItem(idx)}
                />
              </div>

              {isOpen && (
                <div className="border-t border-line bg-paper/30 px-4 py-4">
                  <div className="grid grid-cols-2 gap-3.5">
                    {schema.fields.map((f) => (
                      <div
                        key={f.key}
                        className={
                          f.type === 'textarea' ||
                          f.type === 'sublist' ||
                          f.type === 'image' ||
                          f.type === 'file' ||
                          f.type === 'tree'
                            ? 'col-span-2'
                            : ''
                        }
                      >
                        <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wide text-ink-soft/70">
                          {f.label}
                        </label>

                        {f.type === 'sublist' ? (
                          <SubListEditor
                            field={f}
                            items={item[f.key]}
                            onChange={(v) => updateItem(idx, f.key, v)}
                          />
                        ) : f.type === 'tree' ? (
                          <div className="rounded-xl border border-line bg-paper/40 p-3">
                            <TreeNodeEditor
                              nodes={item[f.key]}
                              onChange={(v) => updateItem(idx, f.key, v)}
                            />
                          </div>
                        ) : (
                          <FieldInput
                            field={f}
                            value={item[f.key]}
                            onChange={(v) => updateItem(idx, f.key, v)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {draftItems.length === 0 && (
          <p className="rounded-xl border border-dashed border-line py-10 text-center text-[12px] text-ink-soft">
            ยังไม่มีรายการ กด "+ เพิ่มรายการใหม่" เพื่อเริ่มต้น
          </p>
        )}
      </div>

      {isDirty && (
        <div className="sticky bottom-4 mt-4 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-700">
            <i className="ti ti-alert-circle text-[14px]" />
            มีการแก้ไขที่ยังไม่ได้บันทึก
          </span>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md border-none bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกตอนนี้'}
          </button>
        </div>
      )}
    </div>
  )
}