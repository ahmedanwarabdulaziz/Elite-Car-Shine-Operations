// ImgBB service for image and video uploads
const IMGBB_API_KEY = '7e173a6b35c5f68204227300560c2076';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

// File size limits - Increased for better quality
const MAX_PHOTO_SIZE = 20 * 1024 * 1024; // 20MB (increased from 5MB)
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB (increased from 50MB)

// Compress image function
const compressImage = (file, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions (max 1920x1080)
      let { width, height } = img;
      const maxWidth = 1920;
      const maxHeight = 1080;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Upload function
export const uploadToImgBB = async (file, workOrderId) => {
  try {
    console.log('Starting upload to ImgBB:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      workOrderId
    });

    // Check file size
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_PHOTO_SIZE;
    
    if (file.size > maxSize) {
      throw new Error(`File too large. Max size: ${maxSize / (1024 * 1024)}MB`);
    }

    let fileToUpload = file;

    // Compress images (only if they're very large)
    if (!isVideo && file.type.startsWith('image/') && file.size > 10 * 1024 * 1024) {
      console.log('Compressing large image...');
      fileToUpload = await compressImage(file, 0.9); // Higher quality for larger files
      console.log('Image compressed:', fileToUpload.size);
    }

    // Create form data
    const formData = new FormData();
    formData.append('image', fileToUpload);
    formData.append('key', IMGBB_API_KEY);
    
    // Add optional parameters
    formData.append('name', `${workOrderId}_${Date.now()}_${file.name}`);
    formData.append('expiration', '0'); // No expiration

    console.log('Sending upload request to ImgBB...');

    // Upload to ImgBB
    const response = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      body: formData
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Upload successful:', result);

    if (!result.success) {
      throw new Error(`ImgBB upload failed: ${result.error?.message || 'Unknown error'}`);
    }

    // Return standardized result
    return {
      id: result.data.id,
      url: result.data.url,
      thumb: result.data.thumb?.url || result.data.url,
      type: isVideo ? 'video' : 'image',
      size: result.data.size || fileToUpload.size,
      uploadedAt: new Date().toISOString(),
      workOrderId,
      fileName: file.name
    };

  } catch (error) {
    console.error('ImgBB upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Delete function (ImgBB doesn't support deletion via API, but we can track it locally)
export const deleteFromImgBB = async (imageId) => {
  console.log('ImgBB does not support deletion via API. Image ID:', imageId);
  // For now, just return success - in a real app you'd track deleted images locally
  return true;
};

// Get file info
export const getFileInfo = (file) => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  };
};
