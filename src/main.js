import './assets/main.css'
import './shared/shared.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { getCachedCsrfToken } from '@/shared/lib/csrf'

import App from './App.vue'
import router from './router'

async function bootstrap() {
  // await getCachedCsrfToken()
  try {
    await getCachedCsrfToken()
  } catch (error) {
    console.warn('CSRF prefetch failed, continuing app bootstrap:', error)
  }
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')
}
bootstrap()
