import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
  Button,
  useTheme,
  Tooltip,
  IconButton,
  Collapse,
  Paper,
  Divider,
  Badge,
  LinearProgress,
  Alert,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Tune as TuneIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  DragIndicator as DragIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

const CategoryControls = ({
  items,
  categories,
  onCategoryToggle,
  loading,
  title = "Category Controls"
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterActive, setFilterActive] = useState(false);
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);

  const handleItemSelect = (item) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };


  const handleCategoryToggle = async (itemId, categoryId, isActive) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    await onCategoryToggle(itemId, categoryId, isActive, item.itemType);
  };

  const handleBulkToggle = async (itemId, isActive) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const promises = categories.map(category => 
      onCategoryToggle(itemId, category.id, isActive, item.itemType)
    );
    
    await Promise.all(promises);
  };

  const getItemCategoryStatus = (item) => {
    const status = {};
    categories.forEach(category => {
      status[category.id] = item.categoryStatus?.[category.id] !== false;
    });
    return status;
  };

  const getItemStats = (item) => {
    const status = getItemCategoryStatus(item);
    const activeCount = Object.values(status).filter(Boolean).length;
    const totalCount = categories.length;
    
    return {
      active: activeCount,
      total: totalCount,
      percentage: totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0,
      isComplete: activeCount === totalCount,
      isIncomplete: activeCount < totalCount
    };
  };

  const getFilteredItems = () => {
    let filtered = items;
    
    if (showOnlyIncomplete) {
      filtered = items.filter(item => {
        const stats = getItemStats(item);
        return stats.isIncomplete;
      });
    }
    
    return filtered;
  };

  const getOverallStats = () => {
    const totalItems = items.length;
    const completeItems = items.filter(item => getItemStats(item).isComplete).length;
    const incompleteItems = totalItems - completeItems;
    const overallPercentage = totalItems > 0 ? Math.round((completeItems / totalItems) * 100) : 0;
    
    return {
      total: totalItems,
      complete: completeItems,
      incomplete: incompleteItems,
      percentage: overallPercentage
    };
  };

  const overallStats = getOverallStats();
  const filteredItems = getFilteredItems();

  return (
    <Card sx={{ 
      background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, ${theme.palette.secondary.light}15 100%)`,
      border: `1px solid ${theme.palette.primary.light}30`,
      borderRadius: 3,
      overflow: 'hidden'
    }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header Section */}
        <Box sx={{ 
          p: 3, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white'
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <Box sx={{ 
                p: 1, 
                borderRadius: 2, 
                backgroundColor: 'rgba(255,255,255,0.2)',
                mr: 2
              }}>
                <TuneIcon sx={{ color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Manage category availability for {items.length} items
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => setExpanded(!expanded)}
              sx={{ 
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
              }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          {/* Overall Stats */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                  {overallStats.percentage}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Complete
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                  {overallStats.complete}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Complete Items
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                  {overallStats.incomplete}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Incomplete Items
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                  {overallStats.total}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Total Items
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Progress Bar */}
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={overallStats.percentage} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'white',
                  borderRadius: 4
                }
              }} 
            />
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ p: 3 }}>
            {/* Filter Controls */}
            <Paper sx={{ p: 2, mb: 3, backgroundColor: theme.palette.grey[50] }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <FilterIcon sx={{ mr: 1, fontSize: 20 }} />
                  Filter & Search
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant={showOnlyIncomplete ? "contained" : "outlined"}
                    startIcon={<VisibilityOffIcon />}
                    onClick={() => setShowOnlyIncomplete(!showOnlyIncomplete)}
                    sx={{ textTransform: 'none' }}
                  >
                    Incomplete Only
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                      setShowOnlyIncomplete(false);
                      setSelectedItem(null);
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Reset
                  </Button>
                </Stack>
              </Box>
              
              {showOnlyIncomplete && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Showing {filteredItems.length} items that need category configuration
                </Alert>
              )}
            </Paper>

            {/* Item Selection */}
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <SettingsIcon sx={{ mr: 1, fontSize: 20 }} />
              Select Item to Manage Categories ({filteredItems.length} items)
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {filteredItems.map((item) => {
                const stats = getItemStats(item);
                const isSelected = selectedItem?.id === item.id;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: isSelected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                        backgroundColor: isSelected ? theme.palette.primary.light : 'white',
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: isSelected ? theme.palette.primary.light : theme.palette.action.hover,
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        },
                        boxShadow: isSelected ? theme.shadows[4] : theme.shadows[1],
                      }}
                      onClick={() => handleItemSelect(item)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={item.itemType === 'service' ? 'Service' : 'Bundle'}
                              size="small"
                              color={item.itemType === 'service' ? 'primary' : 'secondary'}
                              sx={{ fontSize: '0.7rem', height: 20, fontWeight: 600 }}
                            />
                            {isSelected && (
                              <Badge badgeContent={<SettingsIcon sx={{ fontSize: 12 }} />} color="primary">
                                <Box />
                              </Badge>
                            )}
                          </Box>
                          <Chip
                            label={stats.isComplete ? 'Complete' : `${stats.percentage}%`}
                            size="small"
                            color={stats.isComplete ? 'success' : stats.percentage > 50 ? 'warning' : 'error'}
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                        
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {item.name}
                        </Typography>
                        
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="caption" color="textSecondary">
                            {stats.active}/{stats.total} categories
                          </Typography>
                          <Box sx={{ width: '60%' }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={stats.percentage} 
                              sx={{ 
                                height: 4, 
                                borderRadius: 2,
                                backgroundColor: theme.palette.grey[200],
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: stats.isComplete ? theme.palette.success.main : 
                                                stats.percentage > 50 ? theme.palette.warning.main : 
                                                theme.palette.error.main,
                                  borderRadius: 2
                                }
                              }} 
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Category Controls for Selected Item */}
            {selectedItem && (
              <Paper sx={{ p: 3, backgroundColor: theme.palette.grey[50], borderRadius: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 1, 
                      backgroundColor: theme.palette.primary.main,
                      mr: 2
                    }}>
                      <SettingsIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Category Settings for: {selectedItem.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Configure which categories this {selectedItem.itemType} is available in
                      </Typography>
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleBulkToggle(selectedItem.id, true)}
                      disabled={loading}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Enable All
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => handleBulkToggle(selectedItem.id, false)}
                      disabled={loading}
                      color="error"
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Disable All
                    </Button>
                  </Stack>
                </Box>

                <Grid container spacing={2}>
                  {categories.map((category) => {
                    const isActive = selectedItem.categoryStatus?.[category.id] !== false;
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} key={category.id}>
                        <Card 
                          sx={{ 
                            backgroundColor: isActive ? theme.palette.success.light : theme.palette.error.light,
                            border: `2px solid ${isActive ? theme.palette.success.main : theme.palette.error.main}`,
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: theme.shadows[4],
                            },
                            opacity: isActive ? 1 : 0.8,
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={isActive}
                                  onChange={(e) => handleCategoryToggle(selectedItem.id, category.id, e.target.checked)}
                                  disabled={loading}
                                  color="primary"
                                  sx={{ 
                                    '& .MuiSwitch-thumb': {
                                      backgroundColor: isActive ? theme.palette.success.main : theme.palette.error.main
                                    }
                                  }}
                                />
                              }
                              label={
                                <Box sx={{ ml: 1 }}>
                                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                      {category.name}
                                    </Typography>
                                    <Chip
                                      label={isActive ? 'Active' : 'Disabled'}
                                      size="small"
                                      color={isActive ? 'success' : 'error'}
                                      sx={{ fontSize: '0.7rem', height: 20 }}
                                    />
                                  </Box>
                                  <Typography variant="caption" color="textSecondary">
                                    {isActive ? `${selectedItem.itemType === 'service' ? 'Service' : 'Bundle'} available in this category` : `${selectedItem.itemType === 'service' ? 'Service' : 'Bundle'} not available in this category`}
                                  </Typography>
                                </Box>
                              }
                              sx={{ width: '100%', alignItems: 'flex-start' }}
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            )}

            {!selectedItem && (
              <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: theme.palette.grey[50] }}>
                <Box sx={{ 
                  p: 3, 
                  borderRadius: '50%', 
                  backgroundColor: theme.palette.primary.light,
                  display: 'inline-flex',
                  mb: 2
                }}>
                  <SettingsIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Select an Item to Configure
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Choose an item from the list above to manage its category availability
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setShowOnlyIncomplete(true)}
                  sx={{ textTransform: 'none' }}
                >
                  Show Incomplete Items
                </Button>
              </Paper>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default CategoryControls;
