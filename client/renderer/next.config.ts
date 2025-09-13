import type { NextConfig } from "next";

const isElectron = process.env.BUILD_TARGET === "electron";
const isWeb = process.env.BUILD_TARGET === "web";

const nextConfig: NextConfig = {
  output: isWeb ? "export" : undefined,
  trailingSlash: isElectron,
  images: {
    unoptimized: isElectron || isWeb,
  },

  // Configure asset prefix for web deployment
  assetPrefix: isWeb ? "" : undefined,
  basePath: isWeb ? "" : undefined,

  // API routes handling for web deployment
  rewrites: isWeb
    ? async () => [
        {
          source: "/api/proxy/:path*",
          destination:
            (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000") +
            "/:path*",
        },
      ]
    : undefined,

  // Configure webpack for different targets
  webpack: (config, { isServer }) => {
    config.module.parser.javascript.importMeta = false;
    if (isServer) {
      config.externals = [...config.externals, "moorhen"];
    }
    if (isElectron && !isServer) {
      config.target = "electron-renderer";
    }

    return config;
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },

  distDir: ".next",
};

export default nextConfig;
