import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { getCachedCsrfToken } from '@/shared/lib/csrf'

import App from './App.vue'
import router from './router'

async function bootstrap() {
  await getCachedCsrfToken()
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')
}
bootstrap()
