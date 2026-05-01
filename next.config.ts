import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack: (config, { nextRuntime, webpack }) => {
    if (nextRuntime === 'edge') {
      config.plugins = config.plugins ?? []
      config.plugins.push(
        new webpack.DefinePlugin({
          __dirname: '"/"',
          __filename: '"/index.js"',
        })
      )
    }
    return config
  },
}

export default nextConfig
