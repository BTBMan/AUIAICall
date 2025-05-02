import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';

import packageJSON from './package.json';
// import runConfig from './src/runConfig';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(packageJSON.version),
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'https://ice-smart-aiagent-fcapp-appserver.aliyuncs.com',
        // target: 'https://ice-smart-aiagent-fcapp.aliyun-inc.com',
        // rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 将 '@' 映射到 './src' 目录
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        mobile: path.resolve(__dirname, 'mobile.html'),
        cdn: path.resolve(__dirname, 'cdn.html'),
      },
    },
  },

  plugins: [
    react(),
    svgr({ svgrOptions: { icon: true } }),
    legacy({
      targets: ['firefox 62', 'safari 11', 'chrome 63'], //需要兼容的目标列表，可以设置多个
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      modernPolyfills: ['es/global-this'],
    }),
  ],
  base: './',
});
