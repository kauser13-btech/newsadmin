import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Image, Type, AlignLeft, AlignCenter, AlignRight, Upload, Video } from 'lucide-react';
import { BASE_URL } from '@/app/config/config';

const WysiwygEditor = ({ UpdatePostContent, post_content=null }) => {
  const [content, setContent] = useState(post_content || '');
  const [selectedText, setSelectedText] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [savedRange, setSavedRange] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize editor content when component mounts or post_content changes
  useEffect(() => {
    if (editorRef.current && post_content && !isInitialized) {
      const fixedContent = fixImageUrls(post_content);
      editorRef.current.innerHTML = fixedContent;
      setContent(fixedContent);
      setIsInitialized(true);
    }
  }, [post_content, isInitialized]);

  // Update parent component when content changes (but not during initialization)
  useEffect(() => {
    if (isInitialized && content !== post_content) {
      UpdatePostContent(content);
    }
  }, [content, UpdatePostContent, isInitialized, post_content]);

  // YouTube URL extraction and embed code generation
  const extractYouTubeVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const createYouTubeEmbed = (videoId, width = 560, height = 315) => {
    const iframe = document.createElement('div');
    iframe.className = 'youtube-embed-wrapper';
    iframe.style.cssText = `
      position: relative;
      width: 100%;
      max-width: ${width}px;
      margin: 20px auto;
      padding: 0;
      background: #f0f0f0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;
    
    iframe.innerHTML = `
      <div style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%;">
        <iframe 
          src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1" 
          frameborder="0" 
          allowfullscreen
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          title="YouTube video player"
        ></iframe>
      </div>
    `;
    
    return iframe;
  };

  const insertYouTubeVideo = () => {
    if (videoUrl.trim()) {
      const videoId = extractYouTubeVideoId(videoUrl);
      
      if (!videoId) {
        alert('Please enter a valid YouTube URL');
        return;
      }

      // Focus editor and restore selection
      editorRef.current?.focus();
      
      let range;
      const selection = window.getSelection();

      // Try to use saved range first, then current selection
      if (savedRange && editorRef.current.contains(savedRange.commonAncestorContainer)) {
        range = savedRange.cloneRange();
        selection.removeAllRanges();
        selection.addRange(range);
      } else if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      } else {
        // Create range at end of editor
        range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // Create YouTube embed
      const embedWrapper = createYouTubeEmbed(videoId);

      // Insert video at the range position
      try {
        // Clear any selected content first
        if (!range.collapsed) {
          range.deleteContents();
        }

        // Insert the video
        range.insertNode(embedWrapper);

        // Create a line break after video for better editing
        const br = document.createElement('br');
        range.setStartAfter(embedWrapper);
        range.insertNode(br);

        // Position cursor after the line break
        range.setStartAfter(br);
        range.collapse(true);

        // Update selection
        selection.removeAllRanges();
        selection.addRange(range);

      } catch (error) {
        // Fallback: append to editor
        editorRef.current.appendChild(embedWrapper);
        const br = document.createElement('br');
        editorRef.current.appendChild(br);
      }

      // Update content state
      setContent(editorRef.current.innerHTML);

      // Close modal and reset
      setShowVideoModal(false);
      setVideoUrl('');
      setSavedRange(null);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleFontFamily = (fontFamily) => {
    // Focus the editor first
    editorRef.current?.focus();

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      if (!range.collapsed) {
        // There's selected text
        const span = document.createElement('span');
        span.style.fontFamily = fontFamily;

        try {
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);

          // Clear selection and update content
          selection.removeAllRanges();
          setContent(editorRef.current.innerHTML);
        } catch (error) {
          // Fallback to execCommand
          execCommand('fontName', fontFamily);
        }
      } else {
        // No selection, apply to future typing
        execCommand('fontName', fontFamily);
      }
    }
  };

  const handleFontSize = (size) => {
    // Focus the editor first
    editorRef.current?.focus();

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      if (!range.collapsed) {
        // There's selected text
        const span = document.createElement('span');
        span.style.fontSize = size;

        try {
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);

          // Clear selection and update content
          selection.removeAllRanges();
          setContent(editorRef.current.innerHTML);
        } catch (error) {
          // Fallback to execCommand
          execCommand('fontSize', '3');
          // Then apply custom size via CSS
          const selectedElement = selection.anchorNode.parentElement;
          if (selectedElement) {
            selectedElement.style.fontSize = size;
          }
        }
      } else {
        // No selection, apply to future typing
        execCommand('fontSize', '3');
        // Set a data attribute to track desired size for future input
        editorRef.current.setAttribute('data-next-font-size', size);
      }
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    setSelectedText(selection.toString());

    // Save the current range for later use
    if (selection.rangeCount > 0) {
      setSavedRange(selection.getRangeAt(0).cloneRange());
    }
  };

  const uploadImageToBackend = async (file) => {
    try {
      const token = localStorage?.getItem('auth_token');
      // Backend upload configuration
      const UPLOAD_URL = `${BASE_URL}admin/images/upload-image`; // Replace with your actual endpoint
      const UPLOAD_HEADERS = {
        // Add your authentication headers here
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      };
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('generate_thumbnails', true);
      formData.append('thumbnail_sizes[]', 500);

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          setUploading(false);
          setUploadProgress(0);

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (parseError) {
              reject(new Error('Invalid JSON response from server'));
            }
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          setUploading(false);
          setUploadProgress(0);
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('timeout', () => {
          setUploading(false);
          setUploadProgress(0);
          reject(new Error('Upload timeout'));
        });

        xhr.open('POST', UPLOAD_URL);

        // Add headers
        Object.entries(UPLOAD_HEADERS).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        xhr.timeout = 30000; // 30 second timeout
        xhr.send(formData);
      });
    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      throw error;
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      // Focus editor and restore selection
      editorRef.current?.focus();
      if (savedRange) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }

      execCommand('createLink', linkUrl);
      setShowLinkModal(false);
      setLinkUrl('');
      setSavedRange(null);
    }
  };

  const handleImageUpload = async (file) => {
    if (file && file.type.startsWith('image/')) {
      try {
        // Upload to backend
        const response = await uploadImageToBackend(file);

        if (response && response.data && response.data.file_url) {
          insertImageIntoEditor(response.data);
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert(`Image upload failed: ${error.message}`);
      }
    }
  };

  const insertImageIntoEditor = (imageData) => {
    // Create image element with backend URL
    const img = document.createElement('img');
    img.src = imageData.file_url;
    img.alt = 'Uploaded image';

    // Set dimensions if provided by backend
    if (imageData.width && imageData.height) {
      img.setAttribute('data-width', imageData.width);
      img.setAttribute('data-height', imageData.height);
    }

    // Store additional data for future use
    if (imageData.thumb) {
      img.setAttribute('data-thumb', imageData.thumb);
    }

    img.style.width = '100%';
    img.style.maxWidth = '600px';
    img.style.height = 'auto';
    img.style.margin = '10px 0';
    img.style.display = 'block';
    img.style.borderRadius = '4px';

    // Focus editor and restore selection
    editorRef.current?.focus();

    let range;
    const selection = window.getSelection();

    // Try to use saved range first, then current selection
    if (savedRange && editorRef.current.contains(savedRange.commonAncestorContainer)) {
      range = savedRange.cloneRange();
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else {
      // Create range at end of editor
      range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Insert image at the range position
    try {
      // Clear any selected content first
      if (!range.collapsed) {
        range.deleteContents();
      }

      // Insert the image
      range.insertNode(img);

      // Create a line break after image for better editing
      const br = document.createElement('br');
      range.setStartAfter(img);
      range.insertNode(br);

      // Position cursor after the line break
      range.setStartAfter(br);
      range.collapse(true);

      // Update selection
      selection.removeAllRanges();
      selection.addRange(range);

    } catch (error) {
      // Fallback: append to editor
      editorRef.current.appendChild(img);
      const br = document.createElement('br');
      editorRef.current.appendChild(br);
    }

    // Update content state
    setContent(editorRef.current.innerHTML);

    // Close modal if open
    setShowImageModal(false);

    // Clear saved range
    setSavedRange(null);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      handleImageUpload(imageFile);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
    e.target.value = '';
  };

  const fixImageUrls = (htmlContent, domain = 'https://campustimes.press') => {
    if (!htmlContent) return '';
    // Regular expression to find img tags with src starting with "/"
    const imgRegex = /<img([^>]*)\ssrc="(\/[^"]*)"([^>]*)>/gi;

    // Replace relative URLs with absolute URLs
    const fixedContent = htmlContent.replace(imgRegex, (match, beforeSrc, src, afterSrc) => {
      return `<img${beforeSrc} src="${domain}${src}"${afterSrc}>`;
    });

    return fixedContent;
  };

  const handleContentChange = (e) => {
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
  };

  const toolbarButtons = [
    { icon: Bold, command: 'bold', title: 'Bold' },
    { icon: Italic, command: 'italic', title: 'Italic' },
    { icon: Underline, command: 'underline', title: 'Underline' },
    { divider: true },
    { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
    { divider: true },
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
    { divider: true },
    {
      icon: Link, action: () => {
        // Save current selection before opening modal
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          setSavedRange(selection.getRangeAt(0).cloneRange());
        }
        setShowLinkModal(true);
      }, title: 'Insert Link'
    },
    {
      icon: Image, action: () => {
        // Save current selection before opening modal
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          setSavedRange(selection.getRangeAt(0).cloneRange());
        }
        setShowImageModal(true);
      }, title: 'Insert Image'
    },
    {
      icon: Video, action: () => {
        // Save current selection before opening modal
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          setSavedRange(selection.getRangeAt(0).cloneRange());
        }
        setShowVideoModal(true);
      }, title: 'Insert YouTube Video'
    },
  ];

  const headingOptions = [
    { label: 'Normal', command: 'formatBlock', value: 'div' },
    { label: 'Heading 1', command: 'formatBlock', value: 'h1' },
    { label: 'Heading 2', command: 'formatBlock', value: 'h2' },
    { label: 'Heading 3', command: 'formatBlock', value: 'h3' },
  ];

  const fontSizeOptions = [
    { label: '8px', value: '8px' },
    { label: '10px', value: '10px' },
    { label: '12px', value: '12px' },
    { label: '14px', value: '14px' },
    { label: '16px', value: '16px' },
    { label: '18px', value: '18px' },
    { label: '20px', value: '20px' },
    { label: '24px', value: '24px' },
    { label: '28px', value: '28px' },
    { label: '32px', value: '32px' },
    { label: '36px', value: '36px' },
    { label: '48px', value: '48px' },
    { label: '60px', value: '60px' },
    { label: '72px', value: '72px' },
  ];

  const fontFamilyOptions = [
    { label: 'Default', value: 'inherit' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { label: 'Courier New', value: '"Courier New", Courier, monospace' },
    { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
    { label: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
    { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
    { label: 'Impact', value: 'Impact, Charcoal, sans-serif' },
    { label: 'Lucida Console', value: '"Lucida Console", Monaco, monospace' },
    { label: 'Palatino', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
    { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
    { label: 'Century Gothic', value: '"Century Gothic", CenturyGothic, sans-serif' },
    { label: 'Garamond', value: 'Garamond, serif' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      <div className="border border-gray-300 rounded-lg shadow-lg overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-300 p-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Heading Dropdown */}
            <select
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => {
                const option = headingOptions.find(opt => opt.value === e.target.value);
                if (option) execCommand(option.command, option.value);
              }}
            >
              {headingOptions.map((option, index) => (
                <option key={index} value={option.value}>{option.label}</option>
              ))}
            </select>

            {/* Font Family Dropdown */}
            <select
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
              onChange={(e) => {
                if (e.target.value) {
                  handleFontFamily(e.target.value);
                  e.target.value = ''; // Reset dropdown
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>Font</option>
              {fontFamilyOptions.map((option, index) => (
                <option key={index} value={option.value} style={{ fontFamily: option.value }}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Font Size Dropdown */}
            <select
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[70px]"
              onChange={(e) => {
                if (e.target.value) {
                  handleFontSize(e.target.value);
                  e.target.value = ''; // Reset dropdown
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>Size</option>
              {fontSizeOptions.map((option, index) => (
                <option key={index} value={option.value}>{option.label}</option>
              ))}
            </select>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Toolbar Buttons */}
            {toolbarButtons.map((button, index) => (
              button.divider ? (
                <div key={index} className="w-px h-6 bg-gray-300 mx-1"></div>
              ) : (
                <button
                  key={index}
                  onClick={() => button.action ? button.action() : execCommand(button.command)}
                  className="p-2 hover:bg-gray-200 rounded transition-colors duration-200"
                  title={button.title}
                >
                  <button.icon size={16} className="text-gray-700" />
                </button>
              )
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning={true}
            className={`min-h-96 p-4 focus:outline-none text-gray-800 leading-relaxed ${dragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
              }`}
            style={{
              fontSize: '16px',
              lineHeight: '1.6'
            }}
            onInput={handleContentChange}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          />

          {!content && (
            <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
              Start writing your content here...
            </div>
          )}

          {dragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 pointer-events-none">
              <div className="text-blue-600 text-lg font-medium">
                Drop your image here
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-sm text-gray-600">
          Words: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length} |
          Characters: {content.replace(/<[^>]*>/g, '').length}
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YouTube Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Insert YouTube Video</h3>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste YouTube URL here..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="text-sm text-gray-500 mb-4">
              Supported formats:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>https://www.youtube.com/watch?v=VIDEO_ID</li>
                <li>https://youtu.be/VIDEO_ID</li>
                <li>https://www.youtube.com/embed/VIDEO_ID</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoUrl('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={insertYouTubeVideo}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Insert Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Insert Image</h3>

            {uploading ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-gray-600">Uploading image...</p>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>

                <div className="text-center text-sm text-gray-500">
                  {uploadProgress}% complete
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                  <p className="text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setUploadProgress(0);
                }}
                disabled={uploading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for styling */}
      <style jsx>{`        
        [contenteditable] h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 1rem 0;
        }
        
        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0.875rem 0;
        }
        
        [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.75rem 0;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 2rem;
          margin: 1rem 0;
        }
        
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        
        [contenteditable] a {
          color: #3B82F6;
          text-decoration: underline;
        }
        
        [contenteditable] a:hover {
          color: #1D4ED8;
        }
        
        [contenteditable] img {
          width: 100%;
          max-width: 600px;
          height: auto;
          margin: 10px 0;
          display: block;
          cursor: pointer;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        [contenteditable] img:hover {
          opacity: 0.9;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        [contenteditable] .youtube-embed-wrapper {
          position: relative;
          width: 100%;
          max-width: 560px;
          margin: 20px auto;
          padding: 0;
          background: #f0f0f0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }

        [contenteditable] .youtube-embed-wrapper:hover {
          box-shadow: 0 6px 16px rgba(0,0,0,0.15);
          transform: translateY(-2px);
        }

        [contenteditable] .youtube-embed-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        /* Responsive adjustments for mobile */
        @media (max-width: 640px) {
          [contenteditable] .youtube-embed-wrapper {
            max-width: 100%;
            margin: 15px 0;
          }
        }
      `}</style>
    </div>
  );
};

export default WysiwygEditor;