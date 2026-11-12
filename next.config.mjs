/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ['mysql2', 'mongodb', 'bcryptjs'] },
};
export default nextConfig;
