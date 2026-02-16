const geoCache = new Map<string, { data: GeoResult | null; expiry: number }>();
const CACHE_TTL = 60 * 60 * 1000;

export interface GeoResult {
  lat: number;
  lng: number;
  country: string;
  city: string;
}

const DEV_CITIES: GeoResult[] = [
  { lat: 40.7128, lng: -74.006, country: "US", city: "New York" },
  { lat: 34.0522, lng: -118.2437, country: "US", city: "Los Angeles" },
  { lat: 41.8781, lng: -87.6298, country: "US", city: "Chicago" },
  { lat: 29.7604, lng: -95.3698, country: "US", city: "Houston" },
  { lat: 33.749, lng: -84.388, country: "US", city: "Atlanta" },
  { lat: 51.5074, lng: -0.1278, country: "GB", city: "London" },
  { lat: 48.8566, lng: 2.3522, country: "FR", city: "Paris" },
  { lat: 52.52, lng: 13.405, country: "DE", city: "Berlin" },
  { lat: 35.6762, lng: 139.6503, country: "JP", city: "Tokyo" },
  { lat: -33.8688, lng: 151.2093, country: "AU", city: "Sydney" },
  { lat: 55.7558, lng: 37.6173, country: "RU", city: "Moscow" },
  { lat: 19.4326, lng: -99.1332, country: "MX", city: "Mexico City" },
  { lat: -23.5505, lng: -46.6333, country: "BR", city: "São Paulo" },
  { lat: 1.3521, lng: 103.8198, country: "SG", city: "Singapore" },
  { lat: 25.2048, lng: 55.2708, country: "AE", city: "Dubai" },
  { lat: 37.5665, lng: 126.978, country: "KR", city: "Seoul" },
  { lat: 28.6139, lng: 77.209, country: "IN", city: "New Delhi" },
  { lat: -1.2921, lng: 36.8219, country: "KE", city: "Nairobi" },
  { lat: 43.6532, lng: -79.3832, country: "CA", city: "Toronto" },
  { lat: 59.3293, lng: 18.0686, country: "SE", city: "Stockholm" },
];

function isPrivateIP(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.3") ||
    ip.startsWith("192.168.") ||
    ip === "" ||
    ip === "0.0.0.0"
  );
}

export function getRandomDevCity(): GeoResult {
  return DEV_CITIES[Math.floor(Math.random() * DEV_CITIES.length)];
}

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1334;

export async function lookupIP(ip: string): Promise<GeoResult | null> {
  if (isPrivateIP(ip)) {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV !== "production") {
      return getRandomDevCity();
    }
    return null;
  }

  const cached = geoCache.get(ip);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    await new Promise((r) => setTimeout(r, MIN_REQUEST_INTERVAL - (now - lastRequestTime)));
  }

  try {
    lastRequestTime = Date.now();
    const resp = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,lat,lon`);
    const data = await resp.json();
    if (data.status === "success") {
      const result: GeoResult = {
        lat: data.lat,
        lng: data.lon,
        country: data.countryCode || data.country,
        city: data.city,
      };
      geoCache.set(ip, { data: result, expiry: Date.now() + CACHE_TTL });
      return result;
    }
    geoCache.set(ip, { data: null, expiry: Date.now() + CACHE_TTL });
    return null;
  } catch {
    return null;
  }
}
