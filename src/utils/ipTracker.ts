import { SignInLog } from '../types';

export interface ClientGeoInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  org?: string;
  device?: string;
  userAgent?: string;
}

/**
 * Returns an emoji flag for an ISO 2-letter country code (e.g. 'GR' -> '🇬🇷')
 */
export function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Parses user agent string into a readable Browser + OS summary
 */
export function parseDeviceInfo(ua?: string): { device: string; browser: string; os: string } {
  const userAgent = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown');

  let os = 'Unknown OS';
  if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';
  else if (/Macintosh|Mac OS X/i.test(userAgent)) os = 'macOS';
  else if (/Windows NT/i.test(userAgent)) os = 'Windows';
  else if (/Linux/i.test(userAgent)) os = 'Linux';
  else if (/CrOS/i.test(userAgent)) os = 'ChromeOS';

  let browser = 'Web Browser';
  if (/Edg\//i.test(userAgent)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) browser = 'Google Chrome';
  else if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) browser = 'Apple Safari';
  else if (/Firefox\//i.test(userAgent)) browser = 'Mozilla Firefox';
  else if (/Opera|OPR\//i.test(userAgent)) browser = 'Opera';

  const isMobile = /Mobi|Android|iPhone/i.test(userAgent);
  const device = `${browser} on ${os} (${isMobile ? 'Mobile' : 'Desktop'})`;

  return { device, browser, os };
}

/**
 * Asynchronously retrieves the client's public IP and location.
 * Features fast timeouts and fallbacks so authentication is never delayed.
 */
export async function fetchClientGeoInfo(): Promise<ClientGeoInfo> {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  const { device } = parseDeviceInfo(userAgent);

  // 1. Try ipapi.co (provides IP + City + Region + Country + Org)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.ip && typeof data.ip === 'string') {
        return {
          ip: data.ip.trim(),
          city: data.city || '',
          region: data.region || '',
          country: data.country_name || '',
          countryCode: data.country_code || '',
          org: data.org || '',
          device,
          userAgent
        };
      }
    }
  } catch {
    // Continue to fallback
  }

  // 2. Fallback: ipify.org
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        return {
          ip: data.ip.trim(),
          device,
          userAgent
        };
      }
    }
  } catch {
    // Continue to fallback 3
  }

  // 3. Fallback: seeip.org
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api.seeip.org/jsonip', { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        return {
          ip: data.ip.trim(),
          device,
          userAgent
        };
      }
    }
  } catch {
    // Offline or network blocked
  }

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  return {
    ip: isOffline ? 'Offline Cache' : 'Client Device',
    device,
    userAgent
  };
}

/**
 * Creates a formatted SignInLog entry
 */
export function buildSignInLogEntry(params: {
  userId: string;
  userEmail: string;
  userName?: string;
  geoInfo: ClientGeoInfo;
  method?: string;
}): SignInLog {
  return {
    id: `signin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId,
    userEmail: params.userEmail.toLowerCase().trim(),
    userName: params.userName || params.userEmail.split('@')[0],
    ip: params.geoInfo.ip,
    city: params.geoInfo.city,
    region: params.geoInfo.region,
    country: params.geoInfo.country,
    countryCode: params.geoInfo.countryCode,
    org: params.geoInfo.org,
    device: params.geoInfo.device,
    userAgent: params.geoInfo.userAgent,
    timestamp: new Date().toISOString(),
    method: params.method || 'password'
  };
}
