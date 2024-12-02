import Button from './Button';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmButtonClassName?: string;
}

export default function ConfirmModal({ 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmLabel = 'Confirm',
  confirmButtonClassName = 'bg-red-600 hover:bg-red-700 text-white'
}: ConfirmModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 mb-6 whitespace-pre-wrap">{message}</p>
        <div className="flex justify-end gap-4">
          <Button 
            variant="secondary" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className={confirmButtonClassName}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
} 