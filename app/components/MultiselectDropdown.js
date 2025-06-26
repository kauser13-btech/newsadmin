import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, X, Search } from 'lucide-react';



const MultiselectDropdown = ({ news_categories, resetDropSelected, handleCategoryChange, totalNews = 0, preselected=[] }) => {
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    // Filter categories based on search term
    const filteredCategories = news_categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle category selection
    const handleCategoryToggle = (category) => {
        setSelectedCategories(prev => {
            const isSelected = prev.some(cat => cat.id === category.id);
            if (isSelected) {
                return prev.filter(cat => cat.id !== category.id);
            } else {
                return [...prev, category];
            }
        });
    };

    useEffect(() => {
        handleCategoryChange(selectedCategories);
    }, [selectedCategories]);

    // Remove specific category
    const removeCategory = (categoryId) => {
        setSelectedCategories(prev => prev.filter(cat => cat.id !== categoryId));
    };

    // Clear all selections
    const clearAll = () => {
        setSelectedCategories([]);
        resetDropSelected([]);
    };

    // Select all categories
    const selectAll = () => {
        setSelectedCategories(news_categories);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    useEffect(() => {

        if (preselected.length > 0 && selectedCategories.length === 0)
            setSelectedCategories(news_categories.filter(cat => {
                return preselected.includes(cat.id);
            }))
    }, [preselected])

    // Get display text for dropdown button
    const getDisplayText = () => {
        if (selectedCategories.length === 0) {
            return 'সব বিভাগ নির্বাচন করুন';
        } else if (selectedCategories.length === 1) {
            return selectedCategories[0].name;
        } else if (selectedCategories.length === news_categories.length) {
            return 'সব বিভাগ নির্বাচিত';
        } else {
            return `${selectedCategories.length}টি বিভাগ নির্বাচিত`;
        }
    };
    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">বিভাগ অনুযায়ী ফিল্টার</h2>
            </div>

            <div className="relative" ref={dropdownRef}>
                {/* Dropdown Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full max-w-md bg-white border border-gray-300 rounded-lg px-4 py-3 text-left text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{getDisplayText()}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-50 w-full max-w-md mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="বিভাগ খুঁজুন..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-3 border-b border-gray-200 flex gap-2">
                            <button
                                onClick={selectAll}
                                className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors duration-200"
                            >
                                সব নির্বাচন করুন
                            </button>
                            <button
                                onClick={clearAll}
                                className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100 transition-colors duration-200"
                            >
                                সব মুছুন
                            </button>
                        </div>

                        {/* Category List */}
                        <div className="max-h-60 overflow-y-auto">
                            {filteredCategories.length === 0 ? (
                                <div className="p-3 text-sm text-gray-500 text-center">
                                    কোন বিভাগ পাওয়া যায়নি
                                </div>
                            ) : (
                                filteredCategories.map((category) => {
                                    const isSelected = selectedCategories.some(cat => cat.id === category.id);
                                    return (
                                        <label
                                            key={category.id}
                                            className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {
                                                    handleCategoryToggle(category);
                                                }}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-3 text-sm text-gray-700">{category.name}</span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Selected Categories Display */}
            {selectedCategories.length > 0 && (
                <div className="mt-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {selectedCategories.map((category) => (
                            <span
                                key={category.id}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                            >
                                {category.name}
                                <button
                                    onClick={() => removeCategory(category.id)}
                                    className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 transition-colors duration-200"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Total News Count */}
            <div className="mt-3 text-sm text-gray-600">
                {selectedCategories.length === 0 || selectedCategories.length === news_categories.length
                    ? `মোট ${totalNews} টি সংবাদ`
                    : `নির্বাচিত বিভাগে ${Math.floor(totalNews * 0.8)} টি সংবাদ`}
            </div>
        </div>
    );
};

export default MultiselectDropdown;