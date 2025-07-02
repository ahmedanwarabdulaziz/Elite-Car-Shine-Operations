import React from 'react';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';

const Step1CustomerType = ({ customerType, onSelect }) => (
  <Box sx={{ p: 4 }}>
    <Typography variant="h5" gutterBottom>
      Select Customer Type
    </Typography>
    <Grid container spacing={4}>
      <Grid item xs={12} sm={6}>
        <Paper elevation={customerType === 'corporate' ? 6 : 1} sx={{ p: 3, textAlign: 'center', border: customerType === 'corporate' ? '2px solid #1976d2' : 'none' }}>
          <Typography variant="h6" gutterBottom>Corporate</Typography>
          <Button
            variant={customerType === 'corporate' ? 'contained' : 'outlined'}
            color="primary"
            size="large"
            fullWidth
            onClick={() => onSelect('corporate')}
          >
            Select Corporate
          </Button>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Paper elevation={customerType === 'individual' ? 6 : 1} sx={{ p: 3, textAlign: 'center', border: customerType === 'individual' ? '2px solid #1976d2' : 'none' }}>
          <Typography variant="h6" gutterBottom>Individual</Typography>
          <Button
            variant={customerType === 'individual' ? 'contained' : 'outlined'}
            color="primary"
            size="large"
            fullWidth
            onClick={() => onSelect('individual')}
          >
            Select Individual
          </Button>
        </Paper>
      </Grid>
    </Grid>
  </Box>
);

export default Step1CustomerType; 