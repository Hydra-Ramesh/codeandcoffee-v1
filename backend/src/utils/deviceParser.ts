import { Request } from 'express';

export interface DeviceInfo {
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  ipAddress: string;
  userAgent: string;
  fingerprint: string;
}

export function parseDeviceInfo(req: Request): DeviceInfo {
  const userAgent = (req.headers['user-agent'] as string) || '';
  
  // Extract clean client IP (handles reverse proxies, X-Forwarded-For, IPv4-mapped IPv6)
  let rawIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    req.ip ||
    '127.0.0.1';

  // Normalize ::ffff:127.0.0.1 to 127.0.0.1
  const cleanIp = rawIp.replace(/^.*:/, '') || '127.0.0.1';

  // Detect Device Type
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  const uaLower = userAgent.toLowerCase();

  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) {
    deviceType = 'Tablet';
  } else if (/mobile|iphone|ipod|android.*mobile|blackberry|phone|iemobile/i.test(userAgent)) {
    deviceType = 'Mobile';
  }

  // Detect Operating System
  let os = 'Unknown OS';
  if (/windows nt 10\.0/i.test(userAgent)) os = 'Windows 10/11';
  else if (/windows nt 6\.3/i.test(userAgent)) os = 'Windows 8.1';
  else if (/windows nt 6\.1/i.test(userAgent)) os = 'Windows 7';
  else if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/iphone|ipad|ipod/i.test(userAgent)) {
    const match = userAgent.match(/OS (\d+[._]\d+)/i);
    os = match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
  } else if (/android/i.test(userAgent)) {
    const match = userAgent.match(/Android (\d+(\.\d+)?)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/macintosh|mac os x/i.test(userAgent)) {
    os = 'macOS';
  } else if (/cros/i.test(userAgent)) {
    os = 'ChromeOS';
  } else if (/linux/i.test(userAgent)) {
    os = 'Linux';
  }

  // Detect Browser
  let browser = 'Unknown Browser';
  if (/edg\//i.test(userAgent)) {
    browser = 'Microsoft Edge';
  } else if (/opr\/|opera/i.test(userAgent)) {
    browser = 'Opera';
  } else if (/chrome|crios/i.test(userAgent) && !/edg\//i.test(userAgent)) {
    browser = 'Google Chrome';
  } else if (/firefox|fxios/i.test(userAgent)) {
    browser = 'Mozilla Firefox';
  } else if (/safari/i.test(userAgent) && !/chrome|crios|android/i.test(userAgent)) {
    browser = 'Apple Safari';
  } else if (/brave/i.test(userAgent)) {
    browser = 'Brave';
  }

  // Consistent device fingerprint based on OS, Browser and Device Type
  const fingerprint = `${deviceType}:${os}:${browser}`.toLowerCase();

  return {
    deviceType,
    browser,
    os,
    ipAddress: cleanIp === '' ? '127.0.0.1' : cleanIp,
    userAgent,
    fingerprint,
  };
}
