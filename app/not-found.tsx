import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F4]">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4 text-gray-800">404</h2>
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Page Not Found</h3>
        <p className="mb-4 text-gray-600">Could not find the requested resource</p>
        <Link 
          href="/"
          className="text-[#8B4513] hover:text-[#723A0F] underline"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
} 