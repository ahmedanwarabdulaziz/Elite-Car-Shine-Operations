import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  IconButton,
  Paper,
  useTheme,
  Divider,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Close,
  Upload,
  Delete,
} from '@mui/icons-material';

// Professional color palette for tags
const colorOptions = [
  { name: 'Primary Blue', value: '#1976d2', label: 'Blue' },
  { name: 'Success Green', value: '#2e7d32', label: 'Green' },
  { name: 'Warning Orange', value: '#ed6c02', label: 'Orange' },
  { name: 'Error Red', value: '#d32f2f', label: 'Red' },
  { name: 'Purple', value: '#7b1fa2', label: 'Purple' },
  { name: 'Teal', value: '#00796b', label: 'Teal' },
  { name: 'Indigo', value: '#303f9f', label: 'Indigo' },
  { name: 'Pink', value: '#c2185b', label: 'Pink' },
  { name: 'Brown', value: '#5d4037', label: 'Brown' },
  { name: 'Grey', value: '#616161', label: 'Grey' },
  { name: 'Deep Orange', value: '#e64a19', label: 'Deep Orange' },
  { name: 'Light Blue', value: '#0288d1', label: 'Light Blue' },
  { name: 'Lime', value: '#afb42b', label: 'Lime' },
  { name: 'Amber', value: '#ff8f00', label: 'Amber' },
  { name: 'Cyan', value: '#0097a7', label: 'Cyan' },
  { name: 'Deep Purple', value: '#512da8', label: 'Deep Purple' },
];

const IconColorPicker = ({ 
  open, 
  onClose, 
  onSelect, 
  currentIcon = null, 
  currentColor = '#1976d2',
  currentIconName = '',
  type = 'category' // 'category' or 'vehicle'
}) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [selectedIcon, setSelectedIcon] = useState(currentIcon);
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [iconName, setIconName] = useState(currentIconName || '');
  const [customIconUrl, setCustomIconUrl] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, SVG, etc.)');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedIcon(e.target.result);
        setIconName(file.name.replace(/\.[^/.]+$/, '')); // Remove file extension
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomIconUrl = () => {
    if (customIconUrl.trim()) {
      setSelectedIcon(customIconUrl);
      setIconName('Custom Icon');
    }
  };

  const handleRemoveIcon = () => {
    setSelectedIcon(null);
    setIconName('');
    setCustomIconUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirm = () => {
    onSelect({
      icon: selectedIcon,
      color: selectedColor,
      iconName: iconName,
    });
    onClose();
  };

  const handleCancel = () => {
    setSelectedIcon(currentIcon);
    setSelectedColor(currentColor);
    setIconName(currentIconName || '');
    setCustomIconUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Upload Icon & Select Color Tag
          </Typography>
          <IconButton onClick={handleCancel} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Icon Upload Section */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Upload Custom Icon
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {/* File Upload */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  border: '2px dashed',
                  borderColor: theme.palette.primary.main,
                  borderRadius: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    backgroundColor: theme.palette.primary.light + '10',
                  },
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <Upload sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  Upload Image
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Click to upload an image file (PNG, JPG, SVG)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Max size: 2MB
                </Typography>
              </Paper>
            </Grid>

            {/* URL Input */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  border: '1px solid',
                  borderColor: theme.palette.grey[300],
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Or Use Image URL
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter image URL"
                  value={customIconUrl}
                  onChange={(e) => setCustomIconUrl(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleCustomIconUrl}
                          disabled={!customIconUrl.trim()}
                          sx={{ textTransform: 'none' }}
                        >
                          Load
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Enter a direct link to an image
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Icon Preview */}
          {selectedIcon && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Icon Preview
              </Typography>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid',
                    borderColor: theme.palette.grey[300],
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={selectedIcon}
                    alt="Selected icon"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    {iconName || 'Custom Icon'}
                  </Typography>
                  <TextField
                    fullWidth
                    label="Icon Name"
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    This name will be used to identify the icon
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleRemoveIcon}
                  sx={{ color: 'error.main' }}
                >
                  <Delete />
                </IconButton>
              </Paper>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Color Tag Selection */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Select Color Tag
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose a color tag to categorize and identify this item
          </Typography>
          
          <Grid container spacing={1}>
            {colorOptions.map((colorOption, index) => (
              <Grid item key={index}>
                <Paper
                  elevation={selectedColor === colorOption.value ? 4 : 1}
                  sx={{
                    p: 1,
                    cursor: 'pointer',
                    border: selectedColor === colorOption.value ? 2 : 1,
                    borderColor: selectedColor === colorOption.value ? colorOption.value : 'transparent',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      elevation: 2,
                      transform: 'scale(1.05)',
                    },
                  }}
                  onClick={() => setSelectedColor(colorOption.value)}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.5,
                      minWidth: 60,
                      minHeight: 60,
                      justifyContent: 'center',
                    }}
                  >
                    <Chip
                      label={colorOption.label}
                      sx={{
                        backgroundColor: colorOption.value,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center' }}>
                      {colorOption.name}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Selected Color Preview */}
          {selectedColor && (
            <Box sx={{ mt: 3, p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Selected Color Tag:
              </Typography>
              <Chip
                label={colorOptions.find(c => c.value === selectedColor)?.name || 'Custom Color'}
                sx={{
                  backgroundColor: selectedColor,
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleCancel} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained"
          disabled={!selectedIcon}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Confirm Selection
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IconColorPicker; 