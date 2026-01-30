import withPWAInit from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['i.pravatar.cc'],
        unoptimized: false, // Keep optimization for web, but may need to adjust for mobile
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    },
    staticPageGenerationTimeout: 1000,
    // Optimize for mobile performance
    compress: true,
    poweredByHeader: false,
    reactStrictMode: true,
    // swcMinify removed - SWC minification is always enabled in Next.js 15
    // workboxOptions removed - not a valid Next.js config option
    // Disable PWA-related warnings in development
    webpack: (config, { dev, isServer }) => {
        if (dev && !isServer) {
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    ...config.optimization.splitChunks,
                    cacheGroups: {
                        ...config.optimization.splitChunks.cacheGroups,
                        // Prevent service worker from being regenerated multiple times
                        default: false,
                        vendors: false,
                    },
                },
            };
        }

        // Server-side configuration
        if (isServer) {
            // Ignore Node.js modules that aren't available in browser
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
            };
        }

        return config;
    },
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
                ],
            },
            {
                source: '/manifest.json',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/manifest+json',
                    },
                ],
            },
        ];
    },
};

// Initialize next-pwa with optimized settings for health app
const withPWA = withPWAInit({
    dest: 'public',
    swSrc: 'public/sw-custom.js', // Custom service worker source with push notification handlers
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development', // Disable PWA in development
    buildExcludes: [/middleware-manifest\.json$/], // Exclude middleware from service worker
    // Note: fallbacks removed - causes importScripts error when using swSrc
    // Offline fallback can be handled in sw-custom.js if needed
    publicExcludes: ['!robots.txt', '!sitemap.xml'], // Exclude these from precaching
    reloadOnOnline: true // Reload when back online
    // Note: runtimeCaching is handled in sw-custom.js when using swSrc
});

// Export the config wrapped with PWA support (only in production)
export default process.env.NODE_ENV === 'production' ? withPWA(nextConfig) : nextConfig;
