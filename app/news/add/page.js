"use client";
import { useCallback, useState } from 'react';
import { Save, Eye, X, Plus } from 'lucide-react';
import WysiwygEditor from '@/app/components/Editor/WysiwygEditor';
import { useAuth } from '@/app/contexts/AuthContext';
import { available_colors } from '@/app/config/config';
import { FeatureImageUploader } from '@/app/components/Editor/FeatureUploader';
import { Notification } from '@/app/components/Notification/Notification';
import Link from 'next/link';

export default function NewsScreen() {
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    postContent: '    ',
    featuredImage: null,
    categories: [],
    tags: [] // Added tags array
  });
  
  // Tag-related state
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState([
    'Breaking News', 'Politics', 'Technology', 'Sports', 'Entertainment',
    'Business', 'Health', 'Science', 'Travel', 'Education'
  ]); // You can fetch these from your backend

  const { news_categories, savePost } = useAuth();
  const all_cat = news_categories.map((category, index) => {
    return {
      ...category, color: available_colors[index % 10]
    };
  });

  const UpdatePostContent = useCallback((value) => {
    setFormData({ ...formData, postContent: value });
  }, [formData]);

  const UpdateFeatureImage = useCallback((value) => {
    setFormData({ ...formData, featuredImage: value });
  }, [formData]);

  const [imagePreview, setImagePreview] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  // Tag handling functions
  const handleTagAdd = (tagName) => {
    if (tagName.trim() && !formData.tags.includes(tagName.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagName.trim()]
      }));
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleTagAdd(tagInput);
        setTagInput('');
      }
    }
  };

  const handleTagInputSubmit = () => {
    if (tagInput.trim()) {
      handleTagAdd(tagInput);
      setTagInput('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    if (type === 'success') {
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.title.trim()) {
      errors.push('Title is required');
    }
    if (!formData.excerpt.trim()) {
      errors.push('Excerpt is required');
    }
    console.log('formData.postContent', formData.postContent);
    if (!formData.postContent.trim()) {
      errors.push('Content is required');
    }
    if (formData.categories.length === 0) {
      errors.push('Please select at least 1 category');
    }
    if (formData.categories.length > 5) {
      errors.push('Please select maximum 5 categories');
    }
    if (formData.featuredImage === null || formData.featuredImage === undefined) {
      errors.push('Please Add Feature Image');
    }
    if (formData.tags.length > 10) {
      errors.push('Please select maximum 10 tags');
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();

    if (errors.length > 0) {
      showNotification(errors.join(', '), 'error');
      return;
    }

    try {
      await savePost({
        title: formData.title,
        excerpt: formData.excerpt,
        post_content: formData.postContent,
        featured_image: formData.featuredImage,
        categories: formData.categories,
        tags: formData.tags, // Include tags in the save data
      });
      showNotification('News article saved successfully!', 'success');
    } catch (e) {
      console.log('error', e);
      showNotification('Failed to save article. Please try again.', 'error');
    }
  };

  const renderPreview = () => {
    const processContent = (content) => {
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" />')
        .replace(/\n/g, '<br />');
    };

    return (
      <div className="max-w-4xl mx-auto p-6 bg-white">
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Featured"
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}
        
        {/* Categories */}
        {formData.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.categories.map(categoryId => {
              const category = all_cat.find(cat => cat.id === categoryId);
              return category ? (
                <span
                  key={categoryId}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${category.color}`}
                >
                  {category.name}
                </span>
              ) : null;
            })}
          </div>
        )}

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {formData.title || 'Article Title'}
        </h1>
        
        <p className="text-xl text-gray-600 mb-6 leading-relaxed">
          {formData.excerpt || 'Article excerpt will appear here...'}
        </p>

        {/* Tags in Preview */}
        {formData.tags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div
          className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: processContent(formData.postContent || 'Article content will appear here...')
          }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href={`/dashboard`}>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </Link>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Eye className="w-4 h-4 mr-2" />
                {isPreview ? 'Edit' : 'Preview'}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Article
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        {isPreview ? (
          renderPreview()
        ) : (
          <div className="space-y-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Article Details</h2>
              </div>
              <div className="px-6 py-6 space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    placeholder="Enter article title..."
                    required
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt *
                  </label>
                  <textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of the article..."
                    required
                  />
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Categories *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {all_cat.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryToggle(category.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${formData.categories.includes(category.id)
                          ? `${category.color} border-current shadow-md transform scale-105`
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Select one or more categories for your article
                  </p>
                  {formData.categories.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Selected categories:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.categories.map(categoryId => {
                          const category = all_cat.find(cat => cat.id === categoryId);
                          return category ? (
                            <span
                              key={categoryId}
                              className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}
                            >
                              {category.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tags
                  </label>
                  
                  {/* Tag Input */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagInputKeyPress}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Type a tag and press Enter or comma..."
                    />
                    <button
                      type="button"
                      onClick={handleTagInputSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  Popular Tags
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Popular tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.filter(tag => !formData.tags.includes(tag)).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagAdd(tag)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors border border-gray-300"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Tags */}
                  {formData.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Selected tags ({formData.tags.length}/10):</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200"
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => handleTagRemove(tag)}
                              className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="mt-2 text-xs text-gray-500">
                    Tags help categorize and make your content more discoverable. Press Enter or comma to add multiple tags.
                  </p>
                </div>

                {/* Featured Image */}
                <FeatureImageUploader UpdateFeatureImage={UpdateFeatureImage} />
              </div>
            </div>

            {/* WYSIWYG Editor */}
            <div className="bg-white shadow rounded-lg">
              <WysiwygEditor UpdatePostContent={UpdatePostContent} post_content={formData.postContent} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}