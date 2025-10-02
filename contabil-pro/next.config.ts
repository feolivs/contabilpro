import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Aumenta limite para uploads de documentos
    },
  },
  // Desabilita source maps em desenvolvimento para evitar erros de parsing
  productionBrowserSourceMaps: false,
}

export default nextConfig
