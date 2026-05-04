import * as XLSX from 'xlsx'

/** 单元格导出/导入统一转字符串（与模板一致） */
export function cellText(v) {
  if (v == null || v === '') return ''
  return String(v).trim()
}

/**
 * 生成并下载 .xlsx
 * @param {Object} options
 * @param {string} options.filename 含或不含 .xlsx
 * @param {string} [options.sheetName='Sheet1'] 工作表名（≤31 字）
 * @param {Array<{ header: string, key?: string, getValue?: (row: object) => unknown }>} options.columns 与表格列一致（不含勾选、操作）
 * @param {object[]} [options.rows=[]] 当前列表数据（与页面表格字段一致）
 * @param {boolean} [options.headersOnly=false] true 时仅表头一行，用作导入模板
 */
export function downloadExcel({ filename, sheetName = 'Sheet1', columns, rows = [], headersOnly = false }) {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error('downloadExcel: columns 不能为空')
  }

  const headerRow = columns.map((c) => c.header)
  const aoa = [headerRow]

  if (!headersOnly) {
    for (const row of rows) {
      aoa.push(
        columns.map((col) => {
          const raw = typeof col.getValue === 'function' ? col.getValue(row) : row[col.key]
          return cellText(raw)
        })
      )
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  const safeSheet = String(sheetName || 'Sheet1').slice(0, 31)
  XLSX.utils.book_append_sheet(wb, ws, safeSheet)
  const name = String(filename).toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(wb, name)
}

/** 文件名后缀：YYYYMMDD_HHmm */
export function timestampedFilename(prefix) {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${prefix}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`
}
