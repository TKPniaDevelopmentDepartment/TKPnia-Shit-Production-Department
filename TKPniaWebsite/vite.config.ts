import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
    base: './', // 本地调试必须设置
    publicDir: 'public', // 默认配置
    plugins: [vue()],
    build: {
        outDir: 'dist',
        assetsDir: 'assets', // 保持默认
        emptyOutDir: true,
        rollupOptions: {
            output: {
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.includes('.svg'))
                        return 'assets/[name].[hash].[ext]'
                    return '[name].[hash].[ext]'
                }
            }
        }
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        // 代理配置，用于重定向请求到其他服务器
        proxy: {
          // 定义一个代理规则，将/hello-world路径下的请求代理到指定的目标服务器
          '/': {
            // 目标服务器的地址
            target: 'https://tkpniadevelopmentdepartment.github.io/TKPnia-Shit-Production-Department/',
            // 更改请求的origin为代理服务器的origin，以便与目标服务器交互
            changeOrigin: true,
            // 重写请求路径，移除/hello-world前缀
            rewrite: (path) => path.replace(/^\//, '')
          }
        }
      }
})
