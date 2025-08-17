import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  LinearProgress,
  Alert,  
} from '@mui/material';
import { RootState, AppDispatch } from '../../store/index';
import { fetchCompanyRatings, rateCompany, fetchDashboard } from '../../store/slices/equalitySlice';

const Equality: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { companies, dashboard, loading } = useSelector((state: RootState) => state.equality);

  useEffect(() => {
    dispatch(fetchCompanyRatings());
    dispatch(fetchDashboard());
  }, [dispatch]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gender Equality Hub
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Gender Pay Gap Overview
              </Typography>
              {dashboard && (
                <Box>
                  <Typography variant="h3" color="primary" gutterBottom>
                    {dashboard.gender_pay_gap.overall}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average gender pay gap across all sectors
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Women in Leadership
              </Typography>
              {dashboard && (
                <Box>
                  <Typography variant="h3" color="secondary" gutterBottom>
                    {dashboard.leadership_diversity.women_in_leadership}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Percentage of women in leadership positions
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Company Ratings
      </Typography>
      
      <Grid container spacing={2}>
        {companies.map((company, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {company.name}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Safety Rating: {company.avg_safety.toFixed(1)}/5
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(company.avg_safety / 5) * 100} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Pay Equality: {company.avg_pay_equality.toFixed(1)}/5
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(company.avg_pay_equality / 5) * 100} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {company.total_ratings} ratings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Equality;
