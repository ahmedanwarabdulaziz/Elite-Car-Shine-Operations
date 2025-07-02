import React from 'react';
import { Box, Typography, Grid, Card, CardActionArea, CardContent, Avatar, TextField, InputAdornment, CircularProgress } from '@mui/material';
import { Search as SearchIcon, Business as BusinessIcon, Person as PersonIcon } from '@mui/icons-material';

const Step2CustomerSelect = ({ customerType, data, onSelect, searchTerm, setSearchTerm, loading }) => {
  console.log('Step2CustomerSelect render:', { customerType, dataLength: data?.length, data, loading, searchTerm });
  
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        {customerType === 'corporate' ? 'Select Corporate Customer' : 'Select Individual Customer Group'}
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder={customerType === 'corporate' ? 'Search corporate customers...' : 'Search individual groups...'}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
        sx={{ mb: 3 }}
      />
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : data && data.length > 0 ? (
        <Grid container spacing={3}>
          {data.map(item => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card onClick={() => onSelect(item)} sx={{ cursor: 'pointer', transition: 'all 0.2s', '&:hover': { boxShadow: 6 } }}>
                <CardActionArea>
                  <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: 48, height: 48, mr: 2, bgcolor: item.color || 'primary.main' }}>
                      {customerType === 'corporate' ? <BusinessIcon /> : <PersonIcon />}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {customerType === 'corporate' ? item.corporateName : item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description || 'No description'}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No {customerType === 'corporate' ? 'corporate customers' : 'individual groups'} found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'No data available'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Step2CustomerSelect; 