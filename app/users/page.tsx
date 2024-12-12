'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiDeleteBin6Line, RiCheckLine, RiMailLine, RiMailSendLine } from 'react-icons/ri';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'editor';
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: users, error } = await supabase
      .from('cms_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    setUsers(users || []);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newUserEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setInvitedEmail(newUserEmail);
      setShowAddModal(false);
      setShowSuccessModal(true);
      setNewUserEmail('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const { error } = await supabase
      .from('cms_users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return;
    }

    fetchUsers();
  };

  return (
    <div className='p-8'>
      <PageHeader
        title="Users"
        description="Manage system users and their roles"
        action={
          <Button icon={RiAddLine} onClick={() => setShowAddModal(true)}>
            Invite User
          </Button>
        }
      />
      
      <div className='bg-white rounded-lg shadow'>
        <div className='grid grid-cols-1 gap-4 p-6'>
          {users.map((user) => (
            <div key={user.id} className='flex items-center justify-between p-4 border rounded-lg hover:border-blue-200 transition-colors duration-200'>
              <div className='flex items-center space-x-4'>
                <div className='bg-blue-100 rounded-full p-2'>
                  <RiMailLine className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <h3 className='text-lg font-medium text-gray-900'>{user.email}</h3>
                  <div className='mt-1 flex items-center text-sm text-gray-500 space-x-4'>
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                      {user.role}
                    </span>
                    <span>{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className='flex space-x-2'>
                <Button 
                  variant='secondary' 
                  icon={RiDeleteBin6Line}
                  onClick={() => handleDeleteUser(user.id)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite User Modal */}
      {showAddModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full'>
            <div className='flex items-center space-x-3 mb-6'>
              <div className='bg-blue-100 rounded-full p-2'>
                <RiMailSendLine className='h-6 w-6 text-blue-600' />
              </div>
              <h2 className='text-2xl font-semibold text-gray-900'>Invite New User</h2>
            </div>
            <form onSubmit={handleAddUser} className='space-y-4'>
              <div>
                <label htmlFor="newUserEmail" className='block text-sm font-medium text-gray-700 mb-2'>
                  Email Address
                </label>
                <input
                  id="newUserEmail"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                  required
                  placeholder="Enter user's email address"
                  aria-label="New user email address"
                />
              </div>

              {error && (
                <div className='bg-red-50 text-red-500 p-4 rounded-lg text-sm flex items-center space-x-2'>
                  <span className='flex-shrink-0'>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className='flex justify-end space-x-2 pt-4'>
                <Button
                  variant='secondary'
                  onClick={() => setShowAddModal(false)}
                  className='hover:bg-gray-100 transition-colors duration-200'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={loading}
                  className='bg-blue-600 hover:bg-blue-700 transition-colors duration-200'
                >
                  {loading ? 'Sending Invitation...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg p-8 max-w-md w-full transform transition-all duration-300 ease-in-out'>
            <div className='text-center'>
              <div className='mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-[#E8F5E9] mb-6'>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#4CAF50"/>
                </svg>
              </div>
              
              <h2 className='text-[28px] font-normal text-gray-900 mb-6'>
                Invitation Sent!
              </h2>

              <div className='bg-[#F8F9FF] rounded-lg p-4 mb-4'>
                <p className='text-[#1A1A1A]'>
                  An invitation email has been sent to:
                  <br />
                  <span className='text-[#0066FF] font-medium'>{invitedEmail}</span>
                </p>
              </div>

              <p className='text-gray-600 mb-6'>
                They will receive instructions to set up their account.
              </p>

              <button
                onClick={() => setShowSuccessModal(false)}
                className='w-full bg-[#22C55E] hover:bg-[#1EA34E] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200'
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 