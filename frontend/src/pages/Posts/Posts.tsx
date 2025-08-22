import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
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
  FormControlLabel,
  Switch,
  Pagination,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  Snackbar,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Add,
  ThumbUp,
  Comment,
  Share,
  MoreVert,
  Article,
  VisibilityOff,
  WhatsApp,
  Email,
  Link as LinkIcon,
  Delete,
} from "@mui/icons-material";
import { RootState, AppDispatch } from "../../store/index";
import { fetchPosts, deletePost } from "../../store/slices/postsSlice";
import api from "../../api/axios";

// ✅ Define Post type
interface CommentType {
  author: string | null;
  content: string;
  created_at: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  author: string;
  created_at: string;
  image_url?: string;
  is_anonymous: boolean;
  likes: number;
  comments_count: number;
  latest_comments: CommentType[];
}

const categories = [
  "Workplace Harassment",
  "Pay Gap",
  "Safety Issue",
  "Domestic Violence",
  "Other",
];

const Posts: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newPost, setNewPost] = useState<{
    title: string;
    content: string;
    category: string;
    is_anonymous: boolean;
    image?: File | null;
  }>({
    title: "",
    content: "",
    category: "",
    is_anonymous: false,
    image: null,
  });

  const dispatch = useDispatch<AppDispatch>();
  const { posts, totalPages, currentPage } = useSelector(
    (state: RootState) => state.posts
  );

  // Share state
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [copiedOpen, setCopiedOpen] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchPosts({ page: 1, per_page: 10 }));
  }, [dispatch]);

  // ---------- Helper Functions ----------
  const getPostUrl = (post: Post) =>
    `${window.location.origin}/posts/${post.id}`;
  const getShareText = (post: Post) => {
    const by = post.is_anonymous ? "Anonymous" : post.author;
    return `${post.title} — by ${by}\n\n${
      post.content
    }\n\nRead more: ${getPostUrl(post)}`;
  };

  const handleShare = async (post: Post) => {
    const title = post.title;
    const text = getShareText(post);
    const url = getPostUrl(post);

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // fallback
      }
    }

    setSharePost(post);
    setShareOpen(true);
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedOpen(true);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedOpen(true);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Workplace Harassment":
        return "#f44336";
      case "Pay Gap":
        return "#ff9800";
      case "Safety Issue":
        return "#e91e63";
      case "Domestic Violence":
        return "#9c27b0";
      default:
        return "#757575";
    }
  };

  // ---------- API Handlers ----------
  const handleCreatePost = async () => {
    if (newPost.title && newPost.content && newPost.category) {
      const formData = new FormData();
      formData.append("title", newPost.title);
      formData.append("content", newPost.content);
      formData.append("category", newPost.category);
      formData.append("is_anonymous", newPost.is_anonymous.toString());
      if (newPost.image) formData.append("image", newPost.image);

      try {
        await api.post("/api/posts", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setCreateDialogOpen(false);
        setNewPost({
          title: "",
          content: "",
          category: "",
          is_anonymous: false,
          image: null,
        });
        dispatch(fetchPosts({ page: 1, per_page: 10 }));
      } catch (error: any) {
        console.error(
          "Failed to create post:",
          error.response?.data || error.message
        );
      }
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await api.post(`/api/posts/${postId}/like`);
      dispatch(fetchPosts({ page: currentPage, per_page: 10 }));
    } catch (error: any) {
      console.error(
        "Failed to like post:",
        error.response?.data || error.message
      );
    }
  };

  const fetchComments = async (postId: number) => {
    try {
      const response = await api.get(`/api/posts/${postId}/comments`);
      return response.data.comments || [];
    } catch (error: any) {
      console.error(
        "Failed to fetch comments:",
        error.response?.data || error.message
      );
      return [];
    }
  };

  const handleOpenComments = async (postId: number) => {
    setSelectedPostId(postId);
    setCommentDialogOpen(true);
    const fetchedComments = await fetchComments(postId);
    setComments(fetchedComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPostId) return;
    try {
      await api.post(`/api/posts/${selectedPostId}/comments`, {
        content: newComment,
      });
      const updatedComments = await fetchComments(selectedPostId);
      setComments(updatedComments);
      setNewComment("");
      dispatch(fetchPosts({ page: currentPage, per_page: 10 }));
    } catch (error: any) {
      console.error(
        "Failed to add comment:",
        error.response?.data || error.message
      );
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    dispatch(fetchPosts({ page, per_page: 10 }));
  };

  // ---------- Delete Handlers ----------
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    postId: number
  ) => {
    setAnchorEl(event.currentTarget);
    setCurrentPostId(postId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setCurrentPostId(null);
  };

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    setDeleteLoading(true);
    try {
      await dispatch(deletePost(postToDelete.id)).unwrap();
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      // Refresh posts after deletion
      dispatch(fetchPosts({ page: currentPage, per_page: 10 }));
    } catch (error: any) {
      console.error(
        "Failed to delete post:",
        error.response?.data || error.message
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPostToDelete(null);
  };

  // Check if current user is the author of the post
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const isCurrentUserAuthor = (post: Post) => {
    // For anonymous posts, we can't determine authorship from frontend
    if (post.is_anonymous) return false;
    // Compare usernames to check if current user is the author
    return currentUser?.username === post.author;
  };

  // ---------- Render ----------
  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Community Posts</Typography>
        <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
          <Add sx={{ mr: 1 }} /> Share Your Story
        </Button>
      </Box>

      {/* Posts Grid */}
      <Grid container spacing={3}>
        {posts.map((post: Post) => (
          <Grid item xs={12} key={post.id}>
            <Card>
              <CardContent>
                {/* Author Info */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                      {post.is_anonymous ? (
                        <VisibilityOff />
                      ) : (
                        post.author.charAt(0).toUpperCase()
                      )}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {post.is_anonymous ? "Anonymous" : post.author}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(post.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, post.id)}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                {/* Post Content */}
                <Typography variant="h6" gutterBottom>
                  {post.title}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {post.content}
                </Typography>

                {/* Post Image */}
                {post.image_url && (
                  <Box sx={{ mt: 2, textAlign: "center" }}>
                    <img
                      src={`${
                        process.env.REACT_APP_API_URL || "http://localhost:5000"
                      }${post.image_url}`}
                      alt="post"
                      style={{
                        width: "70%",
                        aspectRatio: "1/1",
                        objectFit: "cover",
                        borderRadius: "12px",
                        maxHeight: "280px",
                      }}
                    />
                  </Box>
                )}

                {/* Category & Tags */}
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <Chip
                    label={post.category}
                    size="small"
                    sx={{
                      bgcolor: getCategoryColor(post.category),
                      color: "white",
                    }}
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

                {/* Like + Comment + Share */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleLike(post.id)}
                  >
                    <ThumbUp sx={{ mr: 1 }} /> {post.likes} Like
                    {post.likes !== 1 ? "s" : ""}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleOpenComments(post.id)}
                  >
                    <Comment sx={{ mr: 1 }} /> {post.comments_count} Comment
                    {post.comments_count !== 1 ? "s" : ""}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleShare(post)}
                  >
                    <Share sx={{ mr: 1 }} /> Share
                  </Button>
                </Box>

                {/* Inline Comments Preview */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Latest Comments:</Typography>
                  <List dense>
                    {post.latest_comments?.length > 0 ? (
                      post.latest_comments.map((c, i) => (
                        <ListItem key={i}>
                          <ListItemAvatar>
                            <Avatar>
                              {c.author
                                ? c.author.charAt(0).toUpperCase()
                                : "A"}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={c.author || "Anonymous"}
                            secondary={c.content}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No comments yet.
                      </Typography>
                    )}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Comment Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Comments</DialogTitle>
        <DialogContent>
          <List>
            {comments.map((c, index) => (
              <ListItem key={index} alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar>
                    {c.author ? c.author.charAt(0).toUpperCase() : "A"}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={c.author || "Anonymous"}
                  secondary={c.content}
                />
              </ListItem>
            ))}
          </List>

          <TextField
            fullWidth
            label="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleAddComment}>
            Post Comment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Post Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Article sx={{ mr: 1, color: "primary.main" }} /> Share Your Story
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Share your experience, ask for advice, or support others in the
            community.
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
            placeholder="Share your experience..."
            value={newPost.content}
            onChange={(e) =>
              setNewPost({ ...newPost, content: e.target.value })
            }
            sx={{ mb: 2 }}
          />

          <Button variant="outlined" component="label" sx={{ mb: 2 }}>
            Upload Image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) =>
                setNewPost({ ...newPost, image: e.target.files?.[0] || null })
              }
            />
          </Button>
          {newPost.image && (
            <Typography variant="caption">{newPost.image.name}</Typography>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={newPost.category}
              label="Category"
              onChange={(e) =>
                setNewPost({ ...newPost, category: e.target.value })
              }
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
                onChange={(e) =>
                  setNewPost({ ...newPost, is_anonymous: e.target.checked })
                }
              />
            }
            label="Post anonymously"
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Privacy:</strong> Anonymous posts help protect your identity
            while still allowing you to share your experiences and get support
            from the community.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreatePost}
            disabled={!newPost.title || !newPost.content || !newPost.category}
          >
            Share Post
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Share Post</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Choose how you want to share:
            </Typography>

            <Button
              variant="outlined"
              startIcon={<WhatsApp />}
              onClick={() => {
                if (!sharePost) return;
                const text = getShareText(sharePost);
                const wa = `https://api.whatsapp.com/send?text=${encodeURIComponent(
                  text
                )}`;
                window.open(wa, "_blank");
              }}
            >
              Share to WhatsApp
            </Button>

            <Button
              variant="outlined"
              startIcon={<Email />}
              onClick={() => {
                if (!sharePost) return;
                const subject = `Check this post: ${sharePost.title}`;
                const body = getShareText(sharePost);
                const mailto = `mailto:?subject=${encodeURIComponent(
                  subject
                )}&body=${encodeURIComponent(body)}`;
                window.location.href = mailto;
              }}
            >
              Share via Email
            </Button>

            <Button
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={() => {
                if (!sharePost) return;
                copyLink(getPostUrl(sharePost));
              }}
            >
              Copy Link
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Copy */}
      <Snackbar
        open={copiedOpen}
        autoHideDuration={2000}
        onClose={() => setCopiedOpen(false)}
        message="Link copied to clipboard"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this post? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Three-dot Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {currentPostId &&
          posts.find((post) => post.id === currentPostId) &&
          isCurrentUserAuthor(
            posts.find((post) => post.id === currentPostId)!
          ) && (
            <MenuItem
              onClick={() =>
                handleDeleteClick(
                  posts.find((post) => post.id === currentPostId)!
                )
              }
              sx={{ color: "error.main" }}
            >
              <Delete sx={{ mr: 1 }} /> Delete Post
            </MenuItem>
          )}
      </Menu>
    </Box>
  );
};

export default Posts;
