type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className='mb-8 flex justify-between items-center'>
      <div>
        <h1 className='text-2xl font-semibold text-gray-900'>{title}</h1>
        {description && (
          <p className='mt-2 text-sm text-gray-600'>{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
} 