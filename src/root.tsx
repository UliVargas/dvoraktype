import { component$, isDev } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";

import "./global.css";
import interUrl from "./assets/fonts/inter-latin.woff2?url";
import monoUrl from "./assets/fonts/jetbrains-mono-latin.woff2?url";

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        {!isDev && (
          <link
            rel="manifest"
            href={`${import.meta.env.BASE_URL}manifest.json`}
          />
        )}
        {/* Fetched with the HTML instead of after the stylesheet; same files as @font-face in global.css */}
        <link rel="preload" href={interUrl} as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href={monoUrl} as="font" type="font/woff2" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={`
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            })();
          `}
        />
        <RouterHead />
      </head>
      {/* lang="es" is set on <html> through containerAttributes in entry.ssr.tsx */}
      <body>
        <RouterOutlet />
      </body>
    </QwikCityProvider>
  );
});
