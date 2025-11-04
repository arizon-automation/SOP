import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // 允许上传较大的文件
    },
  },
  // 生产环境配置
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;

