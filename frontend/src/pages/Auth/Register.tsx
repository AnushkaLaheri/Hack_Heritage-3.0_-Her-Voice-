import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
} from '@mui/material';
import {
  Security,
  Person,
  Email,
  Lock,
  Phone,
  LocationOn,
  CreditCard,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../../store/index';
import { register, clearError } from '../../store/slices/authSlice';

const steps = ['Basic Information', 'Verification Details', 'Role Selection'];

const Register: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    role: 'User',
    aadhaar: '',
    pan: '',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [registeredUserEmail, setRegisteredUserEmail] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    dispatch(clearError());
  };

  const handleRoleChange = (e: any) => {
    setFormData({ ...formData, role: e.target.value });
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data && data.display_name) {
              setFormData({ ...formData, location: data.display_name });
            } else {
              alert('Failed to get address from coordinates.');
            }
          } catch (err) {
            console.error(err);
            alert('Error fetching address.');
          }
        },
        (error) => {
          console.error(error);
          alert('Unable to get your location. Please allow location access.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) return;

    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      location: formData.location,
      role: formData.role,
      aadhaar: formData.aadhaar || undefined,
      pan: formData.pan || undefined,
    };

    const result = await dispatch(register(userData));
    if (register.fulfilled.match(result)) {
      if (formData.aadhaar || formData.pan) {
        setOtpSent(true);
        setRegisteredUserEmail(formData.email);
      } else {
        navigate('/login');
      }
    }
  };

  const verifyOtp = async () => {
    if (!otpValue) return;
    setLoadingOtp(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredUserEmail, otp: otpValue }),
      });
      const data = await res.json();
      setLoadingOtp(false);

      if (data.success) {
        navigate('/login');
      } else {
        alert(data.error || 'OTP verification failed');
      }
    } catch (err) {
      console.error(err);
      setLoadingOtp(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return formData.username && formData.email && formData.password && formData.confirmPassword;
      case 1:
        return formData.phone && formData.location;
      case 2:
        return formData.role;
      default:
        return false;
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required fullWidth name="username" label="Username"
                value={formData.username} onChange={handleInputChange}
                InputProps={{ startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} /> }}
                helperText="Username must be unique"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required fullWidth name="email" label="Email Address" type="email"
                value={formData.email} onChange={handleInputChange}
                InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required fullWidth name="password" label="Password" type="password"
                value={formData.password} onChange={handleInputChange}
                InputProps={{ startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required fullWidth name="confirmPassword" label="Confirm Password" type="password"
                value={formData.confirmPassword} onChange={handleInputChange}
                error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
                helperText={formData.password !== formData.confirmPassword && formData.confirmPassword !== '' ? 'Passwords do not match' : ''}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required fullWidth name="phone" label="Phone Number"
                value={formData.phone} onChange={handleInputChange}
                InputProps={{ startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} /> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required fullWidth name="location" label="Location"
                value={formData.location} InputProps={{ readOnly: true, startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active' }} /> }}
              />
              <Button variant="outlined" onClick={handleGetLocation} sx={{ mt: 1 }}>Get My Current Location</Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth name="aadhaar" label="Aadhaar Number (Optional)" placeholder="XXXX-XXXX-XXXX"
                value={formData.aadhaar} onChange={handleInputChange} inputProps={{ maxLength: 12 }}
                InputProps={{ startAdornment: <Security sx={{ mr: 1, color: 'action.active' }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth name="pan" label="PAN Number (Optional)" placeholder="ABCDE1234F"
                value={formData.pan} onChange={handleInputChange} inputProps={{ maxLength: 10 }}
                InputProps={{ startAdornment: <CreditCard sx={{ mr: 1, color: 'action.active' }} /> }}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Choose Your Role</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{ cursor: 'pointer', border: formData.role === 'User' ? 2 : 1, borderColor: formData.role === 'User' ? 'primary.main' : 'divider' }}
                  onClick={() => setFormData({ ...formData, role: 'User' })}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>User</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Access safety features, share experiences, and get support from the community.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{ cursor: 'pointer', border: formData.role === 'Volunteer' ? 2 : 1, borderColor: formData.role === 'Volunteer' ? 'primary.main' : 'divider' }}
                  onClick={() => setFormData({ ...formData, role: 'Volunteer' })}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Volunteer</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Help other women in need, provide emergency assistance, and support the community.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{ cursor: 'pointer', border: formData.role === 'Mentor' ? 2 : 1, borderColor: formData.role === 'Mentor' ? 'primary.main' : 'divider' }}
                  onClick={() => setFormData({ ...formData, role: 'Mentor' })}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Mentor</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Provide guidance, legal advice, and mentorship to women seeking help.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Security sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography component="h1" variant="h4" color="primary">Women Safety App</Typography>
          </Box>

          <Typography component="h2" variant="h5" gutterBottom>Create Account</Typography>

          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

          {otpSent ? (
            <Box sx={{ width: '100%' }}>
              <TextField fullWidth label="Enter OTP" value={otpValue} onChange={(e) => setOtpValue(e.target.value)} />
              <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={verifyOtp} disabled={loadingOtp}>
                {loadingOtp ? <CircularProgress size={24} /> : 'Verify OTP'}
              </Button>
            </Box>
          ) : (
            <>
              <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
              </Stepper>

              <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                {getStepContent(activeStep)}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
                  <Box>
                    {activeStep === steps.length - 1 ? (
                      <Button variant="contained" type="submit" disabled={loading || !isStepValid(activeStep)}>
                        {loading ? <CircularProgress size={24} /> : 'Create Account'}
                      </Button>
                    ) : (
                      <Button variant="contained" onClick={handleNext} disabled={!isStepValid(activeStep)}>
                        Next
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </>
          )}

          <Box sx={{ mt: 3 }}>
            <Link component={RouterLink} to="/login" variant="body2">Already have an account? Sign In</Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
