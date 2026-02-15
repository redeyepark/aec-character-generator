import type { NextConfig } from "next";
import path from "path";
import { realpathSync } from "fs";

// Windows 경로 대소문자 불일치로 인한 React 중복 로드 방지
// realpathSync.native 로 OS 원본 대소문자를 보존한 절대 경로를 취득
const projectRoot = realpathSync.native(process.cwd());

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    // 클라이언트 번들에서만 React alias 적용 (서버는 Node.js 해석에 위임)
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        react: path.join(projectRoot, "node_modules", "react"),
        "react-dom": path.join(projectRoot, "node_modules", "react-dom"),
      };
    }
    return config;
  },
};

export default nextConfig;
