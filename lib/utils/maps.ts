// ─── Map Deep Links ───────────────────────────────────────────────────────────

export interface MapLocation {
  lat: number;
  lng: number;
  name?: string;
  naverPlaceId?: string;
  kakaoPlaceId?: string;
}

/**
 * Opens Naver Map via deep link (navermap://).
 * Falls back to Naver Map web URL on desktop.
 */
export function openNaverMap(location: MapLocation): void {
  const { lat, lng, name, naverPlaceId } = location;

  const isMobile =
    /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  if (isMobile) {
    // Try deep link first
    const deepLink = naverPlaceId
      ? `navermap://place?id=${naverPlaceId}`
      : `navermap://map?lat=${lat}&lng=${lng}&zoom=15&appname=com.seoulmate.app`;

    window.location.href = deepLink;

    // Fallback to web after 1.5s if app not installed
    setTimeout(() => {
      const webUrl = naverPlaceId
        ? `https://map.naver.com/p/entry/place/${naverPlaceId}`
        : `https://map.naver.com/p/search/${encodeURIComponent(name ?? `${lat},${lng}`)}`;
      window.open(webUrl, "_blank");
    }, 1500);
  } else {
    const webUrl = naverPlaceId
      ? `https://map.naver.com/p/entry/place/${naverPlaceId}`
      : `https://map.naver.com/p/search/${encodeURIComponent(name ?? `${lat},${lng}`)}`;
    window.open(webUrl, "_blank");
  }
}

/**
 * Opens Kakao Map via deep link.
 * Falls back to Kakao Map web URL.
 */
export function openKakaoMap(location: MapLocation): void {
  const { lat, lng, name, kakaoPlaceId } = location;
  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  if (isMobile && kakaoPlaceId) {
    window.location.href = `kakaomap://place?id=${kakaoPlaceId}`;
    setTimeout(() => {
      window.open(
        `https://map.kakao.com/link/map/${encodeURIComponent(name ?? "")},${lat},${lng}`,
        "_blank"
      );
    }, 1500);
  } else {
    window.open(
      `https://map.kakao.com/link/map/${encodeURIComponent(name ?? "")},${lat},${lng}`,
      "_blank"
    );
  }
}

/**
 * Build a Google Maps walking directions URL.
 */
export function googleMapsDirections(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`;
}
