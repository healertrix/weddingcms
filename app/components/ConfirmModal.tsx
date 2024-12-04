import Button from './Button';
import { RiCloseLine } from 'react-icons/ri';

interface ConfirmModalProps {
  title: string;
  message: string | React.ReactNode;
  confirmLabel: string;
  onConfirm: (e: React.MouseEvent) => void;
  onCancel: () => void;
  confirmButtonClassName?: string;
  disabled?: boolean;
  showCloseButton?: boolean;
  onCloseButtonClick?: () => void;
  showCancelButton?: boolean;
  allowBackgroundCancel?: boolean;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  confirmButtonClassName = '',
  disabled = false,
  showCloseButton = false,
  onCloseButtonClick,
  showCancelButton = true,
  allowBackgroundCancel = true
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={allowBackgroundCancel ? onCancel : undefined}
        />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-500 transition-colors"
            aria-label="Close modal"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
          
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                  {title}
                </h3>
                <div className="mt-2">
                  {typeof message === 'string' ? (
                    <p className="text-sm text-gray-500 whitespace-pre-line">{message}</p>
                  ) : (
                    message
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:w-auto ${
                confirmButtonClassName || 'bg-red-600 text-white hover:bg-red-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={onConfirm}
              disabled={disabled}
            >
              {confirmLabel}
            </button>
            {showCancelButton && (
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 