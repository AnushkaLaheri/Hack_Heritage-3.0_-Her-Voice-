import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { RootState, AppDispatch } from '../../store/index';
import { fetchCompanyRatings, fetchDashboard } from '../../store/slices/equalitySlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

const KPI_CARDS = [
  {
    label: 'Gender Pay Gap',
    value: '21.5%',
    sub: 'Avg. across sectors',
    color: '#1976d2',
    icon: '💸',
  },
  {
    label: 'Women in Leadership',
    value: '28.3%',
    sub: 'Top positions',
    color: '#9c27b0',
    icon: '👩‍💼',
  },
  {
    label: 'Women in Workforce',
    value: '44.7%',
    sub: 'All industries',
    color: '#ff9800',
    icon: '👩‍💻',
  },
  {
    label: 'Companies Rated',
    value: '124',
    sub: 'On platform',
    color: '#4caf50',
    icon: '🏢',
  },
];

const payGapData = [
  { sector: 'Technology', pay_gap: 18.2 },
  { sector: 'Healthcare', pay_gap: 25.1 },
  { sector: 'Finance', pay_gap: 30.5 },
  { sector: 'Education', pay_gap: 15.8 },
  { sector: 'Manufacturing', pay_gap: 22.3 }
];

const leadershipData = [
  { name: 'Women', value: 28.3 },
  { name: 'Men', value: 71.7 }
];

const fieldRatioData = [
  { field: 'IT', women: 45, men: 55 },
  { field: 'Finance', women: 35, men: 65 },
  { field: 'Healthcare', women: 65, men: 35 },
  { field: 'Education', women: 55, men: 45 }
];

const EnhancedEquality: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { companies } = useSelector((state: RootState) => state.equality);

  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    feedback_type: 'suggestion',
    message: ''
  });

  useEffect(() => {
    dispatch(fetchCompanyRatings());
    dispatch(fetchDashboard());
  }, [dispatch]);

  const handleFeedbackSubmit = () => {
    // Handle feedback submission
    console.log('Feedback submitted:', feedbackForm);
    // Reset form
    setFeedbackForm({
      name: '',
      email: '',
      feedback_type: 'suggestion',
      message: ''
    });
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h3" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', textAlign: 'center', mb: 4 }}>
        Gender Equality Hub
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {KPI_CARDS.map((kpi, idx) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: 4,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: '#fff',
                minHeight: 140,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: kpi.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                  fontSize: 28,
                  color: '#fff',
                  boxShadow: 2,
                }}
              >
                {kpi.icon}
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: kpi.color }}>
                {kpi.value}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mt: 0.5 }}>
                {kpi.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {kpi.sub}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={4} sx={{ mb: 3 }}>
        {/* Gender Pay Gap Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3, borderRadius: 3, p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                Gender Pay Gap by Sector
              </Typography>
              <BarChart width={320} height={200} data={payGapData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sector" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pay_gap" fill="#8884d8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </CardContent>
          </Card>
        </Grid>
        {/* Women in Leadership Pie */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3, borderRadius: 3, p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#9c27b0', fontWeight: 600 }}>
                Women in Leadership (Share)
              </Typography>
              <PieChart width={320} height={200}>
                <Pie
                  data={leadershipData}
                  cx={160}
                  cy={100}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {leadershipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </CardContent>
          </Card>
        </Grid>
        {/* Market Overview Bar */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3, borderRadius: 3, p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#ff9800', fontWeight: 600 }}>
                Women vs Men Ratio by Field
              </Typography>
              <BarChart width={320} height={200} data={fieldRatioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="field" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="women" fill="#82ca9d" name="Women" radius={[8, 8, 0, 0]} />
                <Bar dataKey="men" fill="#8884d8" name="Men" radius={[8, 8, 0, 0]} />
              </BarChart>
            </CardContent>
          </Card>
        </Grid>
        {/* Company Ratings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3, borderRadius: 3, p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#4caf50', fontWeight: 600 }}>
                Company Ratings
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Company</InputLabel>
                <Select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  label="Select Company"
                >
                  {companies.map((company) => (
                    <MenuItem key={company.name} value={company.name}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedCompany && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedCompany}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Safety: {companies.find(c => c.name === selectedCompany)?.avg_safety || 0}/5
                  </Typography>
                  <Typography variant="body2">
                    Pay Equality: {companies.find(c => c.name === selectedCompany)?.avg_pay_equality || 0}/5
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Feedback Form Section */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card sx={{ boxShadow: 3, borderRadius: 3, p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#ff5722', fontWeight: 600 }}>
                Feedback & Suggestions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={feedbackForm.name}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={feedbackForm.email}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Feedback Type</InputLabel>
                    <Select
                      value={feedbackForm.feedback_type}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback_type: e.target.value })}
                      label="Feedback Type"
                    >
                      <MenuItem value="suggestion">Suggestion</MenuItem>
                      <MenuItem value="complaint">Complaint</MenuItem>
                      <MenuItem value="appreciation">Appreciation</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Message"
                    value={feedbackForm.message}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleFeedbackSubmit}
                    disabled={!feedbackForm.name || !feedbackForm.email || !feedbackForm.message}
                  >
                    Submit Feedback
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedEquality;
