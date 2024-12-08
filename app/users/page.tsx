'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line } from 'react-icons/ri';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'editor';
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor'>('editor');
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
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: Math.random().toString(36).slice(-8), // Generate random password
        email_confirm: true,
      });

      if (authError) throw authError;

      // Then add to our cms_users table
      const { error: dbError } = await supabase
        .from('cms_users')
        .insert([
          {
            id: authData.user.id,
            email: newUserEmail,
            role: newUserRole,
          }
        ]);

      if (dbError) throw dbError;

      setShowAddModal(false);
      setNewUserEmail('');
      setNewUserRole('editor');
      fetchUsers();
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
            Add User
          </Button>
        }
      />
      
      <div className='bg-white rounded-lg shadow'>
        <div className='grid grid-cols-1 gap-4 p-6'>
          {users.map((user) => (
            <div key={user.id} className='flex items-center justify-between p-4 border rounded-lg'>
              <div>
                <h3 className='text-lg font-medium'>{user.email}</h3>
                <div className='mt-1 flex items-center text-sm text-gray-500 space-x-4'>
                  <span>Role: {user.role}</span>
                  <span>Added: {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className='flex space-x-2'>
                <Button 
                  variant='secondary' 
                  icon={RiEditLine}
                  onClick={() => alert('Edit functionality coming soon')}
                >
                  Edit
                </Button>
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full'>
            <h2 className='text-2xl font-normal mb-4'>Add New User</h2>
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
                  className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  required
                  placeholder="Enter user's email address"
                  aria-label="New user email address"
                />
              </div>
              
              <div>
                <label htmlFor="newUserRole" className='block text-sm font-medium text-gray-700 mb-2'>
                  Role
                </label>
                <select
                  id="newUserRole"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'editor')}
                  className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  aria-label="Select user role"
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {error && (
                <div className='bg-red-50 text-red-500 p-4 rounded-lg text-sm'>
                  {error}
                </div>
              )}

              <div className='flex justify-end space-x-2 pt-4'>
                <Button
                  variant='secondary'
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 