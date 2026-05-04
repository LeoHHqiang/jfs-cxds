import { ref } from 'vue'
import { completeProjectStage } from '@/api'
import { clearAcceptStageContext, readAcceptStageContext } from '@/utils/acceptStageContext'

/**
 * @param {string} routeKey accept-approve 子路由：base | delivery | accept | mold-archive
 */
export function useAcceptStageComplete(routeKey) {
  const busy = ref(false)

  async function onComplete() {
    const ctx = readAcceptStageContext()
    if (!ctx?.projectId) {
      window.alert('请先在「验收管理」列表中，点击该项目的阶段名称进入本页，再点击「完成节点」。')
      return
    }
    busy.value = true
    try {
      await completeProjectStage({ id: ctx.projectId, route: routeKey })
      clearAcceptStageContext()
      window.location.hash = '#/accept-approve/create'
      window.alert('当前阶段已标记完成，已返回验收管理列表，进度条已更新。')
    } catch (e) {
      console.error('[验收阶段完成]', e)
      window.alert('标记失败，请稍后重试。')
    } finally {
      busy.value = false
    }
  }

  return { onComplete, busy }
}
