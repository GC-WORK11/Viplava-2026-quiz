export function resolveParticipantJoinUrl(
  browserOrigin: string,
  stateCustomHostUrl?: string,
  stateDetectedNetworkIp?: string
): { joinUrl: string; isLocalhost: boolean; displayAddress: string } {
  // 1. If the host has explicitly configured a custom URL (e.g. http://192.168.1.50:3000)
  if (stateCustomHostUrl && stateCustomHostUrl.trim().length > 0) {
    const clean = stateCustomHostUrl.trim().replace(/\/+$/, '');
    const full = clean.includes('?') ? `${clean}&view=participant` : `${clean}/?view=participant`;
    return { joinUrl: full, isLocalhost: false, displayAddress: clean };
  }

  // 2. Parse current browser origin
  let hostname = '';
  let port = '';

  try {
    if (browserOrigin) {
      const url = new URL(browserOrigin);
      hostname = url.hostname;
      port = url.port ? `:${url.port}` : '';
    }
  } catch {}

  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '';

  // 3. If accessing via localhost on host computer and we detected the Wi-Fi Network IP
  if (isLocalhost && stateDetectedNetworkIp) {
    const targetPort = port || ':3000';
    const baseUrl = `http://${stateDetectedNetworkIp}${targetPort}`;
    return {
      joinUrl: `${baseUrl}/?view=participant`,
      isLocalhost: true,
      displayAddress: baseUrl,
    };
  }

  // 4. If accessed via live network or cloud preview URL
  if (browserOrigin) {
    return {
      joinUrl: `${browserOrigin}/?view=participant`,
      isLocalhost,
      displayAddress: browserOrigin,
    };
  }

  // 5. Default fallback
  const fallbackIp = stateDetectedNetworkIp || '192.168.1.x';
  return {
    joinUrl: `http://${fallbackIp}:3000/?view=participant`,
    isLocalhost: true,
    displayAddress: `http://${fallbackIp}:3000`,
  };
}
