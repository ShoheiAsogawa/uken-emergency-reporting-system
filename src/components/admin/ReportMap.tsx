import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../../lib/leaflet';
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

function FitToSelected({ selected }: { selected?: Report }) {
  const map = useMap();
  useEffect(() => {
    if (!selected) return;
    map.setView([selected.lat, selected.lng], Math.max(map.getZoom(), 14), { animate: true });
  }, [selected, map]);
  return null;
}

export default function ReportMap({ reports, selectedReport, onReportClick }: ReportMapProps) {
  const center = useMemo(() => {
    if (selectedReport) return [selectedReport.lat, selectedReport.lng] as [number, number];
    if (reports.length) return [reports[0].lat, reports[0].lng] as [number, number];
    return [MAP_CENTER_LAT, MAP_CENTER_LNG] as [number, number];
  }, [reports, selectedReport]);

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <FitToSelected selected={selectedReport} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {reports.map((r) => {
          const color = CATEGORY_COLORS[r.category];
          const selected = selectedReport?.report_id === r.report_id;
          return (
            <CircleMarker
              key={r.report_id}
              center={[r.lat, r.lng]}
              radius={selected ? 10 : 7}
              pathOptions={{ color, fillColor: color, fillOpacity: selected ? 0.9 : 0.7, weight: selected ? 3 : 2 }}
              eventHandlers={{
                click: () => onReportClick(r),
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">
                    {r.category === 'road_damage' && '🚧 道路破損'}
                    {r.category === 'disaster' && '🌊 災害情報'}
                    {r.category === 'animal_accident' && '🦌 動物事故'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(r.created_at).toLocaleString('ja-JP')}
                  </div>
                  {r.description && <div className="text-sm">{r.description}</div>}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
