import { useState, useEffect } from 'react';
import { MapPin, Camera, Loader2, Send, X } from 'lucide-react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../../lib/leaflet';
import imageCompression from 'browser-image-compression';
import type { ReportCategory, CreateReportRequest } from '../../types';
import { createReport, getPresignedUrl } from '../../lib/api';

const CATEGORIES: { value: ReportCategory; label: string; emoji: string }[] = [
  { value: 'road_damage', label: '道路破損', emoji: '🚧' },
  { value: 'disaster', label: '災害情報', emoji: '🌊' },
  { value: 'animal_accident', label: '動物事故', emoji: '🦌' },
];

const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

interface PhotoFile {
  file: File;
  preview: string;
  key?: string;
}

export default function ReportForm() {
  const [category, setCategory] = useState<ReportCategory | ''>('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 現在地を取得
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
        },
        (err) => {
          console.error('位置情報取得エラー:', err);
          setError('位置情報の取得に失敗しました');
        }
      );
    } else {
      setError('このブラウザは位置情報をサポートしていません');
    }
  }, []);

  // 写真を選択
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: PhotoFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 枚数チェック
      if (photos.length + newPhotos.length >= MAX_PHOTOS) {
        alert(`写真は最大${MAX_PHOTOS}枚までです`);
        break;
      }

      // サイズチェック
      if (file.size > MAX_PHOTO_SIZE) {
        alert(`${file.name}は5MBを超えています`);
        continue;
      }

      // 形式チェック
      if (!file.type.startsWith('image/')) {
        alert(`${file.name}は画像ファイルではありません`);
        continue;
      }

      try {
        // 画像圧縮（通信量と待ち時間の削減）
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        });
        const preview = URL.createObjectURL(compressed);
        newPhotos.push({ file: compressed, preview });
      } catch (err) {
        console.error('画像圧縮エラー:', err);
        const preview = URL.createObjectURL(file);
        newPhotos.push({ file, preview });
      }
    }

    setPhotos([...photos, ...newPhotos]);
  };

  // 写真を削除
  const handlePhotoRemove = (index: number) => {
    const removed = photos[index];
    if (removed) URL.revokeObjectURL(removed.preview);
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  // 電話番号の形式チェック
  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // 任意項目
    const phoneRegex = /^[0-9\-+()]+$/;
    return phoneRegex.test(phone) && phone.length <= 20;
  };

  // 送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // バリデーション
    if (!category) {
      setError('カテゴリを選択してください');
      return;
    }

    if (lat === null || lng === null) {
      setError('位置情報を取得してください');
      return;
    }

    if (contactPhone && !validatePhone(contactPhone)) {
      setError('電話番号の形式が正しくありません');
      return;
    }

    setIsSubmitting(true);

    try {
      // 写真をアップロード
      const photoKeys: string[] = [];
      for (const photo of photos) {
        if (!photo.key) {
          // 署名付きURLを取得してアップロード
          const pseudoKey = `reports/${photo.file.name}`;
          const { url, key } = await getPresignedUrl(pseudoKey, photo.file.type);
          
          // S3に直接アップロード
          const response = await fetch(url, {
            method: 'PUT',
            body: photo.file,
            headers: {
              'Content-Type': photo.file.type,
            },
          });

          if (!response.ok) {
            throw new Error('画像のアップロードに失敗しました');
          }

          photoKeys.push(key);
        } else {
          photoKeys.push(photo.key);
        }
      }

      // 通報を作成
      const reportData: CreateReportRequest = {
        category: category as ReportCategory,
        lat,
        lng,
        description: description || undefined,
        contact_phone: contactPhone || undefined,
        photo_keys: photoKeys.length > 0 ? photoKeys : undefined,
      };

      await createReport(reportData);

      // 成功
      setSuccess(true);
      
      // フォームをリセット
      setCategory('');
      setDescription('');
      setContactPhone('');
      setPhotos([]);
      photos.forEach(photo => URL.revokeObjectURL(photo.preview));

      // 3秒後に成功メッセージを消す
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('送信エラー:', err);
      setError(err instanceof Error ? err.message : '送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">通報フォーム</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          通報を受け付けました。ありがとうございます。
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* カテゴリ */}
        <div>
          <label className="block text-sm font-medium mb-2">
            カテゴリ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  category === cat.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-3xl mb-2">{cat.emoji}</div>
                <div className="text-sm font-medium">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 位置情報 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            位置情報 <span className="text-red-500">*</span>
          </label>
          {lat !== null && lng !== null ? (
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                <span>緯度: {lat.toFixed(6)}, 経度: {lng.toFixed(6)}</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                位置情報は自動取得されました。地図上でピンをドラッグして調整できます。
              </p>
              <div className="mt-3 h-64 rounded-lg overflow-hidden border border-gray-300">
                <MapContainer
                  center={[lat, lng]}
                  zoom={16}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker
                    position={[lat, lng]}
                    draggable
                    eventHandlers={{
                      dragend: (e) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const p = (e.target as any).getLatLng?.();
                        if (p) {
                          setLat(p.lat);
                          setLng(p.lng);
                        }
                      },
                    }}
                  />
                </MapContainer>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              位置情報を取得中...
            </div>
          )}
        </div>

        {/* 写真 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            写真（任意、最大{MAX_PHOTOS}枚、各5MBまで）
          </label>
          <div className="space-y-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
              <Camera className="w-4 h-4" />
              写真を選択
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
                disabled={photos.length >= MAX_PHOTOS}
              />
            </label>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo.preview}
                      alt={`写真 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => handlePhotoRemove(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 詳細情報 */}
        <div>
          <label className="block text-sm font-medium mb-2">詳細情報（任意）</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="通報の詳細を入力してください"
          />
        </div>

        {/* 連絡先 */}
        <div>
          <label className="block text-sm font-medium mb-2">連絡先（任意）</label>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="電話番号"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isSubmitting || !category || lat === null || lng === null}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              送信中...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              送信
            </>
          )}
        </button>
      </form>
    </div>
  );
}

