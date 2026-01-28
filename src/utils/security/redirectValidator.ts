const ALLOWED_REDIRECT_URLS = [
  'http://localhost:3007/reset-password',
  'https://app.yourdomain.com/reset-password',
];
  
export function validateRedirectUrl(url: string): boolean {
  try {
    return ALLOWED_REDIRECT_URLS.includes(url);
  } catch {
    return false;
  }
}
  