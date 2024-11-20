import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine } from 'react-icons/ri';

export default function UsersPage() {
  return (
    <div className='p-8'>
      <PageHeader
        title="Users"
        description="Manage system users and their roles"
        action={
          <Button icon={RiAddLine}>
            Add User
          </Button>
        }
      />
      
      <div className='bg-white rounded-lg shadow'>
        <div className='grid grid-cols-1 gap-4 p-6'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='flex items-center justify-between p-4 border rounded-lg'>
              <div>
                <h3 className='text-lg font-medium'>John Doe</h3>
                <div className='mt-1 flex items-center text-sm text-gray-500 space-x-4'>
                  <span>john@example.com</span>
                  <span>Role: Admin</span>
                </div>
              </div>
              <Button variant='secondary' icon={RiEditLine}>
                Edit
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 