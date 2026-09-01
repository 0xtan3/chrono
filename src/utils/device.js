/**
 * Utility to detect phone devices vs tablets / laptops / desktops.
 * Phones (iPhone, Android Mobile, small screens < 768px) are gated from focus chamber access.
 * Tablets (iPad, iPad Mini, Android Tablets >= 768px) and Laptops/Desktops have full access.
 */
export function isPhoneDevice() {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || navigator.vendor || window.opera || '';

  // Explicit iPhone / iPod detection
  if (/iPhone|iPod/i.test(ua)) {
    return true;
  }

  // Explicit Android phone detection (Android tablets do NOT contain 'Mobile')
  if (/Android/i.test(ua) && /Mobile/i.test(ua)) {
    return true;
  }

  // Windows Phone / Blackberry
  if (/webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }

  // Screen width & viewport fallback (Phablets / narrow viewport < 768px)
  const width = Math.min(
    window.innerWidth || Infinity,
    window.screen?.width || Infinity
  );

  if (width < 768) {
    return true;
  }

  return false;
}
