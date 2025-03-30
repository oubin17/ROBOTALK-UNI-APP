import { createSSRApp } from 'vue'
import App from './App.vue'

// 创建应用实例
export function createApp () {
  const app = createSSRApp(App)

  // 这里可以注册全局组件、插件等

  return {
    app
  }
} 