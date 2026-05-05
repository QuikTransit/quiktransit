'use client';
import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '@/lib/maps';

interface Props {
  id: string;
  placeholder: string;
  value: string;
  dotColor: 'green' | 'red';
  onChange: (value: string) => void;
  onPlaceSelect: (address: string, coords: { lat: number; lng: number }) => void;
}

export default function AddressInput({ id, placeholder, value, dotColor, onChange, onPlaceSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    loadGoogleMaps(() => {
      if (!inputRef.current || acRef.current) return;
      acRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
      });
      acRef.current.addListener('place_changed', () => {
        const place = acRef.current!.getPlace();
        const address = place.formatted_address || inputRef.current?.value || '';
        const loc = place.geometry?.location;
        if (loc) onPlaceSelect(address, { lat: loc.lat(), lng: loc.lng() });
        else onChange(address);
      });
    });
  }, []);

  const dotCls = dotColor === 'green'
    ? 'bg-green-400 border-2 border-green-600'
    : 'bg-red-400 border-2 border-red-600';

  return (
    <div className="flex items-center gap-2 px-3 py-2.5">
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotCls}`} />
      <input
        ref={inputRef}
        id={id}
        type="text"
        placeholder={placeholder}
        defaultValue={value}
        onChange={e => onChange(e.target.value)}
        autoComplete="off"
        className="flex-1 border-none outline-none text-sm text-gray-800 bg-transparent placeholder-gray-400"
      />
    </div>
  );
}
