"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BASE_URL } from '../config/config';

const CategoryCRUD = () => {
    const { news_categories, user, fetcCategories, router } = useAuth();
    // Initial category data

    const [categories, setCategories] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        parent_id: 0,
        position: 1,
        active: true
    });

    useEffect(() => {
        if (news_categories.length > 0) {
            setCategories(news_categories);
        }
    }, [news_categories]);
    // Get root categories (parent_id = 0) for dropdown
    const getRootCategories = () => {
        return categories.filter(cat => cat.parent_id === 0);
    };

    // Get all categories organized by parent
    const getCategorizedList = () => {
        const rootCategories = categories.filter(cat => cat.parent_id === 0);
        const childCategories = categories.filter(cat => cat.parent_id !== 0);

        return rootCategories.map(root => ({
            ...root,
            children: childCategories.filter(child => child.parent_id === root.id)
        }));
    };

    // Generate slug from name
    const generateSlug = (name) => {
        return name.toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Auto-generate slug when name changes
        if (name === 'name') {
            setFormData(prev => ({
                ...prev,
                slug: generateSlug(value)
            }));
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            parent_id: 0,
            position: 1,
            active: true
        });
        setEditingCategory(null);
        setShowForm(false);
    };

    // Handle create/update
    const handleSubmit = async () => {
        const token = localStorage.getItem('auth_token');
        // Basic validation
        if (!formData.name.trim()) {
            alert('Name and slug are required');
            return;
        }

        // if (editingCategory) {
        //     // Update existing category
        //     setCategories(prev => prev.map(cat =>
        //         cat.id === editingCategory.id
        //             ? {
        //                 ...cat,
        //                 ...formData,
        //                 updated_at: new Date().toISOString()
        //             }
        //             : cat
        //     ));
        // } else {
        //     // Create new category
        //     const newCategory = {
        //         id: Math.max(...categories.map(c => c.id)) + 1,
        //         ...formData,
        //         created_at: new Date().toISOString(),
        //         updated_at: new Date().toISOString()
        //     };
        //     setCategories(prev => [...prev, newCategory]);
        // }
        const cat = {
            ...(editingCategory && { id: editingCategory.id }),
            name: formData.name,
            position: formData.position,
            parent_id: formData.parent_id
        }; Ï
        await fetch(`${BASE_URL}admin/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(cat)
        });
        await fetcCategories();
        resetForm();
    };

    // Handle edit
    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug,
            parent_id: category.parent_id,
            position: category.position,
            active: category.active ?? true
        });
        setShowForm(true);
    };

    // Handle delete
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            setCategories(prev => prev.filter(cat => cat.id !== id));
        }
    };

    // Toggle active status
    const toggleActive = async (root_cat) => {
        const token = localStorage.getItem('auth_token');
        const cates = {
            id: root_cat.id,
            active: !root_cat.active
        };
        await fetch(`${BASE_URL}admin/categories/toggle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(cates)
        });
        setCategories(prev => prev.map(cat =>
            cat.id === root_cat.id
                ? { ...cat, active: !cat.active, updated_at: new Date().toISOString() }
                : cat
        ));
    };

    const handleBack = () => {
        router.push('/dashboard');
    };
    const categorizedList = getCategorizedList();
    return (
        <>
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
                            <span className="text-gray-700">Welcome, {user?.name}</span>
                        </div>
                    </div>
                </div>
            </nav>
            <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
                <div className="bg-white rounded-lg shadow-md">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
                        >
                            <Plus size={20} />
                            Add Category
                        </button>
                    </div>

                    {/* Form Modal */}
                    {showForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">
                                        {editingCategory ? 'Edit Category' : 'Add New Category'}
                                    </h2>
                                    <button
                                        onClick={resetForm}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    {/* <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Slug
                                        </label>
                                        <input
                                            type="text"
                                            name="slug"
                                            value={formData.slug}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div> */}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Parent Category
                                        </label>
                                        <select
                                            name="parent_id"
                                            value={formData.parent_id}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value={0}>Root Category</option>
                                            {getRootCategories().map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Position
                                        </label>
                                        <input
                                            type="number"
                                            name="position"
                                            value={formData.position}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="1"
                                            required
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="active"
                                            checked={formData.active}
                                            onChange={handleInputChange}
                                            className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label className="text-sm font-medium text-gray-700">
                                            Active
                                        </label>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={async (e) => {
                                                if (e) e.preventDefault();
                                                await handleSubmit();
                                            }}
                                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Save size={16} />
                                            {editingCategory ? 'Update' : 'Save'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Categories List */}
                    <div className="p-6">
                        <div className="space-y-4">
                            {categorizedList.map(rootCategory => (
                                <div key={rootCategory.id} className="border border-gray-200 rounded-lg">
                                    {/* Root Category */}
                                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{rootCategory.name}</h3>
                                                <p className="text-sm text-gray-600">/{rootCategory.slug}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${rootCategory.active !== false
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {rootCategory.active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                                Position: {rootCategory.position}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={async () => {
                                                    await toggleActive(rootCategory);
                                                }}
                                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${rootCategory.active !== false
                                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    }`}
                                            >
                                                {rootCategory.active !== 0 ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(rootCategory)}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rootCategory.id)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Child Categories */}
                                    {rootCategory.children.length > 0 && (
                                        <div className="divide-y divide-gray-200">
                                            {rootCategory.children.map(childCategory => (
                                                <div key={childCategory.id} className="p-4 pl-8 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-4 h-4 border-l-2 border-b-2 border-gray-300"></div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-700">{childCategory.name}</h4>
                                                            <p className="text-sm text-gray-500">/{childCategory.slug}</p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${childCategory.active !== false
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {childCategory.active !== false ? 'Active' : 'Inactive'}
                                                        </span>
                                                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                                            Position: {childCategory.position}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                await toggleActive(childCategory);
                                                            }}
                                                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${childCategory.active !== false
                                                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                }`}
                                                        >
                                                            {childCategory.active !== false ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(childCategory)}
                                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(childCategory.id)}
                                                            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>

    );
};

export default CategoryCRUD;