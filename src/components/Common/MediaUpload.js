import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Videocam as VideoIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  VideoLibrary as VideoLibraryIcon
} from '@mui/icons-material';
import { uploadToImgBB, deleteFromImgBB } from '../../services/imgbbService';

const MediaUpload = ({ workOrderId, existingMedia = [], onMediaUpdate }) => {
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [media, setMedia] = useState(existingMedia);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Handle file selection
  const handleFileSelect = async (event, type = 'gallery') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(file => 
        uploadToImgBB(file, workOrderId)
      );

      const uploadedFiles = await Promise.all(uploadPromises);
      const newMedia = [...media, ...uploadedFiles];
      
      setMedia(newMedia);
      onMediaUpdate?.(newMedia);
      
      console.log('Media uploaded successfully:', uploadedFiles);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      // Reset input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Handle camera capture
  const handleCameraCapture = (type) => {
    if (type === 'photo') {
      cameraInputRef.current?.click();
    } else {
      videoInputRef.current?.click();
    }
  };

  // Handle gallery selection
  const handleGallerySelect = () => {
    fileInputRef.current?.click();
  };

  // Delete media
  const handleDeleteMedia = async (mediaItem) => {
    try {
      setError(null);
      console.log('Deleting media:', mediaItem.id);
      
      await deleteFromImgBB(mediaItem.id);
      
      const newMedia = media.filter(item => item.id !== mediaItem.id);
      setMedia(newMedia);
      onMediaUpdate?.(newMedia);
      
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete media. Please try again.');
    }
  };

  // Get media preview
  const getMediaPreview = (mediaItem) => {
    if (mediaItem.type === 'video') {
      return (
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 1,
            bgcolor: 'grey.200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <VideoIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              bgcolor: 'rgba(0,0,0,0.7)',
              borderRadius: '50%',
              p: 0.5
            }}
          >
            <DeleteIcon 
              sx={{ fontSize: 16, color: 'white', cursor: 'pointer' }}
              onClick={() => handleDeleteMedia(mediaItem)}
            />
          </Box>
        </Box>
      );
    } else {
      return (
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 1,
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box
            component="img"
            src={mediaItem.thumb || mediaItem.url}
            alt="Uploaded media"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              bgcolor: 'rgba(0,0,0,0.7)',
              borderRadius: '50%',
              p: 0.5
            }}
          >
            <DeleteIcon 
              sx={{ fontSize: 16, color: 'white', cursor: 'pointer' }}
              onClick={() => handleDeleteMedia(mediaItem)}
            />
          </Box>
        </Box>
      );
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Upload Buttons - Icon Style */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Tooltip title={isMobile ? 'Take Photo' : 'Add Photo'}>
          <IconButton
            color="primary"
            onClick={() => handleCameraCapture('photo')}
            disabled={uploading}
            size={isMobile ? 'small' : 'medium'}
            sx={{ 
              border: '1px solid',
              borderColor: 'primary.main',
              bgcolor: 'background.paper'
            }}
          >
            <PhotoCameraIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={isMobile ? 'Record Video' : 'Add Video'}>
          <IconButton
            color="primary"
            onClick={() => handleCameraCapture('video')}
            disabled={uploading}
            size={isMobile ? 'small' : 'medium'}
            sx={{ 
              border: '1px solid',
              borderColor: 'primary.main',
              bgcolor: 'background.paper'
            }}
          >
            <VideoIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="From Gallery">
          <IconButton
            color="primary"
            onClick={handleGallerySelect}
            disabled={uploading}
            size={isMobile ? 'small' : 'medium'}
            sx={{ 
              border: '1px solid',
              borderColor: 'primary.main',
              bgcolor: 'background.paper'
            }}
          >
            <VideoLibraryIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e, 'gallery')}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture={isMobile ? "environment" : undefined}
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e, 'camera')}
      />
      
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture={isMobile ? "environment" : undefined}
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e, 'camera')}
      />

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Uploading media...
          </Typography>
        </Box>
      )}

      {/* Media Preview */}
      {media.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {media.length} file{media.length !== 1 ? 's' : ''} attached
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {media.map((mediaItem, index) => (
              <Box key={mediaItem.id || index}>
                {getMediaPreview(mediaItem)}
              </Box>
            ))}
          </Box>
        </Box>
      )}

    </Box>
  );
};

export default MediaUpload;
