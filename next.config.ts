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
  
  // 静态文件服务（本地开发用）
  async rewrites() {
    // 仅在本地开发时启用
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/uploads/:path*',
          destination: '/api/uploads/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
