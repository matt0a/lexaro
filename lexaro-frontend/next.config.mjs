/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "api.sws.speechify.com" },
            { protocol: "https", hostname: "**.speechify.com" },
            { protocol: "https", hostname: "**.amazonaws.com" },
            { protocol: "https", hostname: "**.cloudfront.net" },
        ],
    },
};

export default nextConfig;
