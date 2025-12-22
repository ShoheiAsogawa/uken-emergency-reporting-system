// Leafletの型定義がインストールされていない場合の暫定実装
import { useEffect, useState } from 'react';
// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import { Icon } from 'leaflet';
// import 'leaflet/dist/leaflet.css';
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
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="mb-2">地図を読み込み中...</p>
          <p className="text-sm mb-4">
            Leafletパッケージをインストールしてください: npm install leaflet react-leaflet @types/leaflet
          </p>
          <div className="space-y-2">
            {shelters.map((shelter) => (
              <div key={shelter.shelter_id} className="p-2 bg-white rounded border">
                <div className="font-semibold">{shelter.name}</div>
                <div className="text-xs text-gray-500">
                  {shelter.lat.toFixed(4)}, {shelter.lng.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
