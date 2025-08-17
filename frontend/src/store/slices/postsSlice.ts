import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  author: string;
  likes: number;
  created_at: string;
  comments_count: number;
}

interface PostsState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  totalPages: number;
}

const initialState: PostsState = {
  posts: [],
  loading: false,
  error: null,
  total: 0,
  currentPage: 1,
  totalPages: 1,
};

export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (params: { category?: string; page?: number; per_page?: number }) => {
    const response = await axios.get('/api/posts', { params });
    return response.data;
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData: {
    title: string;
    content: string;
    category: string;
    is_anonymous?: boolean;
  }) => {
    const response = await axios.post('/api/posts', postData);
    return response.data;
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Posts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.posts;
        state.total = action.payload.total;
        state.currentPage = action.payload.current_page;
        state.totalPages = action.payload.pages;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch posts';
      })
      // Create Post
      .addCase(createPost.fulfilled, (state) => {
        // Refresh posts after creating new one
        // In a real app, you might want to add the new post to the list
      });
  },
});

export const { clearError } = postsSlice.actions;
export default postsSlice.reducer;
