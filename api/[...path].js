import app from '../app.js';

export default function(req, res) {
  // O Vercel passa req.url como /api/dashboard. O Express espera /dashboard.
  if (req.url.startsWith('/api')) {
    req.url = req.url.substring(4) || '/';
  }
  return app(req, res);
}
