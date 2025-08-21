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
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import {
  Email,
  Security,
  CreditCard,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../../store/index';
import { login, clearError } from '../../store/slices/authSlice';
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";   // ✅ correct import

// ✅ Define interface for Google JWT
interface GoogleJwtPayload {
  email: string;
  name: string;
  picture: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Login: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    aadhaar: '',
    pan: '',
  });
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [panOtpSent, setPanOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { error } = useSelector((state: RootState) => state.auth);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    dispatch(clearError());
    setAadhaarOtpSent(false);
    setPanOtpSent(false);
    setOtpValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email && formData.password) {
      const result = await dispatch(
        login({ email: formData.email, password: formData.password })
      );
      if (login.fulfilled.match(result)) {
        const token = result.payload.access_token; // adjust if your thunk returns { access_token, user }
        localStorage.setItem('token', token);
        navigate('/');
      }
    }
  };
  
  // Aadhaar OTP send
  const handleAadhaarLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.aadhaar) return;

  console.log('Sending Aadhaar OTP to:', `${process.env.REACT_APP_API_URL}/api/auth/send-aadhaar-otp`);
  console.log('Aadhaar:', formData.aadhaar);

  try {
    setLoading(true);

    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/send-aadhaar-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aadhaar: formData.aadhaar }),
    });

    console.log('Aadhaar OTP Response status:', res.status);

    // Always parse JSON safely
    let data: any = {};
    try {
      data = await res.json();
      console.log('Aadhaar OTP Response data:', data);
    } catch (jsonErr) {
      console.warn('Response is not valid JSON', jsonErr);
    }

    setLoading(false);

    if (res.ok) {
      setAadhaarOtpSent(true);
      alert('OTP sent successfully! Check your email.');
    } else {
      alert(data.error || 'Something went wrong. Please try again.');
    }
  } catch (err) {
    console.error('Network or server error:', err);
    setLoading(false);
    alert('Failed to send OTP. Please check your connection or try later.');
  }
};


  // PAN OTP send
  const handlePANLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pan) return;
    
    console.log('Sending PAN OTP to:', `${process.env.REACT_APP_API_URL}/api/auth/send-pan-otp`);
    console.log('PAN:', formData.pan);
    
    try {
      setLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/send-pan-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan: formData.pan }),
      });
      
      console.log('PAN OTP Response status:', res.status);
      
      const data = await res.json();
      console.log('PAN OTP Response data:', data);
      
      setLoading(false);
      if (res.ok) {
        setPanOtpSent(true);
        alert('OTP sent successfully! Check your email.');
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error('PAN OTP error:', err);
      setLoading(false);
      alert('Failed to send PAN OTP. Please try again.');
    }
  };

  // Verify Aadhaar OTP
  const verifyAadhaarOtp = async () => {
    if (!otpValue) {
      alert('Please enter OTP');
      return;
    }
    
    console.log('Verifying Aadhaar OTP:', { aadhaar: formData.aadhaar, otp: otpValue });
    
    try {
      setLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify-aadhaar-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar: formData.aadhaar, otp: otpValue }),
      });
      
      console.log('Verify Aadhaar Response status:', res.status);
      
      const data = await res.json();
      console.log('Verify Aadhaar Response data:', data);
      
      setLoading(false);

      if (data.access_token) {
        console.log('Login successful, updating state and navigating...');
        
        // Update localStorage first
        localStorage.setItem('token', data.access_token);
        
        // Update Redux state manually
        dispatch({
          type: 'auth/login/fulfilled',
          payload: {
            access_token: data.access_token,
            user: data.user || {
              id: 0,
              username: 'User',
              email: '',
              role: 'User',
              is_verified: true
            }
          }
        });
        
        console.log('Navigating to home...');
        // Navigate to home
        navigate('/', { replace: true });
      } else {
        console.error('No access token in response:', data);
        alert(data.error || 'OTP verification failed');
      }
    } catch (err) {
      console.error('Network error during OTP verification:', err);
      setLoading(false);
      alert('Network error. Please try again.');
    }
  };


  const verifyPanOtp = async () => {
    if (!otpValue) {
      alert('Please enter OTP');
      return;
    }
    
    console.log('Verifying PAN OTP:', { pan: formData.pan, otp: otpValue });
    
    try {
      setLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify-pan-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan: formData.pan, otp: otpValue }),
      });
      
      console.log('Verify PAN Response status:', res.status);
      
      const data = await res.json();
      console.log('Verify PAN Response data:', data);
      
      setLoading(false);

      if (data.access_token) {
        console.log('PAN Login successful, updating state and navigating...');
        
        // Update localStorage first
        localStorage.setItem('token', data.access_token);
        
        // Update Redux state manually
        dispatch({
          type: 'auth/login/fulfilled',
          payload: {
            access_token: data.access_token,
            user: data.user || {
              id: 0,
              username: 'User',
              email: '',
              role: 'User',
              is_verified: true
            }
          }
        });
        
        console.log('Navigating to home...');
        // Navigate to home
        navigate('/', { replace: true });
      } else {
        console.error('No access token in PAN response:', data);
        alert(data.error || 'OTP verification failed');
      }
    } catch (err) {
      console.error('Network error during PAN OTP verification:', err);
      setLoading(false);
      alert('Network error. Please try again.');
    }
  };

  // ✅ Google Login
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (!credentialResponse.credential) return;

      // Decode Google JWT
      const userInfo = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);
      console.log("Google user:", userInfo?.email, userInfo?.name);

      // Send token to backend
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();
      if (data.access_token) {
        // Update localStorage first
        localStorage.setItem("token", data.access_token);
        
        // Update Redux state manually
        dispatch({
          type: 'auth/login/fulfilled',
          payload: {
            access_token: data.access_token,
            user: data.user || {
              id: 0,
              username: userInfo?.name || 'User',
              email: userInfo?.email || '',
              role: 'User',
              is_verified: true
            }
          }
        });
        
        // Navigate to home
        navigate('/', { replace: true });
      } else {
        alert(data.error || "Google login failed");
      }
    } catch (err) {
      console.error("Google login error:", err);
      alert("Google login failed. Please try again.");
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper
          elevation={3}
          sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Security sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography component="h1" variant="h4" color="primary">
              Women Safety App
            </Typography>
          </Box>

          <Typography component="h2" variant="h5" gutterBottom>
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ width: '100%' }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 2 }}>
              <Tab label="Email" icon={<Email />} />
              <Tab label="Aadhaar" icon={<Security />} />
              <Tab label="PAN" icon={<CreditCard />} />
            </Tabs>

            {/* Email Login */}
            <TabPanel value={tabValue} index={0}>
              <Box component="form" onSubmit={handleEmailLogin} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Sign In'}
                </Button>
              </Box>
            </TabPanel>

            {/* Aadhaar Login */}
            <TabPanel value={tabValue} index={1}>
              <Box component="form" sx={{ mt: 1 }}>
                {!aadhaarOtpSent && (
                  <>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="aadhaar"
                      label="Aadhaar Number"
                      name="aadhaar"
                      placeholder="XXXX-XXXX-XXXX"
                      value={formData.aadhaar}
                      onChange={handleInputChange}
                      inputProps={{ maxLength: 12 }}
                    />
                    <Button
                      type="button"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, mb: 2 }}
                      disabled={loading}
                      onClick={handleAadhaarLogin}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Send OTP'}
                    </Button>
                  </>
                )}
                {aadhaarOtpSent && (
                  <>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="Enter OTP"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value)}
                    />
                    <Button
                      type="button"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 2 }}
                      disabled={loading}
                      onClick={verifyAadhaarOtp}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
                    </Button>
                  </>
                )}
              </Box>
            </TabPanel>

            {/* PAN Login */}
            <TabPanel value={tabValue} index={2}>
              <Box component="form" sx={{ mt: 1 }}>
                {!panOtpSent && (
                  <>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="pan"
                      label="PAN Number"
                      name="pan"
                      placeholder="ABCDE1234F"
                      value={formData.pan}
                      onChange={handleInputChange}
                      inputProps={{ maxLength: 10 }}
                    />
                    <Button
                      type="button"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, mb: 2 }}
                      disabled={loading}
                      onClick={handlePANLogin}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Send OTP'}
                    </Button>
                  </>
                )}
                {panOtpSent && (
                  <>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="Enter OTP"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value)}
                    />
                    <Button
                      type="button"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 2 }}
                      disabled={loading}
                      onClick={verifyPanOtp}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
                    </Button>
                  </>
                )}
              </Box>
            </TabPanel>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            {/* ✅ Google Login Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  alert("Google Sign In Failed");
                }}
              />
            </Box>

            <Grid container justifyContent="space-between">
              <Grid item>
                <Link component={RouterLink} to="/register" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
              <Grid item>
                <Link component={RouterLink} to="/forgot-password" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
