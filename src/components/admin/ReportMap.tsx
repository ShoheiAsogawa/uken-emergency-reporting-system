// Leafletの型定義がインストールされていない場合の暫定実装
// TODO: npm install @types/leaflet を実行

import { useEffect, useState } from 'react';
// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import { Icon } from 'leaflet';
// import 'leaflet/dist/leaflet.css';
import type { Report, ReportCategory } from '../../types';

const MAP_CENTER_LAT = parseFloat(import.meta.env.VITE_MAP_CENTER_LAT || '28.293');
const MAP_CENTER_LNG = parseFloat(import.meta.env.VITE_MAP_CENTER_LNG || '129.255');

const CATEGORY_COLORS: Record<ReportCategory, string> = {
  road_damage: '#f97316', // orange
  disaster: '#3b82f6', // blue
  animal_accident: '#ef4444', // red
};

interface ReportMapProps {
  reports: Report[];
  selectedReport?: Report;
  onReportClick: (report: Report) => void;
}

export default function ReportMap({ reports, selectedReport, onReportClick }: ReportMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Leafletが利用可能かチェック
    if (typeof window !== 'undefined' && (window as any).L) {
      setMapLoaded(true);
      initializeMap();
    } else {
      // Leafletが利用できない場合は代替表示
      setMapLoaded(false);
    }
  }, [reports, selectedReport]);

  const initializeMap = () => {
    // TODO: Leafletの実装
  };

  if (!mapLoaded) {
    return (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="mb-2">地図を読み込み中...</p>
          <p className="text-sm">
            Leafletパッケージをインストールしてください: npm install leaflet react-leaflet @types/leaflet
          </p>
          <div className="mt-4 space-y-2">
            {reports.map((report) => (
              <div
                key={report.report_id}
                onClick={() => onReportClick(report)}
                className="p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[report.category] }}
                  />
                  <span className="text-sm">
                    {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Leafletが利用可能な場合の実装
  return (
    <div className="h-full w-full bg-gray-100">
      {/* TODO: MapContainer, TileLayer, Marker の実装 */}
      <p className="p-4 text-gray-500">地図機能は準備中です</p>
    </div>
  );
}
