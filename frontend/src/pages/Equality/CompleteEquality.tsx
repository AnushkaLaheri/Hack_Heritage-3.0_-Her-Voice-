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
  Chip,
  CircularProgress,
  Rating,
  Paper
} from '@mui/material';
import { RootState, AppDispatch } from '../../store/index';
import { fetchCompanyRatings, fetchDashboard } from '../../store/slices/equalitySlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

const CompleteEquality: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { companies, dashboard, loading } = useSelector((state: RootState) => state.equality);
  
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    feedback_type: 'suggestion',
    message: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState<string>('IT');

  useEffect(() => {
    dispatch(fetchCompanyRatings());
    dispatch(fetchDashboard());
  }, [dispatch]);

  const handleFeedbackSubmit = () => {
    console.log('Feedback submitted:', feedbackForm);
    setFeedbackForm({
      name: '',
      email: '',
      feedback_type: 'suggestion',
      message: ''
    });
  };

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const trendsData = [
    { year: 2020, pay_gap: 25.5 },
    { year: 2021, pay_gap: 24.8 },
    { year: 2022, pay_gap: 24.1 },
    { year: 2023, pay_gap: 23.5 },
    { year: 2024, pay_gap: 22.9 }
  ];

  const selectedFieldData = fieldRatioData.find(f => f.field === selectedField);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h3" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', textAlign: 'center', mb: 4 }}>
        Gender Equality Hub
      </Typography>

      <Grid container spacing={4}>
        {/* Gender Pay Gap Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#1976d2' }}>
                Gender Pay Gap Overview
              </Typography>
              <Typography variant="h2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                {dashboard?.gender_pay_gap?.overall || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average gender pay gap across all sectors
              </Typography>
              <Box sx={{ mt: 2 }}>
                <BarChart width={300} height={200} data={payGapData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="pay_gap" fill="#8884d8" />
                </BarChart>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Women in Leadership Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#9c27b0' }}>
                Women in Leadership
              </Typography>
              <Typography variant="h2" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                {dashboard?.leadership_diversity?.women_in_leadership || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Percentage of women in leadership positions
              </Typography>
              <Box sx={{ mt: 2 }}>
                <PieChart width={300} height={200}>
                  <Pie
                    data={leadershipData}
                    cx={150}
                    cy={100}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leadershipData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Market Overview Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#ff9800' }}>
                Market Overview
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Field</InputLabel>
                <Select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                >
                  {fieldRatioData.map((field) => (
                    <MenuItem key={field.field} value={field.field}>
                      {field.field}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedFieldData && (
                <Box>
                  <Typography variant="h6">{selectedFieldData.field}</Typography>
                  <Typography variant="body2">Women: {selectedFieldData.women}%</Typography>
                  <Typography variant="body2">Men: {selectedFieldData.men}%</Typography>
                  <BarChart width={300} height={150} data={[selectedFieldData]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="field" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="women" fill="#82ca9d" name="Women" />
                    <Bar dataKey="men" fill="#8884d8" name="Men" />
                  </BarChart>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Trends Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#4caf50' }}>
                Pay Gap Trends
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Gender pay gap trends over time
              </Typography>
              <LineChart width={300} height={200} data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="pay_gap" stroke="#8884d8" />
              </LineChart>
            </CardContent>
          </Card>
        </Grid>

        {/* Company Selection Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#4caf50' }}>
                Company Ratings
              </Typography>
              <TextField
                fullWidth
                label="Search Companies"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Company</InputLabel>
                <Select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                >
                  {companies.map((company) => (
                    <MenuItem key={company.name} value={company.name}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedCompany && (
                <Box>
                  <Typography variant="h6">{selectedCompany}</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">Safety Rating</Typography>
                    <Rating value={companies.find(c => c.name === selectedCompany)?.avg_safety || 0} readOnly />
                    <Typography variant="body2">Pay Equality</Typography>
                    <Rating value={companies.find(c => c.name === selectedCompany)?.avg_pay_equality || 0} readOnly />
                    <Typography variant="body2">Culture Rating</Typography>
                    <Rating value={companies.find(c => c.name === selectedCompany)?.avg_culture || 0} readOnly />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Fun Facts Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#ff5722' }}>
                Fun Facts
              </Typography>
              <Box>
                <Chip label="In 2023, 45% of women entered STEM fields" sx={{ mb: 1 }} />
                <Chip label="Women-led companies have 25% higher ROI" sx={{ mb: 1 }} />
                <Chip label="Gender-diverse teams outperform by 21%" sx={{ mb: 1 }} />
                <Chip label="Companies with women CEOs have 20% higher revenue" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Feedback Form Section */}
        <Grid item xs={12}>
          <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: '#ff5722' }}>
                Feedback & Suggestions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={feedbackForm.name}
                    onChange={(e) => setFeedbackForm({...feedbackForm, name: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={feedbackForm.email}
                    onChange={(e) => setFeedbackForm({...feedbackForm, email: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Feedback Type</InputLabel>
                    <Select
                      value={feedbackForm.feedback_type}
                      onChange={(e) => setFeedbackForm({...feedbackForm, feedback_type: e.target.value})}
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
                    onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
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

export default CompleteEquality;
