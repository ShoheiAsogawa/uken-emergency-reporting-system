import { Phone } from 'lucide-react';

const EMERGENCY_PHONE = '0997-67-2211';

export default function EmergencyButton() {
  const handleCall = () => {
    if (confirm(`緊急通報先 ${EMERGENCY_PHONE} に電話をかけますか？`)) {
      window.location.href = `tel:${EMERGENCY_PHONE}`;
    }
  };

  return (
    <button
      onClick={handleCall}
      className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold transition-colors"
    >
      <Phone className="w-5 h-5" />
      緊急通報
    </button>
  );
}

