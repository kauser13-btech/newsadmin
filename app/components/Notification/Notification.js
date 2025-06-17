import { CheckCircle, AlertCircle, X } from 'lucide-react';
export const Notification = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 mb-4`}>
      <div className="flex items-start">
        <Icon className={`w-5 h-5 ${textColor} mt-0.5 mr-3 flex-shrink-0`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`ml-3 flex-shrink-0 ${textColor} hover:opacity-75`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};