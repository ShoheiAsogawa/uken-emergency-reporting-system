import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../../lib/leaflet';
import type { Shelter } from '../../types';
import { getShelters } from '../../lib/api';
import { Loader2 } from 'lucide-react';

const MAP_CENTER_LAT = parseFloat(import.meta.env.VITE_MAP_CENTER_LAT || '28.293');
const MAP_CENTER_LNG = parseFloat(import.meta.env.VITE_MAP_CENTER_LNG || '129.255');

export default function ShelterMap() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShelters();
  }, []);

  const loadShelters = async () => {
    try {
      setLoading(true);
      const data = await getShelters();
      setShelters(data.filter(s => s.is_active));
    } catch (err) {
      console.error('避難所データ取得エラー:', err);
      setError('避難所データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={[MAP_CENTER_LAT, MAP_CENTER_LNG]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {shelters.map((s) => (
          <Marker key={s.shelter_id} position={[s.lat, s.lng]}>
            <Popup>
              <div className="font-semibold">{s.name}</div>
              <div className="text-xs text-gray-600">
                {s.lat.toFixed(6)}, {s.lng.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
