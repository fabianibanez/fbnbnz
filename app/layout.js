import Script from 'next/script';
import { createSupabase, PROFILE_SLUG } from './lib/supabase';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const supabase = createSupabase();
  const { data: p } = await supabase.from('profiles').select('name, bio').eq('slug', PROFILE_SLUG).single();
  const name = p?.name || 'Fabián Ibáñez';
  return {
    title: name,
    description: p?.bio || '',
    openGraph: { title: name, description: p?.bio || '', type: 'website' },
  };
}

export default async function RootLayout({ children }) {
  const supabase = createSupabase();
  const { data: p } = await supabase.from('profiles').select('ga_id, ga_enabled').eq('slug', PROFILE_SLUG).single();
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#07080A" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
        {p?.ga_enabled && p?.ga_id ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${p.ga_id}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${p.ga_id}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
