// Inline styles remain necessary for Leaflet positioning and numeric progress bars.
// JavaScript and network requests are restricted to this application's origin.
export const pageHeaders={
 'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store',
 'Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY',
 'Strict-Transport-Security':'max-age=31536000',
 'Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()',
 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://tile.openstreetmap.org https://*.basemaps.cartocdn.com; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'; upgrade-insecure-requests"
};
