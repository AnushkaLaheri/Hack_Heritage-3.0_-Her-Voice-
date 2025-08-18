import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// Comment type
export interface CommentType {
  author: string | null;
  content: string;
  created_at: string;
}

// Post type
export interface Post {
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
  latest_comments: CommentType[]; // ✅ optional from API
}

interface PostsState {
  posts: Post[];
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
}

const initialState: PostsState = {
  posts: [],
  totalPages: 1,
  currentPage: 1,
  loading: false,
  error: null,
};

// ✅ Thunk for fetching posts
export const fetchPosts = createAsyncThunk<
  { posts: Post[]; total_pages: number; current_page: number },
  { page: number; per_page: number },
  { rejectValue: string }
>(
  "posts/fetchPosts",
  async ({ page, per_page }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/posts?page=${page}&per_page=${per_page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Failed to fetch posts");
    }
  }
);

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // ✅ normalize so latest_comments always exists
        state.posts = action.payload.posts.map((p: Post) => ({
          ...p,
          latest_comments: p.latest_comments ?? [],
        }));
        state.totalPages = action.payload.total_pages;
        state.currentPage = action.payload.current_page;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default postsSlice.reducer;
