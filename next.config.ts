import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/gunn-kotsu-suku-math",
  assetPrefix: "/gunn-kotsu-suku-math/",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
