"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FeatureImageUploader } from '@/app/components/Editor/FeatureUploader';
import { BASE_URL } from '@/app/config/config';

export default function UpdateProfile() {
    const { user, loading, isAuthenticated, router } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        profile_pic: ''
    });
    const [passwordData, setPasswordData] = useState({
        new_password: '',
        confirm_password: ''
    });
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [passwordErrors, setPasswordErrors] = useState([]);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (user) {
            console.log('user', user);
            setFormData({
                name: user.name || '',
                email: user.email || '',
                profile_pic: user.profile_pic || ''
            });
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear password errors when user starts typing
        if (passwordErrors.length > 0) {
            setPasswordErrors([]);
        }
    };

    const validatePassword = () => {
        const errors = [];
        
        if (showPasswordSection) {
            
            if (!passwordData.new_password) {
                errors.push('New password is required');
            } else {
                if (passwordData.new_password.length < 8) {
                    errors.push('New password must be at least 8 characters long');
                }
                if (!/(?=.*[a-z])/.test(passwordData.new_password)) {
                    errors.push('New password must contain at least one lowercase letter');
                }
                if (!/(?=.*[A-Z])/.test(passwordData.new_password)) {
                    errors.push('New password must contain at least one uppercase letter');
                }
                if (!/(?=.*\d)/.test(passwordData.new_password)) {
                    errors.push('New password must contain at least one number');
                }
            }
            
            if (!passwordData.confirm_password) {
                errors.push('Please confirm your new password');
            } else if (passwordData.new_password !== passwordData.confirm_password) {
                errors.push('New password and confirmation do not match');
            }
            
           
        }
        
        setPasswordErrors(errors);
        return errors.length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        // Validate password if password section is shown
        if (showPasswordSection && !validatePassword()) {
            setIsSubmitting(false);
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            
            // Prepare the data to send
            const updateData = { ...formData };
            if (showPasswordSection) {
                updateData.password = passwordData.new_password;
                updateData.password_confirmation = passwordData.confirm_password;
            }
            const response = await fetch(BASE_URL + 'user/update', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }

            setMessage({
                type: 'success',
                text: showPasswordSection 
                    ? 'Profile and password updated successfully!' 
                    : 'Profile updated successfully!'
            });

            // Clear password fields after successful update
            if (showPasswordSection) {
                setPasswordData({
                    new_password: '',
                    confirm_password: ''
                });
                setShowPasswordSection(false);
            }

        } catch (error) {
            setMessage({
                type: 'error',
                text: error.message || 'Failed to update profile. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        router.push('/dashboard');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleBack}
                                className="text-gray-600 hover:text-indigo-600 flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Dashboard
                            </button>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-700">Welcome, {user.name}</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-gray-900">Update Profile</h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    Update your personal information and profile details.
                                </p>
                            </div>

                            {/* Message Alert */}
                            {message.text && (
                                <div className={`mb-6 p-4 rounded-md ${message.type === 'success'
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-red-50 border border-red-200'
                                    }`}>
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            {message.type === 'success' ? (
                                                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'
                                                }`}>
                                                {message.text}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Password Validation Errors */}
                            {passwordErrors.length > 0 && (
                                <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">
                                                Please fix the following password errors:
                                            </h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {passwordErrors.map((error, index) => (
                                                        <li key={index}>{error}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name Field */}
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    {/* Email Field */}
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Profile Photo Section */}
                                <FeatureImageUploader 
                                    title={'Profile picture'} 
                                    featuredImage={formData.profile_pic} 
                                    UpdateFeatureImage={(profile_pic) => {
                                        setFormData({ ...formData, profile_pic: profile_pic });
                                    }} 
                                />

                                {/* Password Change Section */}
                                <div className="border-t border-gray-200 pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                                            <p className="text-sm text-gray-600">
                                                Leave blank if you don't want to change your password
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPasswordSection(!showPasswordSection);
                                                if (showPasswordSection) {
                                                    // Clear password data when hiding section
                                                    setPasswordData({
                                                        new_password: '',
                                                        confirm_password: ''
                                                    });
                                                    setPasswordErrors([]);
                                                }
                                            }}
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            {showPasswordSection ? 'Cancel' : 'Change Password'}
                                        </button>
                                    </div>

                                    {showPasswordSection && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            

                                            {/* New Password */}
                                            <div>
                                                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    id="new_password"
                                                    name="new_password"
                                                    value={passwordData.new_password}
                                                    onChange={handlePasswordChange}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Enter new password"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">
                                                    At least 8 characters with uppercase, lowercase, and number
                                                </p>
                                            </div>

                                            {/* Confirm New Password */}
                                            <div>
                                                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    id="confirm_password"
                                                    name="confirm_password"
                                                    value={passwordData.confirm_password}
                                                    onChange={handlePasswordChange}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Confirm new password"
                                                />
                                                {passwordData.new_password && passwordData.confirm_password && (
                                                    <p className={`mt-1 text-xs ${
                                                        passwordData.new_password === passwordData.confirm_password 
                                                            ? 'text-green-600' 
                                                            : 'text-red-600'
                                                    }`}>
                                                        {passwordData.new_password === passwordData.confirm_password 
                                                            ? '✓ Passwords match' 
                                                            : '✗ Passwords do not match'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Updating...
                                            </>
                                        ) : (
                                            showPasswordSection ? 'Update Profile & Password' : 'Update Profile'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}