import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  Badge,
  Tooltip
} from '@mui/material';
import {
  School,
  MenuBook,
  Search,
  Star,
  EmojiEvents,
  TrendingUp,
  People,
  Notifications
} from '@mui/icons-material';

// Import sub-components
import BrowseSkills from './BrowseSkills';
import MySkills from './MySkills';
import SkillRequests from './SkillRequests';
import SkillStats from './SkillStats';
import AddSkillDialog from './AddSkillDialog';

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
      id={`skill-tabpanel-${index}`}
      aria-labelledby={`skill-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `skill-tab-${index}`,
    'aria-controls': `skill-tabpanel-${index}`,
  };
}

const SkillSwap: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [addSkillOpen, setAddSkillOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center'
        }}>
          🔄 Skill Swap
        </Typography>
        <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          Learn new skills, teach what you know, and grow together! 🌟
        </Typography>

        {/* Quick Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'primary.50' }}>
              <CardContent>
                <School color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" color="primary">Learn</Typography>
                <Typography variant="body2" color="text.secondary">
                  Discover new skills from amazing teachers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'secondary.50' }}>
              <CardContent>
                <MenuBook color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" color="secondary">Teach</Typography>
                <Typography variant="body2" color="text.secondary">
                  Share your expertise and help others grow
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'success.50' }}>
              <CardContent>
                <People color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" color="success">Connect</Typography>
                <Typography variant="body2" color="text.secondary">
                  Build meaningful learning relationships
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'warning.50' }}>
              <CardContent>
                <EmojiEvents color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" color="warning">Achieve</Typography>
                <Typography variant="body2" color="text.secondary">
                  Earn badges and track your progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Main Content */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="skill swap tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<Search />} 
              label="Browse Skills" 
              {...a11yProps(0)} 
              sx={{ minHeight: 72 }}
            />
            <Tab 
              icon={<School />} 
              label="My Skills" 
              {...a11yProps(1)} 
              sx={{ minHeight: 72 }}
            />
            <Tab 
              icon={<Badge badgeContent={3} color="error"><Notifications /></Badge>} 
              label="Requests" 
              {...a11yProps(2)} 
              sx={{ minHeight: 72 }}
            />
            <Tab 
              icon={<TrendingUp />} 
              label="My Stats" 
              {...a11yProps(3)} 
              sx={{ minHeight: 72 }}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <BrowseSkills />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <MySkills onAddSkill={() => setAddSkillOpen(true)} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <SkillRequests />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <SkillStats />
        </TabPanel>
      </Paper>

      {/* Add Skill Dialog */}
      <AddSkillDialog 
        open={addSkillOpen} 
        onClose={() => setAddSkillOpen(false)} 
      />

      {/* Floating Action Button */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Tooltip title="Add New Skill">
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => setAddSkillOpen(true)}
            sx={{
              borderRadius: '50%',
              minWidth: 56,
              height: 56,
              boxShadow: 3,
              '&:hover': {
                boxShadow: 6,
                transform: 'scale(1.05)'
              }
            }}
          >
            +
          </Button>
        </Tooltip>
      </Box>
    </Container>
  );
};

export default SkillSwap;