import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'LeetNtfy',
        short_name: 'LeetNtfy',
        description: 'Personalized LeetCode study nudges delivered to your phone.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            }
        ],
    }
}
