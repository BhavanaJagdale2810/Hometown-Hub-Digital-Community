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

  // -----------------------------
  // AUTH CONFIG
  // -----------------------------
  const getAuthConfig = () => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("userToken");

    return token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {};
  };

  // -----------------------------
  // LOAD USER
  // -----------------------------
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log("User Load Error:", error);
    }
  }, []);

  // -----------------------------
  // FETCH POSTS
  // -----------------------------
  const fetchPosts = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/posts`, getAuthConfig());

      console.log("Posts API Response:", res.data);

      let postData = [];

      if (Array.isArray(res.data)) {
        postData = res.data;
      } else if (Array.isArray(res.data.posts)) {
        postData = res.data.posts;
      } else if (Array.isArray(res.data.data)) {
        postData = res.data.data;
      } else if (res.data.success && Array.isArray(res.data.result)) {
        postData = res.data.result;
      }

      setPosts(postData);
    } catch (error) {
      console.log("Fetch Posts Error:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // -----------------------------
  // CHECK WHETHER POST BELONGS TO CURRENT USER
  // -----------------------------
  const isOwnPost = (post) => {
    if (!user || !post) {
      return false;
    }

    const currentUserId = String(user._id || user.id || "");

    const possibleOwnerIds = [
      post.userId?._id,
      post.userId?.id,
      post.userId,
      post.user?._id,
      post.user?.id,
      post.createdBy?._id,
      post.createdBy?.id,
      post.createdBy,
      post.author?._id,
      post.author?.id,
      post.author,
    ]
      .filter(
        (value) =>
          value !== undefined &&
          value !== null &&
          value !== ""
      )
      .map((value) => String(value));

    if (possibleOwnerIds.includes(currentUserId)) {
      return true;
    }

    // Temporary fallback for locally created posts
    const postUserName = String(
      post.userName || ""
    )
      .trim()
      .toLowerCase();

    const currentUserName = String(
      user.name || ""
    )
      .trim()
      .toLowerCase();

    if (
      postUserName &&
      currentUserName &&
      postUserName === currentUserName
    ) {
      return true;
    }

    return false;
  };

  // -----------------------------
  // CREATE / UPDATE POST
  // -----------------------------
  const handlePost = async () => {
    if (!user) {
      alert("Please login first.");
      return;
    }

    const content = postText.trim();

    if (!content) {
      alert("Please write something before posting.");
      return;
    }

    if (content.length > 1000) {
      alert("Post cannot exceed 1000 characters.");
      return;
    }

    try {
      setPosting(true);

      const config = getAuthConfig();

      if (editingId) {
        await axios.put(
          `${API}/posts/${editingId}`,
          {
            content,
          },
          config
        );

        alert("Post updated successfully!");
      } else {
        await axios.post(
          `${API}/posts`,
          {
            content,
            userName: user.name || "User",
          },
          config
        );

        alert("Post created successfully!");
      }

      setPostText("");
      setEditingId(null);

      await fetchPosts();
    } catch (error) {
      console.log("Post Error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to save post. Please try again."
      );
    } finally {
      setPosting(false);
    }
  };

  // -----------------------------
  // EDIT POST
  // -----------------------------
  const startEdit = (post) => {
    setEditingId(post._id);
    setPostText(post.content || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // -----------------------------
  // CANCEL EDIT
  // -----------------------------
  const cancelEdit = () => {
    setEditingId(null);
    setPostText("");
  };

  // -----------------------------
  // DELETE POST
  // -----------------------------
  const deletePost = async (postId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${API}/posts/${postId}`,
        getAuthConfig()
      );

      alert("Post deleted successfully!");

      await fetchPosts();
    } catch (error) {
      console.log("Delete Post Error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to delete post."
      );
    }
  };

  // -----------------------------
  // LIKE / UNLIKE POST
  // -----------------------------
  const handleLike = async (postId) => {
    if (!user) {
      alert("Please login first.");
      return;
    }

    try {
      setLikingId(postId);

      await axios.post(
        `${API}/posts/${postId}/like`,
        {
          userId: user._id || user.id,
        },
        getAuthConfig()
      );

      await fetchPosts();
    } catch (error) {
      console.log("Like Error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to like post."
      );
    } finally {
      setLikingId(null);
    }
  };

  // -----------------------------
  // ADD COMMENT
  // -----------------------------
  const handleComment = async (postId) => {
    if (!user) {
      alert("Please login first.");
      return;
    }

    const text = commentText.trim();

    if (!text) {
      alert("Please enter a comment.");
      return;
    }

    try {
      setCommentingId(postId);

      await axios.post(
        `${API}/posts/${postId}/comment`,
        {
          text,
          userName: user.name || "User",
        },
        getAuthConfig()
      );

      setCommentText("");
      setSelectedPost(null);

      await fetchPosts();
    } catch (error) {
      console.log("Comment Error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to add comment."
      );
    } finally {
      setCommentingId(null);
    }
  };

  // -----------------------------
  // DELETE COMMENT
  // -----------------------------
  const deleteComment = async (postId, commentId) => {
    const confirmDelete = window.confirm(
      "Delete this comment?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${API}/posts/${postId}/comment/${commentId}`,
        getAuthConfig()
      );

      await fetchPosts();
    } catch (error) {
      console.log("Delete Comment Error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to delete comment."
      );
    }
  };

  // -----------------------------
  // TOGGLE COMMENTS
  // -----------------------------
  const toggleComments = (postId) => {
    setOpenComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // -----------------------------
  // SEARCH
  // -----------------------------
  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return posts;
    }

    return posts.filter((post) => {
      const content = String(
        post.content || ""
      ).toLowerCase();

      const userName = String(
        post.userName || ""
      ).toLowerCase();

      return (
        content.includes(keyword) ||
        userName.includes(keyword)
      );
    });
  }, [posts, search]);

  // -----------------------------
  // DATE FORMAT
  // -----------------------------
  const formatDate = (date) => {
    if (!date) return "";

    try {
      return new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "";
    }
  };

  // -----------------------------
  // GET LIKE COUNT
  // -----------------------------
  const getLikeCount = (post) => {
    if (Array.isArray(post.likedBy)) {
      return post.likedBy.length;
    }

    if (typeof post.likes === "number") {
      return post.likes;
    }

    if (Array.isArray(post.likes)) {
      return post.likes.length;
    }

    return 0;
  };

  // -----------------------------
  // CHECK USER LIKED
  // -----------------------------
  const isLiked = (post) => {
    if (!user || !Array.isArray(post.likedBy)) {
      return false;
    }

    const currentUserId = String(
      user._id || user.id
    );

    return post.likedBy.some((item) => {
      if (typeof item === "string") {
        return String(item) === currentUserId;
      }

      if (item?._id) {
        return String(item._id) === currentUserId;
      }

      return false;
    });
  };

  // -----------------------------
  // GET COMMENTS
  // -----------------------------
  const getComments = (post) => {
    return Array.isArray(post.comments)
      ? post.comments
      : [];
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.logo}>
            🏡 Hometown Hub
          </h1>

          <p style={styles.tagline}>
            Your Digital Community Platform
          </p>
        </div>

        <div style={styles.online}>
          <span style={styles.onlineDot}></span>
          Online
        </div>
      </header>

      {/* WELCOME */}
      <section style={styles.welcomeCard}>
        <div style={styles.avatar}>
          {user?.name
            ? user.name.charAt(0).toUpperCase()
            : "U"}
        </div>

        <div>
          <h2 style={styles.welcomeTitle}>
            👋 Welcome back,{" "}
            {user?.name || "User"}!
          </h2>

          <p style={styles.activeMember}>
            ● Active member
          </p>
        </div>
      </section>

      {/* CREATE / EDIT POST */}
      <section style={styles.createCard}>
        <h2 style={styles.sectionTitle}>
          {editingId
            ? "✏️ Edit your post"
            : "📝 Create a post"}
        </h2>

        <p style={styles.sectionSubtitle}>
          Share something with your community
        </p>

        <textarea
          value={postText}
          onChange={(e) =>
            setPostText(e.target.value)
          }
          placeholder="What's happening in your hometown?"
          maxLength={1000}
          style={styles.textarea}
        />

        <div style={styles.postBottom}>
          <span style={styles.counter}>
            {postText.length}/1000 characters
          </span>

          <div style={styles.buttonGroup}>
            {editingId && (
              <button
                onClick={cancelEdit}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            )}

            <button
              onClick={handlePost}
              disabled={posting}
              style={{
                ...styles.postButton,
                opacity: posting ? 0.7 : 1,
              }}
            >
              {posting
                ? "Please wait..."
                : editingId
                ? "Update Post"
                : "Post"}
            </button>
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section style={styles.searchCard}>
        <span style={styles.searchIcon}>
          🔍
        </span>

        <input
          type="text"
          placeholder="Search posts or users..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={styles.searchInput}
        />
      </section>

      {/* FEED */}
      <section style={styles.feedSection}>
        <div style={styles.feedHeader}>
          <div>
            <h2 style={styles.feedTitle}>
              Community Feed
            </h2>

            <p style={styles.postCount}>
              {filteredPosts.length}{" "}
              {filteredPosts.length === 1
                ? "Post"
                : "Posts"}
            </p>
          </div>

          <button
            onClick={fetchPosts}
            style={styles.refreshButton}
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div style={styles.emptyCard}>
            <div style={styles.loader}>
              ⏳
            </div>

            <h3>Loading posts...</h3>

            <p>Please wait.</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              📭
            </div>

            <h3>
              {search
                ? "No posts found"
                : "No posts yet."}
            </h3>

            <p>
              {search
                ? "Try another search."
                : "Be the first one to create a post!"}
            </p>
          </div>
        ) : (
          <div style={styles.postsList}>
            {filteredPosts.map((post) => {
              const comments =
                getComments(post);

              const liked = isLiked(post);

              return (
                <article
                  key={post._id}
                  style={styles.postCard}
                >
                  {/* POST HEADER */}
                  <div style={styles.postHeader}>
                    <div style={styles.userInfo}>
                      <div
                        style={
                          styles.smallAvatar
                        }
                      >
                        {post.userName
                          ? post.userName
                              .charAt(0)
                              .toUpperCase()
                          : "U"}
                      </div>

                      <div>
                        <strong
                          style={
                            styles.userName
                          }
                        >
                          {post.userName ||
                            "User"}
                        </strong>

                        <div
                          style={
                            styles.postDate
                          }
                        >
                          {formatDate(
                            post.createdAt ||
                              post.updatedAt
                          )}
                        </div>
                      </div>
                    </div>

                    {/* EDIT / DELETE */}
                    {isOwnPost(post) && (
                      <div
                        style={
                          styles.actionGroup
                        }
                      >
                        <button
                          onClick={() =>
                            startEdit(post)
                          }
                          style={
                            styles.iconButton
                          }
                          title="Edit Post"
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() =>
                            deletePost(
                              post._id
                            )
                          }
                          style={
                            styles.iconButton
                          }
                          title="Delete Post"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div
                    style={styles.postContent}
                  >
                    {post.content}
                  </div>

                  {/* LIKE / COMMENT */}
                  <div
                    style={styles.postActions}
                  >
                    <button
                      onClick={() =>
                        handleLike(
                          post._id
                        )
                      }
                      disabled={
                        likingId ===
                        post._id
                      }
                      style={{
                        ...styles.likeButton,
                        color: liked
                          ? "#e11d48"
                          : "#555",
                      }}
                    >
                      {liked
                        ? "❤️"
                        : "🤍"}{" "}
                      {getLikeCount(post)}
                    </button>

                    <button
                      onClick={() => {
                        toggleComments(
                          post._id
                        );
                        setSelectedPost(
                          post._id
                        );
                      }}
                      style={
                        styles.commentButton
                      }
                    >
                      💬 {comments.length}
                    </button>
                  </div>

                  {/* COMMENTS */}
                  {openComments[
                    post._id
                  ] && (
                    <div
                      style={
                        styles.commentsSection
                      }
                    >
                      {comments.length > 0 ? (
                        comments.map(
                          (
                            comment,
                            index
                          ) => (
                            <div
                              key={
                                comment._id ||
                                index
                              }
                              style={
                                styles.comment
                              }
                            >
                              <div
                                style={
                                  styles.commentAvatar
                                }
                              >
                                {(
                                  comment.userName ||
                                  "U"
                                )
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>

                              <div
                                style={
                                  styles.commentBody
                                }
                              >
                                <strong>
                                  {comment.userName ||
                                    "User"}
                                </strong>

                                <p>
                                  {
                                    comment.text
                                  }
                                </p>

                                {comment._id && (
                                  <button
                                    onClick={() =>
                                      deleteComment(
                                        post._id,
                                        comment._id
                                      )
                                    }
                                    style={
                                      styles.deleteComment
                                    }
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <p
                          style={
                            styles.noComments
                          }
                        >
                          No comments yet.
                        </p>
                      )}

                      {/* ADD COMMENT */}
                      <div
                        style={
                          styles.commentInputRow
                        }
                      >
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={
                            selectedPost ===
                            post._id
                              ? commentText
                              : ""
                          }
                          onChange={(e) => {
                            setSelectedPost(
                              post._id
                            );

                            setCommentText(
                              e.target.value
                            );
                          }}
                          style={
                            styles.commentInput
                          }
                        />

                        <button
                          onClick={() =>
                            handleComment(
                              post._id
                            )
                          }
                          disabled={
                            commentingId ===
                            post._id
                          }
                          style={
                            styles.commentSend
                          }
                        >
                          {commentingId ===
                          post._id
                            ? "..."
                            : "Send"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    paddingBottom: "50px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    color: "#1f2937",
  },

  header: {
    background: "#ffffff",
    padding: "20px 6%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom:
      "1px solid #e5e7eb",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },

  logo: {
    margin: 0,
    fontSize: "25px",
    color: "#1d4ed8",
  },

  tagline: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  online: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: "#15803d",
    fontWeight: "600",
    fontSize: "14px",
  },

  onlineDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#22c55e",
    display: "inline-block",
  },

  welcomeCard: {
    width: "88%",
    maxWidth: "1100px",
    margin: "28px auto 18px",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow:
      "0 4px 18px rgba(0,0,0,0.06)",
  },

  avatar: {
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "23px",
    fontWeight: "bold",
  },

  welcomeTitle: {
    margin: 0,
    fontSize: "22px",
  },

  activeMember: {
    margin: "6px 0 0",
    color: "#16a34a",
    fontSize: "14px",
    fontWeight: "600",
  },

  createCard: {
    width: "88%",
    maxWidth: "1100px",
    margin: "0 auto 18px",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow:
      "0 4px 18px rgba(0,0,0,0.06)",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
  },

  sectionSubtitle: {
    color: "#6b7280",
    margin: "6px 0 15px",
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    boxSizing: "border-box",
    border:
      "1px solid #d1d5db",
    borderRadius: "12px",
    padding: "14px",
    resize: "vertical",
    outline: "none",
    fontSize: "15px",
    fontFamily: "inherit",
  },

  postBottom: {
    marginTop: "10px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "10px",
  },

  counter: {
    color: "#6b7280",
    fontSize: "13px",
  },

  buttonGroup: {
    display: "flex",
    gap: "10px",
  },

  postButton: {
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "10px 22px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "600",
  },

  cancelButton: {
    border:
      "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    padding: "10px 18px",
    borderRadius: "9px",
    cursor: "pointer",
  },

  searchCard: {
    width: "88%",
    maxWidth: "1100px",
    margin: "0 auto 22px",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxSizing: "border-box",
    boxShadow:
      "0 3px 12px rgba(0,0,0,0.05)",
  },

  searchIcon: {
    fontSize: "18px",
  },

  searchInput: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "15px",
  },

  feedSection: {
    width: "88%",
    maxWidth: "1100px",
    margin: "0 auto",
  },

  feedHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },

  feedTitle: {
    margin: 0,
    fontSize: "22px",
  },

  postCount: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  refreshButton: {
    border:
      "1px solid #d1d5db",
    background: "#ffffff",
    padding: "9px 15px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  emptyCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "50px 20px",
    textAlign: "center",
    boxShadow:
      "0 4px 18px rgba(0,0,0,0.05)",
  },

  emptyIcon: {
    fontSize: "45px",
  },

  loader: {
    fontSize: "35px",
  },

  postsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  postCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow:
      "0 4px 18px rgba(0,0,0,0.06)",
  },

  postHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  smallAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  userName: {
    display: "block",
    fontSize: "15px",
  },

  postDate: {
    marginTop: "3px",
    color: "#9ca3af",
    fontSize: "12px",
  },

  actionGroup: {
    display: "flex",
    gap: "5px",
  },

  iconButton: {
    border: "none",
    background: "#f3f4f6",
    borderRadius: "7px",
    padding: "7px",
    cursor: "pointer",
    fontSize: "15px",
  },

  postContent: {
    marginTop: "18px",
    fontSize: "16px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  },

  postActions: {
    display: "flex",
    gap: "18px",
    borderTop:
      "1px solid #f0f0f0",
    marginTop: "18px",
    paddingTop: "12px",
  },

  likeButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "14px",
  },

  commentButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#555",
    fontSize: "14px",
  },

  commentsSection: {
    marginTop: "14px",
    paddingTop: "14px",
    borderTop:
      "1px solid #eeeeee",
  },

  comment: {
    display: "flex",
    gap: "10px",
    marginBottom: "12px",
  },

  commentAvatar: {
    width: "32px",
    height: "32px",
    minWidth: "32px",
    borderRadius: "50%",
    background: "#ede9fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
  },

  commentBody: {
    background: "#f8fafc",
    padding: "8px 12px",
    borderRadius: "10px",
    flex: 1,
  },

  noComments: {
    color: "#9ca3af",
    fontSize: "14px",
  },

  deleteComment: {
    border: "none",
    background: "transparent",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "12px",
    padding: 0,
  },

  commentInputRow: {
    display: "flex",
    gap: "8px",
    marginTop: "12px",
  },

  commentInput: {
    flex: 1,
    border:
      "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "9px 12px",
    outline: "none",
  },

  commentSend: {
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "9px 16px",
    cursor: "pointer",
  },
};

export default Dashboard;