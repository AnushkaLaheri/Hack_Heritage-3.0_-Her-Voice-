import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Security,
  Warning,
  Equalizer,
  Description,
  TrendingUp,
  People,
  Support,
  LocationOn,
  Phone,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../../store/index';
import { fetchPosts } from '../../store/slices/postsSlice';
import { fetchNearbyHelp } from '../../store/slices/emergencySlice';
import { fetchDashboard } from '../../store/slices/equalitySlice';
import SOSButton from '../../components/SOS/SOSButton';

const Home: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { posts } = useSelector((state: RootState) => state.posts);
  const { nearbyPlaces } = useSelector((state: RootState) => state.emergency);
  const { dashboard } = useSelector((state: RootState) => state.equality);

  const [sosActive, setSosActive] = useState(false);
  const sosInterval = useRef<NodeJS.Timeout | null>(null);

  const handleSOS = async () => {
    if (!user) return;
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        try {
          const res = await fetch("http://127.0.0.1:5000/api/sos/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              user_id: user.id,
              latitude,
              longitude 
            }),
          });
          const data = await res.json();
          console.log("SOS Started:", data);
          
          // Show success message with contact info
          if (data.contacts_notified > 0) {
            alert(`SOS Alert sent! ${data.contacts_notified} emergency contacts have been notified.`);
          } else {
            alert("SOS Alert started, but no emergency contacts found. Please add emergency contacts in your profile.");
          }
        } catch (err) {
          console.error("SOS start error:", err);
          alert("Failed to send SOS alert. Please try again.");
        }
      }, (error) => {
        console.error("Location error:", error);
        // Fallback: send SOS without location
        handleSOSWithoutLocation();
      });
    } else {
      // Fallback: send SOS without location
      handleSOSWithoutLocation();
    }
  };

  const handleSOSWithoutLocation = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/sos/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id }),
      });
      const data = await res.json();
      console.log("SOS Started:", data);
      
      if (data.contacts_notified > 0) {
        alert(`SOS Alert sent! ${data.contacts_notified} emergency contacts have been notified.`);
      } else {
        alert("SOS Alert started, but no emergency contacts found. Please add emergency contacts in your profile.");
      }
    } catch (err) {
      console.error("SOS start error:", err);
      alert("Failed to send SOS alert. Please try again.");
    }
  };

  const startLiveSOS = () => {
    if (!user) return;
    setSosActive(true);

    sosInterval.current = setInterval(() => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          await fetch("http://127.0.0.1:5000/api/sos/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: user.id,
              latitude,
              longitude,
            }),
          });
        } catch (err) {
          console.error("Live SOS update error:", err);
        }
      });
    }, 5000);
  };

  const stopLiveSOS = () => {
    if (sosInterval.current) clearInterval(sosInterval.current);
    setSosActive(false);
    alert("SOS tracking stopped");
  };

  useEffect(() => {
    dispatch(fetchPosts({ page: 1, per_page: 5 }));
    dispatch(fetchNearbyHelp());
    dispatch(fetchDashboard());
  }, [dispatch]);

  const quickActions = [
    {
      title: 'Emergency Help',
      description: 'Get immediate assistance',
      icon: <Warning sx={{ fontSize: 40 }} />,
      color: '#f44336',
      path: '/emergency',
    },
    {
      title: 'AI Assistant',
      description: '24/7 legal guidance',
      icon: <Support sx={{ fontSize: 40 }} />,
      color: '#2196f3',
      path: '/chatbot',
    },
    {
      title: 'Gender Equality',
      description: 'Rate workplaces',
      icon: <Equalizer sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      path: '/equality',
    },
    {
      title: 'Government Schemes',
      description: 'Find support programs',
      icon: <Description sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      path: '/schemes',
    },
  ];

  const safetyTips = [
    'Always share your location with trusted contacts',
    'Keep emergency numbers on speed dial',
    'Trust your instincts - if something feels wrong, it probably is',
    'Learn self-defense techniques',
    'Stay aware of your surroundings',
  ];

  return (
    <Box>
      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #e91e63 0%, #9c27b0 100%)', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.username || "User"}!
        </Typography>
        <Typography variant="body1">
          You're part of a community of {user?.role === 'Volunteer' ? 'volunteers' : 'women'} supporting each other.
        </Typography>
      </Paper>

      {/* SOS Button */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <SOSButton size="large" />
      </Box>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ color: action.color, mb: 2 }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {action.description}
                </Typography>
                <Button variant="outlined" size="small" fullWidth>
                  Access
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Posts */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Community Posts
              </Typography>
              {posts.length > 0 ? (
                <List>
                  {posts.slice(0, 3).map((post) => (
                    <ListItem key={post.id} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {post.author.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={post.title}
                        secondary={
                          <React.Fragment>
                            <span style={{ display: 'block', marginBottom: '8px' }}>
                              {post.content.substring(0, 100)}...
                            </span>
                            <div style={{ marginTop: '8px' }}>
                              <Chip 
                                label={post.category} 
                                size="small" 
                                sx={{ mr: 1 }}
                              />
                              <span style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent posts. Be the first to share your experience!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            {/* Safety Tips */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Safety Tips
                  </Typography>
                  <List dense>
                    {safetyTips.map((tip, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={tip}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Nearby Help */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Nearby Help
                  </Typography>
                  {nearbyPlaces.length > 0 ? (
                    <List dense>
                      {nearbyPlaces.slice(0, 3).map((place, index) => (
                        <ListItem key={index}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                              <LocationOn />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={place.name}
                            secondary={
                              <React.Fragment>
                                <span style={{ display: 'block' }}>
                                  {place.distance} • {place.type}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                                  {place.phone}
                                </span>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Loading nearby help...
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Gender Equality Stats */}
            {dashboard && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Gender Equality Overview
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Overall Pay Gap
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={dashboard.gender_pay_gap.overall} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {dashboard.gender_pay_gap.overall}% difference
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Women in Leadership
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={dashboard.leadership_diversity.women_in_leadership} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {dashboard.leadership_diversity.women_in_leadership}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>

      {/* Emergency Alert */}
      <Alert 
        severity="warning" 
        sx={{ mt: 3 }}
        action={
          <Button color="inherit" size="small">
            Get Help Now
          </Button>
        }
      >
        <strong>Emergency:</strong> If you're in immediate danger, use the emergency button or call 100 immediately.
      </Alert>
    </Box>
  );
};

export default Home;