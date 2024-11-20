import Image from "next/image";

export default function Dashboard() {
  return (
    <div className='p-10'>
      <div className='text-center mb-12'>
        <h1 className='text-6xl font-normal mb-6'>
          Plan. Celebrate. Cherish.
        </h1>
        <p className='text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed'>
          At Wedding Theory, we capture the vibrant colors and rich traditions
          of Indian weddings. From the mehndi ceremony to the grand reception,
          we preserve every precious moment.
        </p>
        <div className='flex justify-center space-x-6'>
          <button className='bg-[#8B4513] text-white px-8 py-3 rounded-full shadow-md hover:bg-[#723A0F] transition-all'>
            Get in Touch
          </button>
          <button className='bg-white text-gray-800 px-8 py-3 rounded-full shadow-md hover:bg-gray-50 transition-all'>
            Book a demo
          </button>
        </div>
      </div>

      <div className='grid grid-cols-3 gap-8'>
        {/* Example Card */}
        <div className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow'>
          <h2 className='text-2xl font-normal mb-4'>Event Insights</h2>
          <ul className='text-gray-600 space-y-2'>
            <li>Guests: 150</li>
            <li>Budget: $20,000</li>
            <li>Vendors: 5</li>
            <li>Tasks: 12</li>
          </ul>
        </div>

        {/* Another Card */}
        <div className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow'>
          <h2 className='text-2xl font-normal mb-4'>Wedding Themes</h2>
          <p className='text-gray-600 mb-4'>Which theme do you prefer?</p>
          <ul className='text-gray-600 space-y-2'>
            <li>Traditional</li>
            <li>Contemporary</li>
            <li>Royal</li>
            <li>Destination</li>
          </ul>
        </div>

        {/* Profile Card */}
        <div className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow'>
          <h2 className='text-2xl font-normal mb-4'>Sarah Mickella</h2>
          <p className='text-gray-600'>sarah@weddingtheory.com</p>
          <p className='text-gray-600 mt-4'>Event Date: 30 Mar 2024</p>
          <p className='text-gray-600'>Tasks Completed: 48</p>
        </div>
      </div>
    </div>
  );
}
