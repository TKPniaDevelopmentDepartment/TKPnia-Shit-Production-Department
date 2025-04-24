import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import Home from '../views/Home.vue'
import Novels from '../views/Novels.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/novels',
    name: 'Novels',
    component: Novels
  }
]
const router = createRouter({
    history: createWebHashHistory(),
    routes: routes
})

export default router
