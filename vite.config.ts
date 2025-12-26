import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Using '.' instead of process.cwd() to avoid TS error with Process type missing cwd
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    define: {
      // Vital: This replaces 'process.env.API_KEY' with the actual string value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // 标记是否为生产环境
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      // 生产构建优化
      target: 'esnext',
      minify: 'esbuild', // 使用 esbuild 进行更快的压缩
      cssMinify: true,
      // 代码分割配置
      rollupOptions: {
        output: {
          // 手动代码分割
          manualChunks: {
            // 将 React 相关库单独打包
            'react-vendor': ['react', 'react-dom'],
            // 将图表库单独打包
            'charts-vendor': ['recharts'],
            // 将 Supabase 单独打包
            'supabase-vendor': ['@supabase/supabase-js'],
            // 将图标库单独打包
            'icons-vendor': ['lucide-react'],
          },
          // 优化 chunk 文件命名
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
      // 启用 Tree Shaking
      treeshake: true,
      // 压缩选项
      chunkSizeWarningLimit: 1000,
      // 源映射（生产环境可选）
      sourcemap: !isProduction,
    },
    // 优化依赖预构建
    optimizeDeps: {
      include: ['react', 'react-dom', '@supabase/supabase-js'],
    },
  }
})