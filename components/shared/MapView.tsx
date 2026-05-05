'use client';

interface Props {
  fromCoords?: { lat: number; lng: number } | null;
  toCoords?:   { lat: number; lng: number } | null;
  miles?: number;
  minutes?: number;
  height?: number;
}

export default function MapView({ fromCoords, toCoords, miles, minutes, height = 200 }: Props) {
  const hasCoords = fromCoords || toCoords;

  let src = 'https://www.openstreetmap.org/export/embed.html?bbox=-118.7,33.5,-117.3,34.2&layer=mapnik';

  if (fromCoords && toCoords) {
    const midLat = (fromCoords.lat + toCoords.lat) / 2;
    const midLng = (fromCoords.lng + toCoords.lng) / 2;
    const spread = 0.12;
    src = `https://www.openstreetmap.org/export/embed.html?bbox=${midLng-spread},${midLat-spread*0.7},${midLng+spread},${midLat+spread*0.7}&layer=mapnik&marker=${fromCoords.lat},${fromCoords.lng}`;
  } else if (fromCoords) {
    src = `https://www.openstreetmap.org/export/embed.html?bbox=${fromCoords.lng-0.05},${fromCoords.lat-0.035},${fromCoords.lng+0.05},${fromCoords.lat+0.035}&layer=mapnik&marker=${fromCoords.lat},${fromCoords.lng}`;
  }

  return (
    <div className="relative bg-gray-100 border-b border-gray-200" style={{ height }}>
      {hasCoords ? (
        <>
          <iframe src={src} title="Route map" loading="lazy" className="w-full h-full border-0" />
          {miles && miles > 0 && (
            <div className="absolute bottom-2 left-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex gap-4 text-xs">
              <div>
                <div className="text-gray-400">Distance</div>
                <div className="font-medium">{miles.toFixed(1)} mi</div>
              </div>
              {minutes && (
                <div>
                  <div className="text-gray-400">Est. time</div>
                  <div className="font-medium">{minutes} min</div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8490F" strokeWidth="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="#E8490F" stroke="none"/>
          </svg>
          <span className="text-sm">Enter an address to see the map</span>
        </div>
      )}
    </div>
  );
}
