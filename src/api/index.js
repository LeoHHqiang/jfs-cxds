/**
 * API 接口统一导出
 * 集中管理所有 API 接口
 */

export * from './user'
export * from './record'
export * from './acceptHistory'
export * from './template'
export * from './moveApprove'
export * from './baseItems'
export * from './demoApi'
// export * from './template'
// export * from './supplier'
// export * from './download'
// export * from './role'

// 统一错误处理
export const handleApiError = (error) => {
  console.error('API Error:', error)
  
  // 可以根据不同的错误类型进行统一处理
  if (error.response) {
    // 服务器返回了错误状态码
    switch (error.response.status) {
      case 401:
        // 未授权，可能需要重新登录
        console.error('未授权，请重新登录')
        break
      case 403:
        // 禁止访问
        console.error('没有权限访问')
        break
      case 404:
        // 资源未找到
        console.error('请求的资源不存在')
        break
      case 500:
        // 服务器错误
        console.error('服务器错误')
        break
      default:
        console.error('请求失败')
    }
  } else if (error.request) {
    // 请求已发出但没有收到响应
    console.error('网络错误，请检查网络连接')
  } else {
    // 其他错误
    console.error('请求配置错误')
  }
  
  // 返回错误信息给调用者
  return {
    success: false,
    message: error.message || '请求失败，请稍后重试'
  }
}

// 统一请求拦截器
export const requestInterceptor = (config) => {
  // 可以从 localStorage 或 Vuex 中获取 token
  const token = localStorage.getItem('token')
  
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  
  return config
}

// 统一响应拦截器
export const responseInterceptor = (response) => {
  // 可以在这里统一处理响应数据
  const { status, data } = response
  
  if (status === 200 && data.success) {
    return data
  } else {
    throw new Error(data.message || '请求失败')
  }
}

