import { getProjects } from './demoApi'
import { fetchMoveApplyList } from './moveApply'

const ACCEPT_STAGE_NAMES = ['新建验收', '基础项录入', '交付追踪', '验收项录入', '模具交付建档']

function norm(s) {
  return String(s || '').trim().toLowerCase()
}

function describeAcceptProgress(completedUpToIndex) {
  const n = Number(completedUpToIndex)
  if (!Number.isFinite(n) || n < 0) {
    return { summary: '无验收进度或未建档', done: false, currentStage: '—' }
  }
  if (n >= 4) {
    return { summary: '验收流程已全部完成', done: true, currentStage: '—' }
  }
  const next = ACCEPT_STAGE_NAMES[n + 1] || '—'
  return {
    summary: `验收流程进行中（已完成至「${ACCEPT_STAGE_NAMES[n]}」）`,
    done: false,
    currentStage: next
  }
}

function moveApplyStatusLabel(status) {
  const map = {
    draft: '草稿 / 编辑中',
    pending: '待审批',
    approved: '审批已通过',
    rejected: '已驳回'
  }
  return map[status] || status || '—'
}

function moveMatchesKeyword(row, keyword, kwNorm) {
  const meta = row.meta && typeof row.meta === 'object' ? row.meta : {}
  const fields = [
    row.applyNo,
    meta.transferNo,
    meta.projectCode,
    row.partNo
  ].map((x) => String(x || '').trim())
  for (const f of fields) {
    if (!f) continue
    if (norm(f) === kwNorm) return true
    if (kwNorm.length >= 4 && (norm(f).includes(kwNorm) || kwNorm.includes(norm(f)))) return true
  }
  return false
}

/**
 * 按移模申请单号 / 移模编号 / 项目代号（meta）或验收项目代号 / 项目 id 查询流程概况。
 */
export async function queryProcessFlowByKeyword(rawKeyword) {
  const keyword = String(rawKeyword || '').trim()
  if (!keyword) {
    return { success: false, message: '请输入单号或项目代号' }
  }
  const kwNorm = norm(keyword)

  const [{ list: projects = [] }, moveRes] = await Promise.all([
    getProjects(),
    fetchMoveApplyList({ includeAllStatuses: true })
  ])
  const moves = (moveRes && moveRes.data && moveRes.data.list) || []

  const projectHits = []
  for (const p of projects) {
    const code = String(p.code || '').trim()
    if (norm(code) === kwNorm || String(p.id) === keyword) {
      projectHits.push(p)
    }
  }
  const dedupeProjects = []
  const seenPid = new Set()
  for (const p of projectHits) {
    const id = Number(p.id)
    if (seenPid.has(id)) continue
    seenPid.add(id)
    dedupeProjects.push(p)
  }

  const moveHits = moves.filter((m) => moveMatchesKeyword(m, keyword, kwNorm))

  const acceptSummaries = dedupeProjects.map((p) => {
    const flow = describeAcceptProgress(p.completedUpToIndex)
    return {
      type: 'accept',
      projectId: p.id,
      projectCode: p.code || '',
      owner: p.owner || '',
      updatedAt: p.updatedAt || '',
      acceptSummary: flow.summary,
      acceptDone: flow.done,
      currentAcceptStage: flow.currentStage
    }
  })

  const moveSummaries = moveHits.map((m) => {
    const meta = m.meta && typeof m.meta === 'object' ? m.meta : {}
    return {
      type: 'move',
      applyNo: m.applyNo || '',
      transferNo: meta.transferNo || '',
      projectCode: meta.projectCode || '',
      partNo: m.partNo || '',
      applicant: m.applicant || meta.applicant || '',
      applyTime: m.applyTime || '',
      status: m.status || '',
      statusLabel: moveApplyStatusLabel(m.status),
      toolName: m.toolName || ''
    }
  })

  if (!acceptSummaries.length && !moveSummaries.length) {
    return {
      success: true,
      data: { acceptRows: [], moveRows: [], empty: true }
    }
  }

  return {
    success: true,
    data: {
      acceptRows: acceptSummaries,
      moveRows: moveSummaries,
      empty: false
    }
  }
}
