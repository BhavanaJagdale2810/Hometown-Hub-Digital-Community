import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

function Dashboard() {
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [commentText, setCommentText] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [likingId, setLikingId] = useState(null);
  const [commentingId, setCommentingId] = useState(null);

  const [openComments, setOpenComments] = useState({});
  const [user, setUser] = useState(null);

  // =========================
  // Authentication Config
  // =========================
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return null;
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // =========================
  // Get Logged In User
  // =========================
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.log("User data error:", error);
    }
  }, []);

  // =========================
  // Fetch Posts
  // =========================
  const fetchPosts = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/posts`);

      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.log("Fetch Posts Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // =========================
  // Create / Update Post
  // =========================
  const handlePost = async () => {
    if (!user) {
      alert("Please login first!");
      return;
    }

    if (!postText.trim()) {
      alert("Please write something before posting!");
      return;
    }

    const config = getAuthConfig();

    if (!config) {
      alert("Authentication required. Please login again.");
      return;
    }

    try {
      setPosting(true);

      if (editingId) {
        await axios.put(
          `${API}/posts/${editingId}`,
          {
            content: postText.trim(),
          },
          config
        );

        alert("✅ Post updated successfully!");
      } else {
        await axios.post(
          `${API}/posts`,
          {
            content: postText.trim(),
            userName: user.name,
          },
          config
        );

        alert("🎉 Post created successfully!");
      }

      setPostText("");
      setEditingId(null);

      await fetchPosts();
    } catch (error) {
      console.log("Post Error:", error);

      if (error.response?.status === 401) {
        alert("Authentication required. Please login again.");
      } else {
        alert(
          error.response?.data?.message ||
            "Something went wrong. Please try again."
        );
      }
    } finally {
      setPosting(false);
    }
  };

  // =========================
  // Edit Post
  // =========================
  const handleEdit = (post) => {
    setPostText(post.content);
    setEditingId(post._id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // Cancel Edit
  // =========================
  const handleCancelEdit = () => {
    setEditingId(null);
    setPostText("");
  };

  // =========================
  // Delete Post
  // =========================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmDelete) return;

    const config = getAuthConfig();

    if (!config) {
      alert("Authentication required. Please login again.");
      return;
    }

    try {
      await axios.delete(`${API}/posts/${id}`, config);

      setPosts((prev) =>
        prev.filter((post) => post._id !== id)
      );

      if (editingId === id) {
        handleCancelEdit();
      }

      alert("🗑️ Post deleted successfully!");
    } catch (error) {
      console.log("Delete Post Error:", error);

      if (error.response?.status === 401) {
        alert("Authentication required. Please login again.");
      } else {
        alert(
          error.response?.data?.message ||
            "Failed to delete post."
        );
      }
    }
  };

  // =========================
  // Like / Unlike
  // =========================
  const handleLike = async (id) => {
    if (!user) {
      alert("Please login first!");
      return;
    }

    const config = getAuthConfig();

    if (!config) {
      alert("Authentication required. Please login again.");
      return;
    }

    try {
      setLikingId(id);

      const res = await axios.post(
        `${API}/posts/${id}/like`,
        {
          userId: user._id,
        },
        config
      );

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === id
            ? {
                ...post,
                likedBy: res.data.liked
                  ? [
                      ...(post.likedBy || []),
                      user._id,
                    ]
                  : (post.likedBy || []).filter(
                      (likedUser) =>
                        likedUser.toString() !==
                        user._id.toString()
                    ),
              }
            : post
        )
      );
    } catch (error) {
      console.log("Like Error:", error);

      if (error.response?.status === 401) {
        alert("Authentication required. Please login again.");
      } else {
        alert(
          error.response?.data?.message ||
            "Failed to update like."
        );
      }
    } finally {
      setLikingId(null);
    }
  };

  // =========================
  // Add Comment
  // =========================
  const handleComment = async (id) => {
    if (!user) {
      alert("Please login first!");
      return;
    }

    if (!commentText.trim()) {
      alert("Please enter a comment.");
      return;
    }

    const config = getAuthConfig();

    if (!config) {
      alert("Authentication required. Please login again.");
      return;
    }

    try {
      setCommentingId(id);

      await axios.post(
        `${API}/posts/${id}/comment`,
        {
          text: commentText.trim(),
          userName: user.name,
        },
        config
      );

      setCommentText("");
      setSelectedPost(null);

      setOpenComments((prev) => ({
        ...prev,
        [id]: true,
      }));

      await fetchPosts();
    } catch (error) {
      console.log("Comment Error:", error);

      if (error.response?.status === 401) {
        alert("Authentication required. Please login again.");
      } else {
        alert(
          error.response?.data?.message ||
            "Failed to add comment."
        );
      }
    } finally {
      setCommentingId(null);
    }
  };

  // =========================
  // Delete Comment
  // =========================
  const handleDeleteComment = async (
    postId,
    commentId
  ) => {
    const confirmDelete = window.confirm(
      "Delete this comment?"
    );

    if (!confirmDelete) return;

    const config = getAuthConfig();

    if (!config) {
      alert("Authentication required. Please login again.");
      return;
    }

    try {
      await axios.delete(
        `${API}/posts/${postId}/comment/${commentId}`,
        config
      );

      await fetchPosts();
    } catch (error) {
      console.log("Delete Comment Error:", error);

      if (error.response?.status === 401) {
        alert("Authentication required. Please login again.");
      } else {
        alert(
          error.response?.data?.message ||
            "Failed to delete comment."
        );
      }
    }
  };

  // =========================
  // Toggle Comments
  // =========================
  const toggleComments = (id) => {
    setOpenComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

    if (selectedPost !== id) {
      setSelectedPost(id);
      setCommentText("");
    }
  };

  // =========================
  // Filter Posts
  // =========================
  const filteredPosts = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return posts;

    return posts.filter(
      (post) =>
        post.content
          ?.toLowerCase()
          .includes(keyword) ||
        post.userName
          ?.toLowerCase()
          .includes(keyword)
    );
  }, [posts, search]);

  // =========================
  // Check Like
  // =========================
  const isLiked = (post) => {
    if (!user || !Array.isArray(post.likedBy)) {
      return false;
    }

    return post.likedBy.some(
      (likedUser) =>
        likedUser.toString() ===
        user._id?.toString()
    );
  };

  // =========================
  // Initial Avatar
  // =========================
  const getInitial = (name) => {
    return (
      name?.trim()?.charAt(0)?.toUpperCase() || "U"
    );
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f4f7fb;
          font-family: Arial, Helvetica, sans-serif;
        }

        button,
        input,
        textarea {
          font-family: inherit;
        }

        .dashboard-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(13,110,253,0.08), transparent 30%),
            #f4f7fb;
          padding-bottom: 50px;
        }

        .dashboard-container {
          width: 100%;
          max-width: 900px;
          margin: auto;
          padding: 30px 18px;
        }

        .hero-card {
          background: linear-gradient(135deg, #0d6efd, #5b21b6);
          color: white;
          border-radius: 24px;
          padding: 28px;
          margin-bottom: 22px;
          box-shadow: 0 12px 35px rgba(13,110,253,0.20);
        }

        .hero-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .hero-title {
          margin: 0;
          font-size: 30px;
          font-weight: 800;
        }

        .hero-subtitle {
          margin: 8px 0 0;
          opacity: 0.9;
          font-size: 15px;
        }

        .online-badge {
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.25);
          padding: 8px 13px;
          border-radius: 30px;
          font-size: 13px;
          white-space: nowrap;
        }

        .user-card {
          background: white;
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.06);
        }

        .avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0d6efd, #6f42c1);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 20px;
          flex-shrink: 0;
        }

        .user-name {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #222;
        }

        .user-status {
          margin: 5px 0 0;
          color: #198754;
          font-size: 13px;
        }

        .composer {
          background: white;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.06);
          border: 1px solid #e9edf3;
        }

        .composer-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }

        .composer-header h3 {
          margin: 0;
          color: #222;
          font-size: 19px;
        }

        .composer textarea {
          width: 100%;
          min-height: 110px;
          resize: vertical;
          border: 1px solid #dfe4ea;
          border-radius: 14px;
          padding: 14px;
          outline: none;
          font-size: 15px;
          transition: 0.2s;
        }

        .composer textarea:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 3px rgba(13,110,253,0.10);
        }

        .composer-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          gap: 10px;
        }

        .character-count {
          color: #777;
          font-size: 13px;
        }

        .button-group {
          display: flex;
          gap: 8px;
        }

        .primary-btn,
        .secondary-btn {
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          cursor: pointer;
          font-weight: 700;
          transition: 0.2s;
        }

        .primary-btn {
          background: #0d6efd;
          color: white;
        }

        .primary-btn:hover {
          background: #0b5ed7;
          transform: translateY(-1px);
        }

        .secondary-btn {
          background: #e9ecef;
          color: #333;
        }

        .secondary-btn:hover {
          background: #dfe3e7;
        }

        .primary-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .search-box {
          position: relative;
          margin-bottom: 22px;
        }

        .search-box input {
          width: 100%;
          border: 1px solid #dfe4ea;
          border-radius: 14px;
          padding: 14px 18px 14px 45px;
          outline: none;
          background: white;
          font-size: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.04);
        }

        .search-icon {
          position: absolute;
          left: 17px;
          top: 50%;
          transform: translateY(-50%);
          color: #777;
        }

        .feed-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .feed-header h2 {
          margin: 0;
          color: #222;
          font-size: 22px;
        }

        .post-count {
          background: #e7f0ff;
          color: #0d6efd;
          padding: 7px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
        }

        .post-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 17px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.06);
          border: 1px solid #edf0f4;
        }

        .post-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .small-avatar {
          width: 43px;
          height: 43px;
          border-radius: 50%;
          background: linear-gradient(135deg, #20c997, #0d6efd);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          flex-shrink: 0;
        }

        .post-user {
          margin: 0;
          font-size: 15px;
          color: #222;
          font-weight: 700;
        }

        .post-time {
          margin-top: 4px;
          display: block;
          color: #8a8f98;
          font-size: 12px;
        }

        .post-content {
          color: #333;
          font-size: 15px;
          line-height: 1.6;
          margin: 18px 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .post-stats {
          display: flex;
          gap: 18px;
          color: #777;
          font-size: 13px;
          padding-bottom: 12px;
          border-bottom: 1px solid #edf0f4;
        }

        .post-actions {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          flex-wrap: wrap;
        }

        .action-btn {
          border: none;
          background: #f5f7fa;
          color: #444;
          border-radius: 9px;
          padding: 9px 13px;
          cursor: pointer;
          font-weight: 600;
          transition: 0.2s;
        }

        .action-btn:hover {
          background: #e9eef5;
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .like-active {
          background: #ffe9ed;
          color: #dc3545;
        }

        .edit-btn {
          background: #fff3cd;
          color: #856404;
        }

        .delete-btn {
          background: #fde8e8;
          color: #dc3545;
        }

        .comment-box {
          margin-top: 15px;
          padding: 14px;
          background: #f7f9fc;
          border-radius: 14px;
        }

        .comment-input-row {
          display: flex;
          gap: 8px;
        }

        .comment-input {
          flex: 1;
          min-width: 0;
          border: 1px solid #dfe4ea;
          border-radius: 10px;
          padding: 10px 12px;
          outline: none;
        }

        .comment-input:focus {
          border-color: #0d6efd;
        }

        .comment-submit {
          border: none;
          background: #198754;
          color: white;
          border-radius: 10px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 700;
        }

        .comment-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .comment {
          margin-top: 12px;
          padding: 12px;
          background: white;
          border-radius: 11px;
          border: 1px solid #e8ebef;
        }

        .comment-user {
          font-weight: 700;
          font-size: 13px;
          color: #333;
        }

        .comment-text {
          margin: 6px 0;
          color: #444;
          font-size: 14px;
          line-height: 1.5;
        }

        .comment-time {
          color: #999;
          font-size: 11px;
        }

        .comment-delete {
          margin-top: 7px;
          border: none;
          background: transparent;
          color: #dc3545;
          cursor: pointer;
          padding: 0;
          font-size: 12px;
          font-weight: 600;
        }

        .empty-state {
          background: white;
          padding: 45px 20px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
        }

        .empty-icon {
          font-size: 45px;
          margin-bottom: 10px;
        }

        .empty-state h3 {
          margin: 5px 0;
          color: #333;
        }

        .empty-state p {
          color: #777;
          margin: 8px 0 0;
        }

        .loading {
          background: white;
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          color: #777;
        }

        .footer {
          text-align: center;
          color: #8a8f98;
          font-size: 13px;
          margin-top: 35px;
        }

        @media (max-width: 600px) {
          .dashboard-container {
            padding: 18px 12px;
          }

          .hero-card {
            padding: 20px;
            border-radius: 18px;
          }

          .hero-top {
            align-items: flex-start;
          }

          .hero-title {
            font-size: 24px;
          }

          .online-badge {
            font-size: 11px;
            padding: 6px 9px;
          }

          .composer,
          .post-card {
            padding: 15px;
          }

          .composer-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .button-group {
            width: 100%;
          }

          .button-group button {
            flex: 1;
          }

          .comment-input-row {
            flex-direction: column;
          }

          .comment-submit {
            width: 100%;
          }

          .feed-header h2 {
            font-size: 19px;
          }

          .post-actions {
            gap: 6px;
          }

          .action-btn {
            padding: 8px 10px;
            font-size: 12px;
          }
        }
      `}</style>

      <div className="dashboard-page">
        <div className="dashboard-container">

          {/* HERO */}
          <div className="hero-card">
            <div className="hero-top">
              <div>
                <h1 className="hero-title">
                  🏡 Hometown Hub
                </h1>

                <p className="hero-subtitle">
                  Your Digital Community Platform
                </p>
              </div>

              <div className="online-badge">
                🟢 Online
              </div>
            </div>
          </div>

          {/* USER CARD */}
          {user && (
            <div className="user-card">
              <div className="avatar">
                {getInitial(user.name)}
              </div>

              <div>
                <h3 className="user-name">
                  👋 Welcome back, {user.name}!
                </h3>

                <p className="user-status">
                  ● Active member
                </p>
              </div>
            </div>
          )}

          {/* CREATE POST */}
          <div className="composer">
            <div className="composer-header">
              <div className="small-avatar">
                {getInitial(user?.name)}
              </div>

              <h3>
                {editingId
                  ? "✏️ Edit your post"
                  : "📝 Create a post"}
              </h3>
            </div>

            <textarea
              placeholder="Share something with your hometown community..."
              value={postText}
              maxLength={1000}
              onChange={(e) =>
                setPostText(e.target.value)
              }
            />

            <div className="composer-footer">
              <span className="character-count">
                {postText.length} / 1000 characters
              </span>

              <div className="button-group">
                {editingId && (
                  <button
                    className="secondary-btn"
                    onClick={handleCancelEdit}
                    disabled={posting}
                  >
                    Cancel
                  </button>
                )}

                <button
                  className="primary-btn"
                  onClick={handlePost}
                  disabled={posting}
                >
                  {posting
                    ? "Please wait..."
                    : editingId
                    ? "💾 Update Post"
                    : "🚀 Post"}
                </button>
              </div>
            </div>
          </div>

          {/* SEARCH */}
          <div className="search-box">
            <span className="search-icon">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search posts or users..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          {/* FEED HEADER */}
          <div className="feed-header">
            <h2>🌍 Community Feed</h2>

            <span className="post-count">
              {filteredPosts.length} Posts
            </span>
          </div>

          {/* LOADING / POSTS */}
          {loading ? (
            <div className="loading">
              ⏳ Loading community posts...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                🌱
              </div>

              <h3>No posts found</h3>

              <p>
                {search
                  ? "Try a different search."
                  : "Be the first person to share something!"}
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const liked = isLiked(post);

              return (
                <div
                  className="post-card"
                  key={post._id}
                >

                  {/* POST HEADER */}
                  <div className="post-header">
                    <div className="small-avatar">
                      {getInitial(post.userName)}
                    </div>

                    <div>
                      <p className="post-user">
                        {post.userName ||
                          "Unknown User"}
                      </p>

                      <span className="post-time">
                        🕒{" "}
                        {post.createdAt
                          ? new Date(
                              post.createdAt
                            ).toLocaleString()
                          : "Recently"}
                      </span>
                    </div>
                  </div>

                  {/* POST CONTENT */}
                  <div className="post-content">
                    {post.content}
                  </div>

                  {/* STATS */}
                  <div className="post-stats">
                    <span>
                      {liked ? "❤️" : "♡"}{" "}
                      {post.likedBy?.length || 0} likes
                    </span>

                    <span>
                      💬{" "}
                      {post.comments?.length || 0} comments
                    </span>
                  </div>

                  {/* ACTIONS */}
                  <div className="post-actions">

                    {/* LIKE */}
                    <button
                      className={`action-btn ${
                        liked ? "like-active" : ""
                      }`}
                      onClick={() =>
                        handleLike(post._id)
                      }
                      disabled={
                        likingId === post._id
                      }
                    >
                      {likingId === post._id
                        ? "..."
                        : liked
                        ? "❤️ Liked"
                        : "🤍 Like"}
                    </button>

                    {/* COMMENT */}
                    <button
                      className="action-btn"
                      onClick={() =>
                        toggleComments(post._id)
                      }
                    >
                      💬 Comment
                    </button>

                    {/* OWNER ACTIONS */}
                    {user &&
                      post.userName === user.name && (
                        <>
                          <button
                            className="action-btn edit-btn"
                            onClick={() =>
                              handleEdit(post)
                            }
                          >
                            ✏️ Edit
                          </button>

                          <button
                            className="action-btn delete-btn"
                            onClick={() =>
                              handleDelete(post._id)
                            }
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}
                  </div>

                  {/* COMMENTS */}
                  {openComments[post._id] && (
                    <div className="comment-box">

                      <div className="comment-input-row">
                        <input
                          className="comment-input"
                          type="text"
                          placeholder="Write a comment..."
                          value={
                            selectedPost === post._id
                              ? commentText
                              : ""
                          }
                          onChange={(e) => {
                            setSelectedPost(post._id);
                            setCommentText(
                              e.target.value
                            );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleComment(
                                post._id
                              );
                            }
                          }}
                        />

                        <button
                          className="comment-submit"
                          onClick={() =>
                            handleComment(
                              post._id
                            )
                          }
                          disabled={
                            commentingId ===
                            post._id
                          }
                        >
                          {commentingId === post._id
                            ? "..."
                            : "Add"}
                        </button>
                      </div>

                      {/* COMMENT LIST */}
                      {post.comments &&
                      post.comments.length > 0 ? (
                        <div>
                          <h4
                            style={{
                              margin:
                                "16px 0 8px",
                              color: "#333",
                            }}
                          >
                            💬 Comments (
                            {post.comments.length})
                          </h4>

                          {post.comments.map(
                            (comment) => (
                              <div
                                className="comment"
                                key={comment._id}
                              >
                                <div className="comment-user">
                                  👤{" "}
                                  {comment.userName ||
                                    "Unknown User"}
                                </div>

                                <div className="comment-text">
                                  {comment.text}
                                </div>

                                <div className="comment-time">
                                  {comment.createdAt
                                    ? new Date(
                                        comment.createdAt
                                      ).toLocaleString()
                                    : ""}
                                </div>

                                {/* DELETE OWN COMMENT */}
                                {user &&
                                  comment.userName ===
                                    user.name && (
                                    <button
                                      className="comment-delete"
                                      onClick={() =>
                                        handleDeleteComment(
                                          post._id,
                                          comment._id
                                        )
                                      }
                                    >
                                      🗑️ Delete comment
                                    </button>
                                  )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p
                          style={{
                            color: "#888",
                            fontSize: "13px",
                            margin: "14px 0 0",
                          }}
                        >
                          No comments yet. Be the
                          first to comment! 💬
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* FOOTER */}
          <div className="footer">
            🏡 Hometown Hub • Connect • Share • Grow
          </div>

        </div>
      </div>
    </>
  );
}

export default Dashboard;