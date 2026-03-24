import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      // This must be resolved, before integrating User Story 1 and merging with backend.
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true },
      // This must be resolved, before integrating User Story 1 and merging with backend.
    },
    {
      path: '/my-stats',
      name: 'my-stats',
      component: () => import('../views/MyStatsView.vue'),
      meta: { requiresAuth: true },
      // This must be resolved, before integrating User Story 1 and merging with backend.
    },
    {
      path: '/last-played',
      name: 'last-played',
      component: () => import('../views/LastPlayedView.vue'),
      meta: { requiresAuth: true },
      // This must be resolved, before integrating User Story 1 and merging with backend.
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/level-list',
      name: 'level-list',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/LevelsList.vue'),
    },
    {
      path: '/users',
      name: 'users',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/UserListView.vue'),
    },
    {
      path: '/add_user',
      name: 'Add User',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AddUserView.vue'),
    },
    {
      path: '/play-demo',
      name: 'Play Demo',
      component: () => import('../views/PlayDemoView.vue'),
    }
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return '/'
  }

  return true
})

export default router
