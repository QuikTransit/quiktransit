'use client';

let loaded = false;
let loading = false;
const callbacks: Array<() => void> = [];

export function loadGoogleMaps(onReady: () => void) {
  if (loaded) { onReady(); return; }
  callbacks.push(onReady);
  if (loading) return;
  loading = true;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key || key === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    console.warn('QuikTransit: No Google Maps API key set in .env.local');
    return;
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
  script.async = true;
  script.onload = () => {
    loaded = true;
    callbacks.forEach(cb => cb());
  };
  document.head.appendChild(script);
}

export function getDistanceMatrix(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
): Promise<{ miles: number; minutes: number }> {
  return new Promise((resolve, reject) => {
    const svc = new google.maps.DistanceMatrixService();
    svc.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
      },
      (res, status) => {
        if (status === 'OK' && res?.rows[0].elements[0].status === 'OK') {
          const el = res.rows[0].elements[0];
          resolve({
            miles:   Math.round((el.distance.value / 1609.34) * 10) / 10,
            minutes: Math.round(el.duration.value / 60),
          });
        } else {
          reject(new Error('Distance Matrix failed: ' + status));
        }
      },
    );
  });
}
