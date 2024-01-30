import {
  defineConfig
} from 'vite'
import fs from 'fs'
import path from 'path'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({
  commad,
  mode
}) => {

  return {
    resolve: {
      extensions: ['.js', '.vue', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [vue()],
    base: '/',
    server: {
      port: 9001,
      open: true,
      host: '0.0.0.0',
      https: {
        key: fs.readFileSync('cert/server.key'),
        cert: fs.readFileSync('cert/server.pem')
      },
      proxy: {
        '/socket': {
          target: 'ws://192.168.43.82:8085',
          changeOrigin: true,
          ws: true
        }
      }
    }
  }
})