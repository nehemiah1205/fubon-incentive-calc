import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 部署到 GitHub Pages 時，base 要設成你的 repo 名稱，例如：
// https://<你的帳號>.github.io/<repo名稱>/
// 若之後改 repo 名稱，記得同步修改這裡
export default defineConfig({
  plugins: [react()],
  base: "/fubon-incentive-calculator/",
});
