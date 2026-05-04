import { ref } from 'vue'

/**
 * 在筛查区与表格之间放置横向滚动条：顶部 proxy 与表格容器 scrollLeft 双向同步。
 * @param {import('vue').Ref<HTMLElement | null>} shellRef 实际承载横向滚动的表格外层（overflow-x: auto）
 */
export function useSyncedHorizontalScrollProxy(shellRef) {
  const hScrollProxyRef = ref(null)
  const hProxyInnerWidth = ref(1)
  const showHProxy = ref(false)
  let syncing = false

  function shell() {
    return shellRef.value
  }

  function updateHScrollMetrics() {
    const el = shell()
    const proxy = hScrollProxyRef.value
    if (!el) {
      showHProxy.value = false
      return
    }
    const sw = el.scrollWidth
    const cw = el.clientWidth
    showHProxy.value = sw > cw + 1
    hProxyInnerWidth.value = Math.max(sw, cw, 1)
    if (proxy && showHProxy.value) {
      syncing = true
      proxy.scrollLeft = el.scrollLeft
      syncing = false
    }
  }

  function onProxyHScroll(ev) {
    if (syncing) return
    const el = shell()
    if (!el) return
    syncing = true
    el.scrollLeft = ev.target.scrollLeft
    syncing = false
  }

  function onShellScroll(ev) {
    if (syncing) return
    const proxy = hScrollProxyRef.value
    if (!proxy || !showHProxy.value) return
    syncing = true
    proxy.scrollLeft = ev.target.scrollLeft
    syncing = false
  }

  return {
    hScrollProxyRef,
    hProxyInnerWidth,
    showHProxy,
    onProxyHScroll,
    onShellScroll,
    updateHScrollMetrics
  }
}
