import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: '50mb', // Aumenta limite para uploads de documentos
  },
}

export default nextConfig
