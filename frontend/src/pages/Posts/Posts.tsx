import React, { useEffect, useState } from 'react';
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
  Chip,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  FormControlLabel,
  Switch,
  Pagination,
  Alert,
} from '@mui/material';
import {
  Add,
  ThumbUp,
  Comment,
  Share,
  MoreVert,
  Article,
  Category,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../../store/index';
import { fetchPosts, createPost } from '../../store/slices/postsSlice';

const categories = [
  'Workplace Harassment',
  'Pay Gap',
  'Safety Issue',
  'Domestic Violence',
  'Other'
];

const Posts: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: '',
    is_anonymous: false,
  });
  
  const dispatch = useDispatch<AppDispatch>();
  const { posts, loading, total, currentPage, totalPages } = useSelector((state: RootState) => state.posts);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchPosts({ page: 1, per_page: 10 }));
  }, [dispatch]);

  const handleCreatePost = async () => {
    if (newPost.title && newPost.content && newPost.category) {
      await dispatch(createPost(newPost));
      setCreateDialogOpen(false);
      setNewPost({ title: '', content: '', category: '', is_anonymous: false });
      dispatch(fetchPosts({ page: 1, per_page: 10 }));
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    dispatch(fetchPosts({ page, per_page: 10 }));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Workplace Harassment':
        return '#f44336';
      case 'Pay Gap':
        return '#ff9800';
      case 'Safety Issue':
        return '#e91e63';
      case 'Domestic Violence':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Community Posts
        </Typography>
                 <Button
           variant="contained"
           onClick={() => setCreateDialogOpen(true)}
         >
           <Add sx={{ mr: 1 }} />
           Share Your Story
         </Button>
      </Box>

      {/* Posts Grid */}
      <Grid container spacing={3}>
        {posts.map((post) => (
          <Grid item xs={12} key={post.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {post.is_anonymous ? <VisibilityOff /> : post.author.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {post.is_anonymous ? 'Anonymous' : post.author}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(post.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton size="small">
                    <MoreVert />
                  </IconButton>
                </Box>

                <Typography variant="h6" gutterBottom>
                  {post.title}
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {post.content}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chip
                    label={post.category}
                    size="small"
                    sx={{ bgcolor: getCategoryColor(post.category), color: 'white' }}
                  />
                  {post.is_anonymous && (
                    <Chip
                      icon={<VisibilityOff />}
                      label="Anonymous"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                     <Button
                     size="small"
                     variant="outlined"
                   >
                     <ThumbUp sx={{ mr: 1 }} />
                     {post.likes} Like{post.likes !== 1 ? 's' : ''}
                   </Button>
                                     <Button
                     size="small"
                     variant="outlined"
                   >
                     <Comment sx={{ mr: 1 }} />
                     {post.comments_count} Comment{post.comments_count !== 1 ? 's' : ''}
                   </Button>
                                     <Button
                     size="small"
                     variant="outlined"
                   >
                     <Share sx={{ mr: 1 }} />
                     Share
                   </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Create Post Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Article sx={{ mr: 1, color: 'primary.main' }} />
            Share Your Story
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Share your experience, ask for advice, or support others in the community.
          </Typography>
          
          <TextField
            fullWidth
            label="Title"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Story"
            placeholder="Share your experience, ask for advice, or provide support..."
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={newPost.category}
              label="Category"
              onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={newPost.is_anonymous}
                onChange={(e) => setNewPost({ ...newPost, is_anonymous: e.target.checked })}
              />
            }
            label="Post anonymously"
          />
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Privacy:</strong> Anonymous posts help protect your identity while still allowing you to share your experiences and get support from the community.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreatePost}
            disabled={!newPost.title || !newPost.content || !newPost.category}
          >
            Share Post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Posts;
