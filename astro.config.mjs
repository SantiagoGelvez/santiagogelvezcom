// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Integraciones limitadas a `mdx` y `sitemap`, versiones fijas (ADR-0002).
// Salida estática pura: sin adaptador, sin runtime (ADR-0005, actualización).
export default defineConfig({
  site: 'https://santiagogelvez.com',
  trailingSlash: 'always',

  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      // Prefijo explícito en ambos idiomas (SPEC §8).
      prefixDefaultLocale: true,
      // La raíz la redirige Cloudflare con un 301 real desde `public/_redirects`,
      // no un meta-refresh generado en build. Sin detección de idioma del navegador.
      redirectToDefaultLocale: false,
    },
  },

  integrations: [
    mdx(),
    // Sin la opción `i18n` del sitemap a propósito: asume que la traducción de una
    // ruta es la misma ruta con otro prefijo, y aquí los slugs son traducidos
    // (`/es/sobre-mi/` ↔ `/en/about/`). Emitiría `hreflang` hacia páginas que no
    // existen, que es justo el error que SPEC §8 y §10 prohíben. El `hreflang` se
    // emite en el `<head>` desde la clave de traducción, correcto por construcción.
    sitemap(),
  ],
});
