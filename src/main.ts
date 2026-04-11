import { createApp, defineCustomElement } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// 将 InlinePlayer 组件转换为自定义元素并注册
import InlineMusicPlayer from './components/InlinePlayer/InlinePlayer.vue';
import inlinePlayerStyles from './components/InlinePlayer/styles.css?raw';

const InlineMusicPlayerElement = defineCustomElement(InlineMusicPlayer, {
  styles: [inlinePlayerStyles]
});
customElements.define('inline-music-player', InlineMusicPlayerElement);

const app = createApp(App)
app.use(router)

// 告诉 Vue 将 inline-music-player 标签当作自定义元素处理，不当作 Vue 组件
app.config.isCustomElement = (tag) => tag === 'inline-music-player';

app.mount('#app')
