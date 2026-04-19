/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "kkqmductqaxzsjzpeyfv.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};
module.exports = nextConfig;
