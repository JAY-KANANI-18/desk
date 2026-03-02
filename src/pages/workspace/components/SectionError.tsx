import { AlertCircle } from 'lucide-react';

interface SectionErrorProps {
  message: string;
  onRetry: () => void;
}

export const SectionError = ({ message, onRetry }: SectionErrorProps) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <AlertCircle size={24} className="text-red-400" />
    <p className="text-sm text-gray-500">{message}</p>
    <button onClick={onRetry} className="text-sm text-indigo-600 hover:underline">
      Try again
    </button>
  </div>
);
