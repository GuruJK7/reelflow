/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El build verifica TypeScript (bloqueante); el lint corre aparte (npm run lint).
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
