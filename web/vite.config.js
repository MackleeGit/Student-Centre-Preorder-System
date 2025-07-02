import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // Import the PWA plugin

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'STC Preorder System',
        short_name: 'Preorder',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2e7d32',
        icons: [
          {
            src: '/logo-nobg.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-nobg.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});


// Triggering Netlify rebuild