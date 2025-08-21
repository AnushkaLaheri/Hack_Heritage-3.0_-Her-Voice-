import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Tabs,
  Tab,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider
} from '@mui/material';
import {
  School,
  MenuBook,
  Edit,
  Delete,
  Add,
  Schedule,
  Computer,
  Person,
  Star
} from '@mui/icons-material';
import { skillSwapApi, UserSkill } from '../../api/skillSwapApi';

interface MySkillsProps {
  onAddSkill: () => void;
}

const MySkills: React.FC<MySkillsProps> = ({ onAddSkill }) => {
  const [teachingSkills, setTeachingSkills] = useState<UserSkill[]>([]);
  const [learningSkills, setLearningSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<UserSkill | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const [teachingData, learningData] = await Promise.all([
        skillSwapApi.getUserSkills('teach'),
        skillSwapApi.getUserSkills('learn')
      ]);
      
      setTeachingSkills(teachingData.skills);
      setLearningSkills(learningData.skills);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSkill = async () => {
    if (!skillToDelete) return;

    try {
      setDeleteLoading(true);
      await skillSwapApi.deleteUserSkill(skillToDelete.id);
      
      // Remove from local state
      if (skillToDelete.skill_type === 'teach') {
        setTeachingSkills(prev => prev.filter(s => s.id !== skillToDelete.id));
      } else {
        setLearningSkills(prev => prev.filter(s => s.id !== skillToDelete.id));
      }
      
      setDeleteDialogOpen(false);
      setSkillToDelete(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete skill');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'expert': return 'error';
      case 'advanced': return 'warning';
      case 'intermediate': return 'info';
      case 'beginner': return 'success';
      default: return 'default';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'online': return <Computer fontSize="small" />;
      case 'offline': return <Person fontSize="small" />;
      default: return <Computer fontSize="small" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'online': return 'primary';
      case 'offline': return 'secondary';
      case 'both': return 'success';
      default: return 'default';
    }
  };

  const SkillCard: React.FC<{ skill: UserSkill; type: 'teach' | 'learn' }> = ({ skill, type }) => (
    <Grid item xs={12} sm={6} md={4}>
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: type === 'teach' ? '2px solid' : '1px solid',
        borderColor: type === 'teach' ? 'secondary.main' : 'divider',
        '&:hover': { 
          boxShadow: 6,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}>
        <CardContent sx={{ flexGrow: 1 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              {type === 'teach' ? (
                <MenuBook color="secondary" />
              ) : (
                <School color="primary" />
              )}
              <Typography variant="h6" color={type === 'teach' ? 'secondary' : 'primary'}>
                {skill.skill.name}
              </Typography>
            </Box>
            <Box>
              <Tooltip title="Edit Skill">
                <IconButton size="small" color="primary">
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Skill">
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => {
                    setSkillToDelete(skill);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Category */}
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {skill.skill.category}
          </Typography>

          {/* Description */}
          {skill.description && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              {skill.description}
            </Typography>
          )}

          {/* Tags */}
          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
            {skill.proficiency_level && (
              <Chip 
                size="small" 
                label={skill.proficiency_level}
                color={getProficiencyColor(skill.proficiency_level) as any}
                variant="outlined"
              />
            )}
            {skill.preferred_method && (
              <Chip 
                size="small" 
                icon={getMethodIcon(skill.preferred_method)}
                label={skill.preferred_method}
                color={getMethodColor(skill.preferred_method) as any}
                variant="outlined"
              />
            )}
          </Box>

          {/* Availability */}
          {skill.availability && (
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Schedule fontSize="small" />
              {skill.availability}
            </Typography>
          )}

          {/* Dates */}
          <Box mt={2} pt={2} borderTop={1} borderColor="divider">
            <Typography variant="caption" color="text.secondary">
              Added: {new Date(skill.created_at).toLocaleDateString()}
            </Typography>
            {skill.updated_at !== skill.created_at && (
              <Typography variant="caption" color="text.secondary" display="block">
                Updated: {new Date(skill.updated_at).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
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

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          My Skills
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAddSkill}
          sx={{ borderRadius: 2 }}
        >
          Add New Skill
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab 
            icon={<MenuBook />} 
            label={`Teaching (${teachingSkills.length})`}
            sx={{ minHeight: 60 }}
          />
          <Tab 
            icon={<School />} 
            label={`Learning (${learningSkills.length})`}
            sx={{ minHeight: 60 }}
          />
        </Tabs>
      </Box>

      {/* Teaching Skills Tab */}
      {tabValue === 0 && (
        <Box>
          {teachingSkills.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', bgcolor: 'secondary.50' }}>
              <MenuBook sx={{ fontSize: 64, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Teaching Skills Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Share your expertise! Add skills you can teach to help others learn and grow.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Add />}
                onClick={onAddSkill}
                size="large"
              >
                Add Teaching Skill
              </Button>
            </Card>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Teaching Skills:</strong> These are skills you can teach to others. 
                  People can request to learn from you!
                </Typography>
              </Alert>
              <Grid container spacing={3}>
                {teachingSkills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} type="teach" />
                ))}
              </Grid>
            </>
          )}
        </Box>
      )}

      {/* Learning Skills Tab */}
      {tabValue === 1 && (
        <Box>
          {learningSkills.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', bgcolor: 'primary.50' }}>
              <School sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Learning Goals Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start your learning journey! Add skills you want to learn to find great teachers.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={onAddSkill}
                size="large"
              >
                Add Learning Goal
              </Button>
            </Card>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Learning Goals:</strong> These are skills you want to learn. 
                  Use the Browse tab to find teachers for these skills!
                </Typography>
              </Alert>
              <Grid container spacing={3}>
                {learningSkills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} type="learn" />
                ))}
              </Grid>
            </>
          )}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
  open={deleteDialogOpen}
  onClose={() => setDeleteDialogOpen(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>
    Delete Skill
  </DialogTitle>
  <DialogContent>
    {skillToDelete && (
      <Box>
        <Typography gutterBottom>
          Are you sure you want to delete this skill?
        </Typography>
        <Box 
          display="flex" 
          alignItems="center" 
          gap={1} 
          mt={2} 
          p={2} 
          bgcolor="grey.50" 
          borderRadius={1}
        >
          {skillToDelete.skill_type === 'teach' ? (
            <MenuBook color="secondary" />
          ) : (
            <School color="primary" />
          )}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {skillToDelete.skill.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {skillToDelete.skill.category} • {skillToDelete.skill_type === 'teach' ? 'Teaching' : 'Learning'}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          This action cannot be undone.
        </Typography>
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDeleteDialogOpen(false)}>
      Cancel
    </Button>
    <Button 
      onClick={handleDeleteSkill}
      color="error"
      variant="contained"
      disabled={deleteLoading}
      startIcon={deleteLoading ? <CircularProgress size={20} /> : <Delete />}
    >
      Delete
    </Button>
  </DialogActions>
</Dialog>

    </Box>
  );
};

export default MySkills;