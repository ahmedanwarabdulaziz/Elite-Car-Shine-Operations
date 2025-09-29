import React, { useState, useRef, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Switch,
  Chip,
  Box,
  Typography,
  useTheme,
  InputAdornment,
  Tooltip,
  IconButton,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AttachMoney as MoneyIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';

const PricingMatrix = ({
  items,
  categories,
  vehicleCategories,
  onPriceChange,
  onCategoryToggle,
  loading
}) => {
  const theme = useTheme();
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  const handleCellClick = (itemId, categoryId, vehicleTypeId, currentPrice) => {
    setEditingCell(`${itemId}_${categoryId}_${vehicleTypeId}`);
    setEditValue(currentPrice?.toString() || '');
  };

  // Auto-select text when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      // Access the actual input element within the TextField
      const inputElement = inputRef.current.querySelector('input');
      if (inputElement) {
        inputElement.select();
      }
    }
  }, [editingCell]);

  const handleCellSave = async (itemId, categoryId, vehicleTypeId, itemType) => {
    if (editValue !== '') {
      await onPriceChange(itemId, categoryId, vehicleTypeId, editValue, itemType);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyPress = (event, itemId, categoryId, vehicleTypeId, itemType) => {
    if (event.key === 'Enter') {
      handleCellSave(itemId, categoryId, vehicleTypeId, itemType);
    } else if (event.key === 'Escape') {
      handleCellCancel();
    }
  };

  const handleCategoryBulkToggle = async (categoryId) => {
    // Toggle all items for this category
    const promises = items.map(item => {
      const isActive = isItemActiveForCategory(item, categoryId);
      return onCategoryToggle(item.id, categoryId, !isActive, item.itemType);
    });
    
    await Promise.all(promises);
  };

  const getItemPrice = (item, categoryId, vehicleTypeId) => {
    return item.prices?.[`${categoryId}_${vehicleTypeId}`] || 0;
  };

  const isItemActiveForCategory = (item, categoryId) => {
    return item.categoryStatus?.[categoryId] !== false;
  };

  const getPriceColor = (price) => {
    const numPrice = parseFloat(price) || 0;
    if (numPrice === 0 || price === '') return theme.palette.text.disabled;
    return theme.palette.text.primary;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TableContainer sx={{ maxHeight: '70vh', overflow: 'auto' }}>
      <Table stickyHeader size="small">
        <TableHead>
          {/* First row - Category names and bulk toggles */}
          <TableRow>
            <TableCell 
              sx={{ 
                position: 'sticky', 
                left: 0, 
                zIndex: 3, 
                backgroundColor: theme.palette.background.paper,
                borderRight: `2px solid ${theme.palette.divider}`,
                minWidth: 200,
                fontWeight: 600
              }}
            >
              Service
            </TableCell>
            
            {categories.map((category, index) => {
              const categoryColors = [
                theme.palette.primary.light,
                theme.palette.secondary.light,
                theme.palette.success.light,
                theme.palette.warning.light,
                theme.palette.info.light,
                theme.palette.error.light,
              ];
              const categoryBorders = [
                theme.palette.primary.main,
                theme.palette.secondary.main,
                theme.palette.success.main,
                theme.palette.warning.main,
                theme.palette.info.main,
                theme.palette.error.main,
              ];
              const backgroundColor = categoryColors[index % categoryColors.length];
              const borderColor = categoryBorders[index % categoryBorders.length];
              
              return (
                <TableCell 
                  key={category.id}
                  colSpan={vehicleCategories.length}
                  sx={{ 
                    textAlign: 'center', 
                    backgroundColor: backgroundColor,
                    color: theme.palette.primary.contrastText,
                    fontWeight: 600,
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {category.name}
                    </Typography>
                    <Tooltip title="Toggle all items for this category">
                      <IconButton
                        size="small"
                        onClick={() => handleCategoryBulkToggle(category.id)}
                        sx={{ 
                          color: 'white',
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                        }}
                      >
                        <ToggleOnIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              );
            })}
          </TableRow>
          
          {/* Second row - Vehicle type headers */}
          <TableRow>
            <TableCell 
              sx={{ 
                position: 'sticky', 
                left: 0, 
                zIndex: 3, 
                backgroundColor: theme.palette.background.paper,
                borderRight: `2px solid ${theme.palette.divider}`,
                minWidth: 200,
                fontWeight: 600
              }}
            >
              {/* Empty for service column */}
            </TableCell>
            
            {categories.map((category, categoryIndex) => {
              const categoryColors = [
                theme.palette.primary.main,
                theme.palette.secondary.main,
                theme.palette.success.main,
                theme.palette.warning.main,
                theme.palette.info.main,
                theme.palette.error.main,
              ];
              const categoryBorders = [
                theme.palette.primary.dark,
                theme.palette.secondary.dark,
                theme.palette.success.dark,
                theme.palette.warning.dark,
                theme.palette.info.dark,
                theme.palette.error.dark,
              ];
              const backgroundColor = categoryColors[categoryIndex % categoryColors.length];
              const borderColor = categoryBorders[categoryIndex % categoryBorders.length];
              
              return (
                <React.Fragment key={category.id}>
                  {vehicleCategories.map((vehicleType) => (
                    <TableCell
                      key={`${category.id}_${vehicleType.id}`}
                      sx={{
                        textAlign: 'center',
                        backgroundColor: backgroundColor,
                        color: theme.palette.primary.contrastText,
                        fontWeight: 600,
                        border: `1px solid ${borderColor}`,
                        minWidth: 80,
                        maxWidth: 100,
                      }}
                    >
                      <Chip
                        label={vehicleType.name}
                        size="small"
                        sx={{ 
                          fontSize: '0.6rem', 
                          height: 18,
                          backgroundColor: borderColor,
                          color: theme.palette.primary.contrastText,
                        }}
                      />
                    </TableCell>
                  ))}
                </React.Fragment>
              );
            })}
          </TableRow>
        </TableHead>
        
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              {/* Item name and controls */}
              <TableCell
                sx={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  backgroundColor: theme.palette.background.paper,
                  borderRight: `2px solid ${theme.palette.divider}`,
                  minWidth: 200,
                }}
              >
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Chip
                      label={item.itemType === 'service' ? 'Service' : 'Bundle'}
                      size="small"
                      color={item.itemType === 'service' ? 'primary' : 'secondary'}
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {item.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {item.duration && `${item.duration} • `}{item.description?.substring(0, 50)}...
                  </Typography>
                </Box>
              </TableCell>

              {/* Price cells for each category */}
              {categories.map((category, categoryIndex) => {
                const categoryColors = [
                  theme.palette.primary.light,
                  theme.palette.secondary.light,
                  theme.palette.success.light,
                  theme.palette.warning.light,
                  theme.palette.info.light,
                  theme.palette.error.light,
                ];
                const categoryBorders = [
                  theme.palette.primary.main,
                  theme.palette.secondary.main,
                  theme.palette.success.main,
                  theme.palette.warning.main,
                  theme.palette.info.main,
                  theme.palette.error.main,
                ];
                const categoryBackground = categoryColors[categoryIndex % categoryColors.length];
                const categoryBorder = categoryBorders[categoryIndex % categoryBorders.length];
                
                return (
                  <React.Fragment key={category.id}>
                    {vehicleCategories.map((vehicleType) => {
                      const price = getItemPrice(item, category.id, vehicleType.id);
                      const isActive = isItemActiveForCategory(item, category.id);
                      const cellId = `${item.id}_${category.id}_${vehicleType.id}`;
                      const isEditing = editingCell === cellId;

                      return (
                        <TableCell 
                          key={`${category.id}_${vehicleType.id}`}
                          sx={{ 
                            textAlign: 'center',
                            minWidth: 80,
                            maxWidth: 100,
                            backgroundColor: isActive ? categoryBackground : theme.palette.action.disabled,
                            opacity: isActive ? 1 : 0.5,
                            padding: 0.5,
                            border: `1px solid ${categoryBorder}`,
                          }}
                        >
                        {isEditing ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            {/* Save and Cancel buttons at the top */}
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Tooltip title="Save">
                                <IconButton
                                  size="small"
                                  onClick={() => handleCellSave(item.id, category.id, vehicleType.id, item.itemType)}
                                  color="primary"
                                  sx={{ 
                                    width: 20, 
                                    height: 20,
                                    backgroundColor: theme.palette.success.light,
                                    '&:hover': {
                                      backgroundColor: theme.palette.success.main,
                                      color: 'white'
                                    }
                                  }}
                                >
                                  <SaveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancel">
                                <IconButton
                                  size="small"
                                  onClick={handleCellCancel}
                                  color="error"
                                  sx={{ 
                                    width: 20, 
                                    height: 20,
                                    backgroundColor: theme.palette.error.light,
                                    '&:hover': {
                                      backgroundColor: theme.palette.error.main,
                                      color: 'white'
                                    }
                                  }}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            
                            {/* Input field below */}
                            <TextField
                              ref={inputRef}
                              size="small"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyPress={(e) => handleKeyPress(e, item.id, category.id, vehicleType.id, item.itemType)}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <MoneyIcon fontSize="small" />
                                  </InputAdornment>
                                ),
                              }}
                              sx={{ 
                                width: 80,
                                '& .MuiInputBase-input': {
                                  fontSize: '0.8rem',
                                  padding: '4px 6px',
                                }
                              }}
                              autoFocus
                            />
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            {/* Toggle Control - Only show for first vehicle type in each category */}
                            {vehicleCategories[0].id === vehicleType.id && (
                              <Tooltip title={isActive ? "Disable for this category" : "Enable for this category"}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCategoryToggle(item.id, category.id, !isActive, item.itemType);
                                  }}
                                  sx={{
                                    color: isActive ? theme.palette.success.main : theme.palette.error.main,
                                    backgroundColor: isActive ? theme.palette.success.light : theme.palette.error.light,
                                    '&:hover': {
                                      backgroundColor: isActive ? theme.palette.success.main : theme.palette.error.main,
                                      color: 'white'
                                    },
                                    width: 24,
                                    height: 24,
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  {isActive ? <ToggleOnIcon fontSize="small" /> : <ToggleOffIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            )}

                            {/* Price Display */}
                            <Tooltip
                              title={isActive ? "Click to edit price" : `${item.itemType === 'service' ? 'Service' : 'Bundle'} disabled for this category`}
                              placement="top"
                            >
                              <Box
                                sx={{
                                  cursor: isActive ? 'pointer' : 'not-allowed',
                                  padding: 1,
                                  borderRadius: 1,
                                  backgroundColor: isActive ? 'transparent' : theme.palette.action.hover,
                                  '&:hover': {
                                    backgroundColor: isActive ? theme.palette.action.hover : 'transparent',
                                  },
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 0.5,
                                  minWidth: 60,
                                }}
                                onClick={() => isActive && handleCellClick(item.id, category.id, vehicleType.id, price)}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: getPriceColor(price),
                                    fontWeight: price > 0 ? 600 : 400,
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  {price > 0 ? `$${parseFloat(price).toFixed(2)}` : '—'}
                                </Typography>
                                {isActive && (
                                  <EditIcon fontSize="small" sx={{ opacity: 0.5, fontSize: '0.7rem' }} />
                                )}
                              </Box>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    );
                  })}
                </React.Fragment>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PricingMatrix;
