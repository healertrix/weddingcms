type FormFieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
};

export default function FormField({ label, required, children, error }: FormFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
} 