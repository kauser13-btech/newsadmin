"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Edit, Filter, Star, Check } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { BASE_URL } from '@/app/config/config';
import LeadNewsSort from '@/app/components/LeadNewsList/LeadNewsSort';
import SortableNewsList from '@/app/components/LeadNewsList/SortableNewsList';
import Link from 'next/link';

const NewsListView = () => {
    const [tmp_lead_news, setTmpLeadnews] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState('top');
    const { news_categories, user, loading, isAuthenticated, handleLogout, router } = useAuth();

    // State for news data and loading
    const [newsData, setNewsData] = useState([]);
    const [isLoadingNews, setIsLoadingNews] = useState(true);
    const [error, setError] = useState(null);

    // Pagination and filtering state
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState({ id: -1, name: 'সব' });
    const [totalPages, setTotalPages] = useState(1);
    const [totalNews, setTotalNews] = useState(0);

    const [lead_news_id, setLeadNewsId] = useState(null);

    const PostToLeadNews = async (news_id) => {
        let url = `${BASE_URL}admin/posts/leadnews`;
        const authtoken = localStorage.getItem('auth_token');
        try {
            const rep = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authtoken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ news_id: news_id })
            });
            console.log('rep', rep);
        } catch (e) {
        }
    }

    // Fetch news data
    const fetchNews = async (page = 1, category = null) => {
        const token = localStorage.getItem('auth_token');
        setIsLoadingNews(true);
        try {

            // Build API URL with pagination and category filter
            let url = (category?.id && category.id === -1) ? `${BASE_URL}admin/posts/allposts?page=${page}` : `${BASE_URL}admin/posts/category/${category.id}?page=${page}`;


            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch news data');
            }

            const data = await response.json();

            if (data.success) {
                setNewsData(data.posts);
                setTotalPages(data.pagination.last_page);
                setTotalNews(data.pagination.total);
                setError(null);
            } else {
                throw new Error('API returned unsuccessful response');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching news:', err);
        } finally {
            setIsLoadingNews(false);
        }
    };

    // Initial data fetch
    useEffect(() => {
        if (isAuthenticated && news_categories.length > 0) {
            fetchNews(1, selectedCategory);
        }
    }, [isAuthenticated, news_categories]);

    // Handle category change
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setCurrentPage(1);
        fetchNews(1, category);
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchNews(page, selectedCategory);
    };

    // Handle edit button click
    const handleEdit = (newsId) => {
        console.log('Edit news with ID:', newsId);
        // Navigate to edit page
        router.push(`/news/edit/${newsId}`);
    };



    // Handle make lead news button click
    const handleMakeLeadNews = async (newsId) => {
        setLeadNewsId(newsId);
        await PostToLeadNews(newsId);
        setIsOpen(true);

    };

    // Navigation functions
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };



    // Strip HTML tags from content
    const stripHtml = (html) => {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    };

    // Get summary from post content if summary is null
    const getSummary = (post) => {
        if (post.summary) {
            return post.summary;
        }

        const plainText = stripHtml(post.post_content);
        return plainText.length > 150
            ? plainText.substring(0, 150) + '...'
            : plainText;
    };

    // Authentication check
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

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
                        <div className="flex items-center">
                            <Link href={`/dashboard`}>
                                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {user.name}</span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">সর্বশেষ সংবাদ</h1>
                    <p className="text-gray-600">আপডেট থাকুন সর্বশেষ খবরের সাথে</p>
                </div>

                {/* Category Filter */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="h-5 w-5 text-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-900">বিভাগ অনুযায়ী ফিল্টার</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {/* All categories button */}
                        <button
                            onClick={() => handleCategoryChange({ id: -1, name: 'সব' })}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${selectedCategory === 'সব'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            সব
                        </button>
                        {news_categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryChange(category)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${selectedCategory.id === category.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                        মোট {totalNews} টি সংবাদ
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <div className="text-red-800">
                            <strong>ত্রুটি:</strong> {error}
                        </div>
                        <button
                            onClick={() => fetchNews(currentPage, selectedCategory)}
                            className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                            পুনরায় চেষ্টা করুন
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {isLoadingNews && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">সংবাদ লোড হচ্ছে...</span>
                    </div>
                )}

                {/* No Results Message */}
                {!isLoadingNews && newsData.length === 0 && !error && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <Filter className="h-16 w-16 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">কোন সংবাদ পাওয়া যায়নি</h3>
                        <p className="text-gray-600">
                            {selectedCategory.name === 'সব'
                                ? 'কোন সংবাদ নেই।'
                                : `"${selectedCategory.name}" বিভাগে কোন সংবাদ নেই।`
                            }
                        </p>
                    </div>
                )}

                {/* News Grid */}
                {!isLoadingNews && newsData.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {newsData.map((news) => (
                            <div key={news.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                {/* Image */}
                                <div className="relative h-48 w-full">
                                    <img
                                        src={news.image}
                                        alt={news.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=250&fit=crop';
                                        }}
                                    />
                                    {/* Category Badge */}
                                    {news.category && (
                                        <div className="absolute top-3 left-3">
                                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                                                {news.category.name}
                                            </span>
                                        </div>
                                    )}
                                    {/* Action Buttons */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                                        {/* Edit Button */}
                                        <button
                                            onClick={() => handleEdit(news.id)}
                                            className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 p-2 rounded-full shadow-md transition-all duration-200 hover:shadow-lg"
                                            title="সংবাদ সম্পাদনা করুন"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        {/* Make Lead News Button */}
                                        <button
                                            onClick={async () => {
                                                setTmpLeadnews(news);
                                                setShowConfirmModal(true);
                                            }}
                                            className="bg-yellow-500 bg-opacity-90 hover:bg-opacity-100 text-white p-2 rounded-full shadow-md transition-all duration-200 hover:shadow-lg"
                                            title="এটি লিড নিউজ করুন"
                                        >
                                            <Star className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                                        {news.title}
                                    </h2>
                                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-3">
                                        {getSummary(news)}
                                    </p>

                                    {/* Date */}
                                    <div className="text-xs text-gray-500 mb-3">
                                        {news.created_at_ago}
                                    </div>

                                    {/* Read More Button */}
                                    <div className="mt-4">
                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200">
                                            বিস্তারিত পড়ুন →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!isLoadingNews && newsData.length > 0 && totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            পৃষ্ঠা {currentPage} এর {totalPages} (মোট {totalNews} টি সংবাদ)
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Previous Button */}
                            <button
                                onClick={goToPrevPage}
                                disabled={currentPage === 1}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${currentPage === 1
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                পূর্ববর্তী
                            </button>

                            {/* Page Numbers */}
                            <div className="flex space-x-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    // Show pages around current page
                                    let page;
                                    if (totalPages <= 5) {
                                        page = i + 1;
                                    } else {
                                        const start = Math.max(1, currentPage - 2);
                                        const end = Math.min(totalPages, start + 4);
                                        page = start + i;
                                        if (page > end) return null;
                                    }

                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${currentPage === page
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${currentPage === totalPages
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                পরবর্তী
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </button>
                        </div>
                    </div>
                )}
                {
                    showConfirmModal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <Check className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">নিশ্চিত করুন</h3>
                                    <p className="text-sm text-gray-600">এই সংবাদটি লিভ নিউজ করতে চান?</p>
                                </div>
                            </div>

                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700 font-medium">
                                    {tmp_lead_news.title}
                                </p>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                                >
                                    বাতিল
                                </button>
                                <button
                                    onClick={async () => {
                                        setShowConfirmModal(false);
                                        await handleMakeLeadNews(tmp_lead_news.id);

                                    }}
                                    className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                >
                                    কনফার্ম করুন
                                </button>
                            </div>
                        </div>
                    </div>
                }


                <LeadNewsSort
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    position={position}
                    width="w-80">
                    {
                        lead_news_id && <SortableNewsList lead_news_id={lead_news_id} />
                    }

                </LeadNewsSort>
            </main>
        </div>
    );
};

export default NewsListView;