// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

// The product introduction and documentation at https://flashjot.mefby.com, published to GitHub
// Pages with a custom domain (set in the repository's Pages settings, not with a CNAME file, because
// the site deploys through GitHub Actions). The site lives at the root, so internal links start with `/`.
export default defineConfig({
  site: 'https://flashjot.mefby.com',
  integrations: [
    starlight({
      title: 'Flashjot',
      description:
        'A keyboard-first quick-capture box and notebook for Linux, Windows and macOS. Press a shortcut, write the idea down, press Enter. Notes are plain Markdown files.',
      logo: { src: './src/assets/logo.svg' },
      favicon: '/favicon.svg',
      head: [
        {
          // The demo video autoplays. For people who ask for reduced motion it stays paused and
          // gets controls, so they can still start it.
          tag: 'script',
          content:
            "document.addEventListener('DOMContentLoaded',()=>{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(const v of document.querySelectorAll('video[autoplay]')){v.autoplay=false;v.pause();v.controls=true;}});",
        },
      ],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/mftnakrsu/flashjot' }],
      editLink: { baseUrl: 'https://github.com/mftnakrsu/flashjot/edit/main/docs-site/' },
      locales: {
        root: { label: 'English', lang: 'en' },
        tr: { label: 'Türkçe', lang: 'tr' },
      },
      customCss: ['./src/styles/custom.css'],
      // src/pages/404.astro renders the 404 page instead.
      disable404Route: true,
      sidebar: [
        {
          label: 'Install',
          translations: { tr: 'Kurulum' },
          items: ['install/linux', 'install/windows', 'install/macos'],
        },
        {
          label: 'User guide',
          translations: { tr: 'Kullanım kılavuzu' },
          items: [
            'guide/quick-capture',
            'guide/notebook',
            'guide/shortcuts',
            'guide/settings',
            'guide/your-notes',
          ],
        },
        {
          label: 'Development',
          translations: { tr: 'Geliştirme' },
          items: ['development/building', 'development/architecture', 'development/contributing'],
        },
        {
          label: 'Project',
          translations: { tr: 'Proje' },
          items: ['roadmap'],
        },
      ],
    }),
  ],
});
