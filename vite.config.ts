import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';

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
                    if (assetInfo.names?.includes('.svg'))
                        return 'assets/[name].[hash].[ext]'
                    return '[name].[hash].[ext]'
                }
            }
        }
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, './src')
        }
    },
    /*server: {
        proxy: {
            '/': {
                target: 'https://tkpniadevelopmentdepartment.github.io/TKPnia-Shit-Production-Department/',
                // 更改请求的origin为代理服务器的origin，以便与目标服务器交互
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\//, '')
            }
        }
    }*/
    server: {
        proxy: process.env.NODE_ENV === 'development' ? {} : {
            '/': {
                target: 'https://tkpniadevelopmentdepartment.github.io/TKPnia-Shit-Production-Department/',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\//, '')
            }
        }
    }
})
