import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 如果您的 GitHub repo 名稱不是 fubon-incentive-calc，
// 請把下面 base 的值改成 '/您的repo名稱/'
export default defineConfig({
  base: '/fubon-incentive-calc/',
  plugins: [react()],
})