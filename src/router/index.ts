import { createRouter, createWebHistory } from 'vue-router'
import HallMap from '@/views/hall-map'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HallMap
    }
  ]
})

export default router
