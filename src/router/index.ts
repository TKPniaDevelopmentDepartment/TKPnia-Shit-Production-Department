import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import Home from '../views/Home/Home.vue'
import Novels from '../views/Novels/Novels.vue'
import Images from '../views/Images/Images.vue'
import MusicPlayer from '../views/Musics/Musics.vue'

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
  },
  {
    path: '/images',
    name: 'Images',
    component: Images
  },
  {
    path: '/musics',
    name: 'Musics',
    component: MusicPlayer
  }
]
const router = createRouter({
    history: createWebHashHistory(),
    routes: routes
})

export default router
