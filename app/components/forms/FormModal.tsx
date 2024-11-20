import { RiCloseLine } from 'react-icons/ri';
import Button from '../Button';

interface FormModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function FormModal({ title, onClose, children }: FormModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg w-[98%] max-w-7xl h-[98vh] flex flex-col">
        <div className="flex justify-between items-center px-8 py-6 border-b">
          <h2 className="text-3xl font-semibold text-gray-900">{title}</h2>
          <Button variant="secondary" icon={RiCloseLine} onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 