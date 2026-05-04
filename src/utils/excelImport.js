import * as XLSX from 'xlsx'
import { cellText } from '@/utils/excelExport'

/**
 * 读取与「下载模板」相同表头的 Excel，返回行对象数组（不含表头）。
 * @param {File} file
 * @param {Array<{ header: string, key: string }>} columns 与导出列定义一致
 * @returns {Promise<{ rows: object[], error?: string }>}
 */
export async function parseExcelToRows(file, columns) {
  if (!file || !Array.isArray(columns) || columns.length === 0) {
    return { rows: [], error: '参数无效' }
  }

  let workbook
  try {
    const buf = await file.arrayBuffer()
    workbook = XLSX.read(buf, { type: 'array' })
  } catch {
    return { rows: [], error: '无法解析该文件，请确认是否为有效的 Excel 文件' }
  }

  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    return { rows: [], error: '工作簿中没有工作表' }
  }

  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
  if (!aoa.length) {
    return { rows: [], error: '文件中没有数据' }
  }

  const fileHeaders = (aoa[0] || []).map((h) => cellText(h))
  const expected = columns.map((c) => cellText(c.header))

  if (fileHeaders.length < expected.length) {
    return {
      rows: [],
      error: `表头列数不足：需要 ${expected.length} 列（与下载模板一致），当前 ${fileHeaders.length} 列。`
    }
  }

  for (let i = 0; i < expected.length; i++) {
    if (fileHeaders[i] !== expected[i]) {
      return {
        rows: [],
        error: `第 ${i + 1} 列应为「${expected[i]}」，当前为「${fileHeaders[i] || '(空)'}」。请勿修改表头，请使用「下载模板」生成的文件。`
      }
    }
  }

  const rows = []
  for (let r = 1; r < aoa.length; r++) {
    const line = aoa[r]
    if (!line || !line.length) continue
    const obj = {}
    let any = false
    for (let c = 0; c < columns.length; c++) {
      const val = cellText(line[c])
      obj[columns[c].key] = val
      if (val) any = true
    }
    if (any) rows.push(obj)
  }

  return { rows }
}
