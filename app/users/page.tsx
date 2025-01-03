'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiCheckLine,
  RiMailLine,
  RiMailSendLine,
  RiAlertLine,
} from 'react-icons/ri';
import { useVirtualizer } from '@tanstack/react-virtual';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'editor';
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor'>(
    'editor'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'editor'>(
    'all'
  );
  const [invitedEmail, setInvitedEmail] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | JSX.Element | null>(null);
  const supabase = createClientComponentClient();
  const [inviteProgress, setInviteProgress] = useState(0);
  const [isDeletingExisting, setIsDeletingExisting] = useState(false);
  const [deleteExistingProgress, setDeleteExistingProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const USERS_PER_PAGE = 10;
  const parentRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const from = (page - 1) * USERS_PER_PAGE;
        const to = from + USERS_PER_PAGE - 1;

        const { data, error, count } = await supabase
          .from('cms_users')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;

        if (page === 1) {
          setUsers(data as User[]);
        } else {
          setUsers((prev) => [...prev, ...(data as User[])]);
        }

        setHasMore(count ? from + USERS_PER_PAGE < count : false);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setCurrentPage((prev) => prev + 1);
      fetchUsers(currentPage + 1);
    }
  }, [isLoading, hasMore, currentPage, fetchUsers]);

  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from('cms_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userData) {
        setCurrentUser(userData);
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInviteProgress(0);
    setDeleteExistingProgress(0);
    setCheckProgress(0);
    setStatusMessage('');
    setIsChecking(true);
    setIsDeletingExisting(false);

    try {
      // Step 1: Check if user exists using our API endpoint
      setStatusMessage('Checking if user exists...');
      setCheckProgress(50);

      const checkResponse = await fetch('/api/check-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newUserEmail }),
      });

      const checkData = await checkResponse.json();
      console.log('Check Response:', checkData); // Debug log

      if (!checkResponse.ok) {
        throw new Error(checkData.error || 'Failed to check user existence');
      }

      setCheckProgress(100);

      if (checkData.exists) {
        if (checkData.user.existsIn === 'both') {
          // If user exists in both tables, show the CMS user details and don't delete
          const role = checkData.user.cmsDetails?.role;
          const createdAt = checkData.user.cmsDetails?.created_at
            ? new Date(
                checkData.user.cmsDetails.created_at
              ).toLocaleDateString()
            : 'unknown date';

          setStatusMessage('');
          setError(
            <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
              <div className='flex items-center mb-3'>
                <div className='bg-blue-100 rounded-full p-2 mr-3'>
                  <RiAlertLine className='h-5 w-5 text-blue-600' />
                </div>
                <h3 className='text-lg font-semibold text-blue-900'>
                  User Already Exists
                </h3>
              </div>
              <div className='ml-10 space-y-2'>
                <p className='text-blue-800'>
                  <span className='font-medium'>Email:</span>{' '}
                  <span className='text-blue-700'>{checkData.user.email}</span>
                </p>
                <p className='text-blue-800'>
                  <span className='font-medium'>Role:</span>{' '}
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                    {role}
                  </span>
                </p>
                <p className='text-blue-800'>
                  <span className='font-medium'>Joined:</span>{' '}
                  <span>{createdAt}</span>
                </p>
                <p className='mt-3 text-sm text-blue-600'>
                  This user is already registered in the system. No action
                  needed.
                </p>
              </div>
            </div>
          );
          setLoading(false);
          return;
        } else {
          // If user exists in only one table, proceed with deletion
          setStatusMessage(
            `User found in ${
              checkData.user.existsIn === 'auth'
                ? 'auth table only'
                : 'CMS table only'
            }! Preparing to delete existing user...`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Step 2: Delete existing user
          setIsDeletingExisting(true);
          setStatusMessage('Deleting existing user...');
          setDeleteExistingProgress(20);

          try {
            const deleteResponse = await fetch('/api/delete-auth-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId: checkData.user.id }),
            });

            const deleteData = await deleteResponse.json();
            console.log('Delete Response:', deleteData); // Debug log

            if (!deleteResponse.ok) {
              throw new Error(
                deleteData.error || 'Failed to delete existing user'
              );
            }

            setDeleteExistingProgress(100);
            setStatusMessage('Successfully removed existing user');
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (deleteError: any) {
            console.error('Delete Error:', deleteError); // Debug log
            throw new Error(
              `Failed to delete existing user: ${deleteError.message}`
            );
          }
        }
      } else {
        setStatusMessage(
          'No existing user found, proceeding with invitation...'
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Reset states before moving to invite
      setIsChecking(false);
      setIsDeletingExisting(false);
      setDeleteExistingProgress(0);

      // Step 3: Send invite
      setStatusMessage('Sending invitation...');
      setInviteProgress(30);

      const inviteResponse = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newUserEmail }),
      });

      const inviteData = await inviteResponse.json();
      console.log('Invite Response:', inviteData); // Debug log

      if (!inviteResponse.ok) {
        // If we get a "user already exists" error, something went wrong with our deletion
        // Let's try the deletion one more time
        if (inviteData.error?.includes('already been registered')) {
          throw new Error('User still exists in the system. Please try again.');
        }
        throw new Error(inviteData.error || 'Failed to send invitation');
      }

      setInviteProgress(70);
      setStatusMessage('Processing invitation...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      setInviteProgress(100);
      setStatusMessage('Invitation sent successfully!');
      await new Promise((resolve) => setTimeout(resolve, 500));

      setInvitedEmail(newUserEmail);
      setShowAddModal(false);
      setShowSuccessModal(true);
      setNewUserEmail('');
    } catch (error: any) {
      console.error('Error in handleAddUser:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setInviteProgress(0);
      setDeleteExistingProgress(0);
      setCheckProgress(0);
      setIsChecking(false);
      setIsDeletingExisting(false);
    }
  };

  const initiateDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
    setDeleteProgress(0);
    setIsDeleting(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setDeleteProgress(10);

    try {
      // Delete user through our API endpoint
      const response = await fetch('/api/delete-auth-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userToDelete.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setDeleteProgress(100);

      // Refresh the users list
      await fetchUsers();

      // Close the modal and reset states
      setTimeout(() => {
        setShowDeleteModal(false);
        setUserToDelete(null);
        setDeleteProgress(0);
        setIsDeleting(false);
      }, 500);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.message || 'Failed to delete user. Please try again.');
      setDeleteProgress(0);
      setIsDeleting(false);
    }
  };

  const handleUpdateRole = async (
    userId: string,
    newRole: 'admin' | 'editor'
  ) => {
    const { error } = await supabase
      .from('cms_users')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      return;
    }

    setEditingUserId(null);
    fetchUsers();
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const isNotCurrentUser = currentUser ? user.id !== currentUser.id : true;
    return matchesSearch && matchesRole && isNotCurrentUser;
  });

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setError(null);
    setNewUserEmail('');
    setLoading(false);
    setInviteProgress(0);
    setDeleteExistingProgress(0);
    setCheckProgress(0);
    setStatusMessage('');
    setIsChecking(false);
    setIsDeletingExisting(false);
  };

  const rowVirtualizer = useVirtualizer({
    count: filteredUsers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated height of each user item
    overscan: 5,
  });

  return (
    <div className='min-h-screen max-h-screen flex flex-col p-8 overflow-hidden'>
      <div className='flex-none'>
        <PageHeader
          title='Users'
          description='Manage system users and their roles'
          action={
            <Button icon={RiAddLine} onClick={handleOpenAddModal}>
              Invite User
            </Button>
          }
        />

        <div className='mt-4 relative'>
          <div className='flex gap-4 mb-6'>
            <div className='flex-1 relative'>
              <input
                type='text'
                placeholder='Search users by email...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as 'all' | 'admin' | 'editor')
              }
              className='px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              aria-label='Filter users by role'
            >
              <option value='all'>All Roles</option>
              <option value='admin'>Admins</option>
              <option value='editor'>Editors</option>
            </select>
          </div>
        </div>
      </div>

      {currentUser && (
        <div className='mb-8'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Your Account
          </h2>
          <div className='bg-blue-50 rounded-lg p-6'>
            <div className='flex items-center space-x-4'>
              <div className='bg-blue-100 rounded-full p-2'>
                <RiMailLine className='h-6 w-6 text-blue-600' />
              </div>
              <div>
                <h3 className='text-lg font-medium text-gray-900'>
                  {currentUser.email}
                </h3>
                <div className='mt-1 flex items-center text-sm text-gray-500 space-x-4'>
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                    {currentUser.role}
                  </span>
                  <span>
                    {new Date(currentUser.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        ref={parentRef}
        className='flex-1 bg-white rounded-lg shadow-sm overflow-auto'
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          if (
            target.scrollHeight - target.scrollTop <=
            target.clientHeight * 1.5
          ) {
            loadMore();
          }
        }}
      >
        <div className='grid grid-cols-1 gap-4 p-6'>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className='flex items-center justify-between p-4 border rounded-lg hover:border-blue-200 transition-colors duration-200'
            >
              <div className='flex items-center space-x-4'>
                <div className='bg-blue-100 rounded-full p-2'>
                  <RiMailLine className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <h3 className='text-lg font-medium text-gray-900'>
                    {user.email}
                  </h3>
                  <div className='mt-1 flex items-center text-sm text-gray-500 space-x-4'>
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                      {user.role}
                    </span>
                    <span>
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className='flex space-x-2'>
                {editingUserId === user.id ? (
                  <div className='flex items-center space-x-2'>
                    <select
                      value={selectedRole}
                      onChange={(e) =>
                        setSelectedRole(e.target.value as 'admin' | 'editor')
                      }
                      className='rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      aria-label='Select user role'
                    >
                      <option value='admin'>Admin</option>
                      <option value='editor'>Editor</option>
                    </select>
                    <Button
                      variant='primary'
                      icon={RiCheckLine}
                      onClick={() => handleUpdateRole(user.id, selectedRole)}
                      className='bg-green-600 hover:bg-green-700'
                    >
                      Save
                    </Button>
                    <Button
                      variant='secondary'
                      onClick={() => setEditingUserId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant='secondary'
                      onClick={() => {
                        setEditingUserId(user.id);
                        setSelectedRole(user.role);
                      }}
                    >
                      Edit Role
                    </Button>
                    <Button
                      variant='secondary'
                      icon={RiDeleteBin6Line}
                      onClick={() => initiateDeleteUser(user)}
                      className='text-red-600 hover:bg-red-50 hover:text-red-700'
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className='text-center py-4'>
              <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]'></div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full'>
            <div className='flex items-center space-x-3 mb-6'>
              <div className='bg-red-100 rounded-full p-2'>
                <RiAlertLine className='h-6 w-6 text-red-600' />
              </div>
              <h2 className='text-2xl font-semibold text-gray-900'>
                Delete User
              </h2>
            </div>

            <div className='mb-6'>
              <p className='text-gray-700 mb-4'>
                Are you sure you want to delete the user:
                <span className='font-semibold block mt-1'>
                  {userToDelete.email}
                </span>
              </p>
              <p className='text-sm text-red-600'>
                This action cannot be undone. The user will be completely
                removed from the system.
              </p>
            </div>

            {isDeleting && (
              <div className='mb-6'>
                <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-blue-600 transition-all duration-500 ease-out'
                    style={{ width: `${deleteProgress}%` }}
                  />
                </div>
                <p className='text-sm text-gray-600 mt-2'>
                  Deleting user... {deleteProgress}%
                </p>
              </div>
            )}

            <div className='flex justify-end space-x-2'>
              <Button
                variant='secondary'
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                  setDeleteProgress(0);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant='primary'
                className='bg-red-600 hover:bg-red-700'
                onClick={handleDeleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showAddModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full'>
            <div className='flex items-center space-x-3 mb-6'>
              <div className='bg-blue-100 rounded-full p-2'>
                <RiMailSendLine className='h-6 w-6 text-blue-600' />
              </div>
              <h2 className='text-2xl font-semibold text-gray-900'>
                Invite New User
              </h2>
            </div>
            <form onSubmit={handleAddUser} className='space-y-4'>
              <div>
                <label
                  htmlFor='newUserEmail'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Email Address
                </label>
                <input
                  id='newUserEmail'
                  type='email'
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                  required
                  placeholder="Enter user's email address"
                  aria-label='New user email address'
                />
              </div>

              {(isChecking || isDeletingExisting || inviteProgress > 0) && (
                <div className='space-y-2'>
                  <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                    <div
                      className={`h-full transition-all duration-500 ease-out ${
                        isDeletingExisting
                          ? 'bg-red-600'
                          : inviteProgress > 0
                          ? 'bg-blue-600'
                          : 'bg-yellow-600'
                      }`}
                      style={{
                        width: `${
                          isDeletingExisting
                            ? deleteExistingProgress
                            : inviteProgress > 0
                            ? inviteProgress
                            : checkProgress
                        }%`,
                      }}
                    />
                  </div>
                  <p className='text-sm text-gray-600'>{statusMessage}</p>
                </div>
              )}

              {error && (
                <div
                  className={
                    typeof error === 'string'
                      ? 'bg-red-50 text-red-500 p-4 rounded-lg text-sm flex items-center space-x-2'
                      : ''
                  }
                >
                  {typeof error === 'string' ? (
                    <>
                      <span className='flex-shrink-0'>⚠️</span>
                      <span>{error}</span>
                    </>
                  ) : (
                    error
                  )}
                </div>
              )}

              <div className='flex justify-end space-x-2 pt-4'>
                {!loading && !error && (
                  <Button
                    variant='secondary'
                    onClick={() => setShowAddModal(false)}
                    className='hover:bg-gray-100 transition-colors duration-200'
                  >
                    Cancel
                  </Button>
                )}
                {error ? (
                  <Button
                    onClick={() => {
                      setShowAddModal(false);
                      setError(null);
                      setNewUserEmail('');
                    }}
                    className='bg-blue-600 hover:bg-blue-700 transition-colors duration-200'
                  >
                    Close
                  </Button>
                ) : (
                  <Button
                    type='submit'
                    disabled={loading}
                    className='bg-blue-600 hover:bg-blue-700 transition-colors duration-200'
                  >
                    {loading ? 'Processing...' : 'Send Invitation'}
                  </Button>
                )}
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
                <svg
                  width='32'
                  height='32'
                  viewBox='0 0 24 24'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z'
                    fill='#4CAF50'
                  />
                </svg>
              </div>

              <h2 className='text-[28px] font-normal text-gray-900 mb-6'>
                Invitation Sent!
              </h2>

              <div className='bg-[#F8F9FF] rounded-lg p-4 mb-4'>
                <p className='text-[#1A1A1A]'>
                  An invitation email has been sent to:
                  <br />
                  <span className='text-[#0066FF] font-medium'>
                    {invitedEmail}
                  </span>
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