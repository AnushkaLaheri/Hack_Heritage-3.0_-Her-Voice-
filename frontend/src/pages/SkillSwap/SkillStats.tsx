  import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import {
  School,
    MenuBook, 

  TrendingUp,
  Star,
  EmojiEvents,
  People,
  Send,
  Inbox,
  CheckCircle
} from '@mui/icons-material';
import { skillSwapApi, SkillStats as SkillStatsType, UserBadge } from '../../api/skillSwapApi';

const SkillStats: React.FC = () => {
  const [stats, setStats] = useState<SkillStatsType | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, badgesData] = await Promise.all([
        skillSwapApi.getSkillStats(),
        skillSwapApi.getUserBadges()
      ]);
      
      setStats(statsData);
      setBadges(badgesData.badges);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case 'first_teach': return '👨‍🏫';
      case 'first_learn': return '📚';
      case 'mentor': return '🎯';
      case 'active_learner': return '🌟';
      case 'expert': return '🏆';
      default: return '🎖️';
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    description?: string;
    progress?: number;
  }> = ({ title, value, icon, color, description, progress }) => (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      border: `1px solid ${color}30`,
      '&:hover': { 
        boxShadow: 4,
        transform: 'translateY(-2px)',
        transition: 'all 0.2s ease-in-out'
      }
    }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box sx={{ color }}>
            {icon}
          </Box>
          <Typography variant="h4" fontWeight="bold" color={color}>
            {value}
          </Typography>
        </Box>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {description}
          </Typography>
        )}
        {progress !== undefined && (
          <Box mt={2}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: `${color}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color
                }
              }} 
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {progress}% progress
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!stats) {
    return <Alert severity="warning">No statistics available</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Your Skill Swap Journey
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your progress as a learner and teacher in our community
        </Typography>
      </Box>

      {/* Main Stats Grid */}
      <Grid container spacing={3} mb={4}>
        {/* Teaching Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Teaching Skills"
            value={stats.teaching_skills}
            icon={<MenuBook sx={{ fontSize: 32 }} />}
            color="#FF6B6B"
            description="Skills you can teach"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Learning Goals"
            value={stats.learning_skills}
            icon={<School sx={{ fontSize: 32 }} />}
            color="#4ECDC4"
            description="Skills you want to learn"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Rating"
            value={stats.average_rating > 0 ? `${stats.average_rating}⭐` : 'N/A'}
            icon={<Star sx={{ fontSize: 32 }} />}
            color="#FFD93D"
            description={`Based on ${stats.total_ratings} rating(s)`}
            progress={stats.average_rating > 0 ? (stats.average_rating / 5) * 100 : 0}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Badges Earned"
            value={stats.badges_earned}
            icon={<EmojiEvents sx={{ fontSize: 32 }} />}
            color="#A8E6CF"
            description="Achievement badges"
          />
        </Grid>
      </Grid>

      {/* Detailed Stats */}
      <Grid container spacing={3} mb={4}>
        {/* Teaching Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MenuBook color="secondary" />
                Teaching Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Inbox fontSize="small" color="primary" />
                  <Typography variant="body2">Requests Received</Typography>
                </Box>
                <Chip label={stats.teaching_requests_received} color="primary" size="small" />
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle fontSize="small" color="success" />
                  <Typography variant="body2">Active Students</Typography>
                </Box>
                <Chip label={stats.active_teaching_matches} color="success" size="small" />
              </Box>

              {stats.teaching_requests_received > 0 && (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Acceptance Rate
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.active_teaching_matches / stats.teaching_requests_received) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {Math.round((stats.active_teaching_matches / stats.teaching_requests_received) * 100)}%
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Learning Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School color="primary" />
                Learning Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Send fontSize="small" color="secondary" />
                  <Typography variant="body2">Requests Sent</Typography>
                </Box>
                <Chip label={stats.learning_requests_sent} color="secondary" size="small" />
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <People fontSize="small" color="success" />
                  <Typography variant="body2">Active Teachers</Typography>
                </Box>
                <Chip label={stats.active_learning_matches} color="success" size="small" />
              </Box>

              {stats.learning_requests_sent > 0 && (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Success Rate
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.active_learning_matches / stats.learning_requests_sent) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {Math.round((stats.active_learning_matches / stats.learning_requests_sent) * 100)}%
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Badges Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents color="warning" />
            Your Achievements
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {badges.length === 0 ? (
            <Box textAlign="center" py={4}>
              <EmojiEvents sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Badges Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start teaching or learning to earn your first badge!
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {badges.map((badge) => (
                <Grid item xs={12} sm={6} md={4} key={badge.id}>
                  <Paper sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #FFD93D15 0%, #FFD93D05 100%)',
                    border: '1px solid #FFD93D30',
                    '&:hover': { 
                      boxShadow: 2,
                      transform: 'scale(1.02)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}>
                    <Typography variant="h3" sx={{ mb: 1 }}>
                      {getBadgeIcon(badge.badge_type)}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {badge.badge_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {badge.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Earned: {new Date(badge.earned_at).toLocaleDateString()}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Motivational Message */}
      {stats.teaching_skills === 0 && stats.learning_skills === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Get Started!</strong> Add your first skill to begin your Skill Swap journey. 
            Whether you want to teach or learn, every expert was once a beginner! 🌟
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default SkillStats;