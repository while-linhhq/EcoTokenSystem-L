import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApprovedPostsApi } from '../api/postsApi';
import { toggleLikeApi } from '../api/likesApi';
import { createCommentApi, deleteCommentApi } from '../api/commentsApi';
import { getStoriesApi } from '../api/storiesApi';
import { formatTimeAgo } from '../utils/dateUtils';
import { showSuccess, showError } from '../utils/toast';
import { Plus } from 'lucide-react';
import StoryCircle from '../components/Stories/StoryCircle';
import StoryUpload from '../components/Stories/StoryUpload';
import StoryViewer from '../components/Stories/StoryViewer';
import './SocialFeed.css';

const SocialFeed = () => {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({}); // postId -> comment text
  const [expandedComments, setExpandedComments] = useState(new Set()); // postIds with expanded comments

  // Stories state
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Load approved posts from backend
  useEffect(() => {
    loadPosts();
    loadStories();
  }, []);

  // Load stories from backend
  const loadStories = async () => {
    try {
      setStoriesLoading(true);
      const response = await getStoriesApi();

      if (response.success && response.data) {
        // Group stories by user
        const groupedStories = {};
        response.data.forEach(story => {
          const userId = story.userId;
          if (!groupedStories[userId]) {
            groupedStories[userId] = [];
          }
          groupedStories[userId].push(story);
        });

        // Convert to array of user stories
        const storiesArray = Object.values(groupedStories);

        // Sort: current user first, then by most recent story
        storiesArray.sort((a, b) => {
          const aHasCurrentUser = a[0].userId === user?.id;
          const bHasCurrentUser = b[0].userId === user?.id;

          if (aHasCurrentUser && !bHasCurrentUser) return -1;
          if (!aHasCurrentUser && bHasCurrentUser) return 1;

          // Sort by most recent story
          const aLatest = new Date(a[0].createdAt);
          const bLatest = new Date(b[0].createdAt);
          return bLatest - aLatest;
        });

        setStories(storiesArray);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setStoriesLoading(false);
    }
  };

  // Story handlers
  const handleStoryClick = (_userStories, userId) => {
    setSelectedUserId(userId);
    setShowStoryViewer(true);
  };

  const handleStoryUploadSuccess = () => {
    loadStories(); // Reload stories
  };

  const handleStoryDeleted = () => {
    loadStories(); // Reload stories
  };

  const handleLike = async (postId) => {
    if (!isAuthenticated) {
      showError('Vui lòng đăng nhập để thích bài viết');
      return;
    }

    try {
      const response = await toggleLikeApi(postId);
      if (response.success) {
        // Reload posts to get updated like count
        await loadPosts();
      } else {
        showError(response.message || 'Không thể thực hiện thao tác thích');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      showError(error.message || 'Có lỗi xảy ra khi thích bài viết');
    }
  };

  const handleComment = async (postId) => {
    if (!isAuthenticated) {
      showError('Vui lòng đăng nhập để bình luận');
      return;
    }

    const commentText = commentInputs[postId]?.trim();
    if (!commentText) {
      showError('Vui lòng nhập nội dung bình luận');
      return;
    }

    try {
      const response = await createCommentApi(postId, commentText);
      if (response.success) {
        // Clear comment input
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        // Reload posts to get updated comments
        await loadPosts();
        showSuccess('Đã thêm bình luận');
      } else {
        showError(response.message || 'Không thể thêm bình luận');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      showError(error.message || 'Có lỗi xảy ra khi thêm bình luận');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!isAuthenticated) {
      return;
    }

    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) {
      return;
    }

    try {
      const response = await deleteCommentApi(commentId);
      if (response.success) {
        // Reload posts to get updated comments
        await loadPosts();
        showSuccess('Đã xóa bình luận');
      } else {
        showError(response.message || 'Không thể xóa bình luận');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      showError(error.message || 'Có lỗi xảy ra khi xóa bình luận');
    }
  };

  const toggleComments = (postId) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      console.log('[SocialFeed] ===== Loading approved posts =====');

      // Test API trực tiếp để kiểm tra
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5109/api';
      console.log('[SocialFeed] Testing API directly:', `${API_BASE_URL}/Post?statusId=2`);

      try {
        const testResponse = await fetch(`${API_BASE_URL}/Post?statusId=2`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('[SocialFeed] Direct API test response:', {
          status: testResponse.status,
          statusText: testResponse.statusText,
          ok: testResponse.ok,
          contentType: testResponse.headers.get('content-type')
        });

        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('[SocialFeed] Direct API test data:', {
            IsSuccess: testData.IsSuccess,
            Message: testData.Message,
            DataType: typeof testData.Data,
            IsDataArray: Array.isArray(testData.Data),
            DataLength: Array.isArray(testData.Data) ? testData.Data.length : 'N/A',
            SampleData: testData.Data && Array.isArray(testData.Data) && testData.Data.length > 0
              ? {
                  Id: testData.Data[0].Id,
                  Title: testData.Data[0].Title,
                  StatusId: testData.Data[0].StatusId,
                  UserName: testData.Data[0].UserName,
                  ImageUrl: testData.Data[0].ImageUrl
                }
              : 'No data'
          });
        } else {
          console.error('[SocialFeed] Direct API test failed:', testResponse.status, testResponse.statusText);
        }
      } catch (testError) {
        console.error('[SocialFeed] Direct API test error:', testError);
      }

      // Gọi API qua wrapper
      const postsResponse = await getApprovedPostsApi();

      console.log('[SocialFeed] Wrapper API Response:', {
        success: postsResponse.success,
        message: postsResponse.message,
        dataLength: postsResponse.data?.length || 0,
        dataType: Array.isArray(postsResponse.data) ? 'array' : typeof postsResponse.data
      });

      if (postsResponse.success && postsResponse.data) {
        const postsArray = Array.isArray(postsResponse.data) ? postsResponse.data : [];

        if (postsArray.length === 0) {
          console.warn('[SocialFeed] ===== No posts found =====');
          console.warn('[SocialFeed] This could mean:');
          console.warn('[SocialFeed] 1. No posts with StatusId = 2 in database');
          console.warn('[SocialFeed] 2. API returned empty array');
          console.warn('[SocialFeed] 3. Data mapping issue');
          setPosts([]);
          return;
        }

        // Log sample post để debug
        console.log('[SocialFeed] Sample post:', {
          id: postsArray[0].id,
          title: postsArray[0].title,
          userName: postsArray[0].userName,
          imageUrl: postsArray[0].imageUrl,
          status: postsArray[0].status,
          statusId: postsArray[0].statusId,
          approvedRejectedAt: postsArray[0].approvedRejectedAt
        });

        // Sắp xếp posts theo thời gian approve (mới nhất trước)
        const sortedPosts = [...postsArray].sort((a, b) => {
          const dateA = new Date(a.approvedRejectedAt || a.submittedAt || 0);
          const dateB = new Date(b.approvedRejectedAt || b.submittedAt || 0);
          return dateB - dateA; // Mới nhất trước
        });

        console.log('[SocialFeed] ===== Success =====');
        console.log('[SocialFeed] Loaded and sorted posts:', sortedPosts.length);
        setPosts(sortedPosts);
      } else {
        console.error('[SocialFeed] ===== Failed =====');
        console.error('[SocialFeed] Failed to load posts:', postsResponse.message);
        setPosts([]);
      }
    } catch (error) {
      console.error('[SocialFeed] ===== Error =====');
      console.error('[SocialFeed] Error loading posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="social-container">
      <div className="social-header">
        <h1>🌍 Cộng đồng sống xanh</h1>
        <p>Cùng nhau trao đổi và truyền cảm hứng sống xanh</p>
      </div>


      {/* Stories Section - shown above feed */}
      <div className="stories-container">
        <div className="stories-header">
          <h3>Stories</h3>
          {isAuthenticated && (
            <button
              className="stories-add-btn"
              onClick={() => setShowStoryUpload(true)}
            >
              <Plus size={16} />
              Tạo Story
            </button>
          )}
        </div>
        <div className="stories-list">
          {storiesLoading ? (
            <div className="stories-empty">Đang tải Stories...</div>
          ) : stories.length > 0 ? (
            stories.map((userStories, index) => (
              <StoryCircle
                key={index}
                userStories={userStories}
                currentUserId={user?.id}
                onClick={handleStoryClick}
              />
            ))
          ) : (
            <div className="stories-empty">Chưa có Story nào</div>
          )}
        </div>
      </div>

      {/* Feed Section */}
      <div className="feed-section">
          {loading ? (
            <div className="loading-state">
              <p>Đang tải bài đăng...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📰</div>
              <p>Chưa có bài đăng nào được duyệt</p>
              <p className="empty-hint">Hãy là người đầu tiên chia sẻ hành động sống xanh của bạn!</p>
            </div>
          ) : (
            posts.map(post => {
              // Sử dụng thông tin user từ post response (PostsDTO đã có UserName, UserAvatar, UserAvatarImage)
              const userName = post.userName || 'Người dùng';
              const userAvatar = post.userAvatar || '🌱';
              const userAvatarImage = post.userAvatarImage || null;
              const timeAgo = formatTimeAgo(post.approvedRejectedAt || post.submittedAt);

              return (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-user">
                      {/* Avatar - ưu tiên image, fallback về emoji */}
                      <div className="user-avatar-wrapper">
                        {userAvatarImage ? (
                          <img
                            src={userAvatarImage}
                            alt={userName}
                            className="user-avatar-image"
                            onError={(e) => {
                              // Fallback về emoji nếu image load lỗi
                              e.target.style.display = 'none';
                              const emojiAvatar = e.target.parentElement.querySelector('.user-avatar');
                              if (emojiAvatar) {
                                emojiAvatar.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className="user-avatar"
                          style={{ display: userAvatarImage ? 'none' : 'flex' }}
                        >
                          {userAvatar}
                        </div>
                      </div>
                      <div className="user-info">
                        <div className="user-name">
                          {userName || 'Người dùng'}
                          {post.status === 'approved' && <span className="verified-badge">✓</span>}
                        </div>
                        <div className="user-level">{timeAgo}</div>
                      </div>
                    </div>
                  </div>

                  {post.imageUrl ? (
                    <div className="post-image-container">
                      <img src={post.imageUrl} alt={post.title || 'Bài đăng'} className="post-image-real" />
                      <div className="post-image-overlay">
                        <div className="post-content-overlay">
                          <h3 className="post-title">{post.title || 'Hành động xanh'}</h3>
                          {(post.content || post.description) && (
                            <p className="post-description">{post.content || post.description}</p>
                          )}
                          {post.awardedPoints > 0 && (
                            <div className="post-reward">
                              🪙 +{post.awardedPoints} điểm
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="post-image">
                      <div className="post-content-overlay">
                        <h3 className="post-title">{post.title || 'Hành động xanh'}</h3>
                        {(post.content || post.description) && (
                          <p className="post-description">{post.content || post.description}</p>
                        )}
                        {post.awardedPoints > 0 && (
                          <div className="post-reward">
                            🪙 +{post.awardedPoints} điểm
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="post-actions">
                    <button
                      className={`action-btn like-btn ${post.isLikedByCurrentUser ? 'liked' : ''}`}
                      onClick={() => handleLike(post.id)}
                      disabled={!isAuthenticated}
                    >
                      {post.isLikedByCurrentUser ? '❤️' : '🤍'} {post.likesCount || 0}
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => toggleComments(post.id)}
                    >
                      💬 {post.comments?.length || 0}
                    </button>
                    <button className="action-btn">
                      🔗 Chia sẻ
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments.has(post.id) && (
                    <div className="comments-section">
                        {/* Comment Input */}
                        {isAuthenticated && (
                          <div className="comment-input-container">
                            <input
                              type="text"
                              placeholder="Viết bình luận..."
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleComment(post.id);
                                }
                              }}
                              className="comment-input"
                            />
                            <button
                              onClick={() => handleComment(post.id)}
                              className="comment-submit-btn"
                            >
                              Gửi
                            </button>
                          </div>
                        )}

                        {/* Comments List */}
                        <div className="comments-list">
                          {post.comments && post.comments.length > 0 ? (
                            post.comments.map(comment => {
                              const commentUserName = comment.userName || comment.UserName || 'Người dùng';
                              const commentUserAvatar = comment.userAvatar || comment.UserAvatar || '🌱';
                              const commentUserAvatarImage = comment.userAvatarImage || comment.UserAvatarImage || null;
                              return (
                                <div key={comment.id || comment.Id} className="comment-item">
                                  <div className="comment-avatar">
                                    {commentUserAvatarImage ? (
                                      <img
                                        src={commentUserAvatarImage}
                                        alt={commentUserName}
                                        className="comment-avatar-image"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          const fallback = e.target.nextSibling;
                                          if (fallback) fallback.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <span style={{ display: commentUserAvatarImage ? 'none' : 'flex' }}>
                                      {commentUserAvatar}
                                    </span>
                                  </div>
                                  <div className="comment-content">
                                    <strong className="comment-author">
                                      {commentUserName}
                                    </strong>
                                    <span className="comment-text">{comment.content || comment.Content}</span>
                                    <div className="comment-footer">
                                      <span className="comment-time">
                                        {formatTimeAgo(comment.createdAt || comment.CreatedAt)}
                                      </span>
                                      {isAuthenticated && user && (comment.userId === user.id || comment.UserId === user.id) && (
                                        <button
                                          className="comment-delete-btn"
                                          onClick={() => handleDeleteComment(comment.id || comment.Id)}
                                        >
                                          Xóa
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="no-comments">Chưa có bình luận nào</div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              );
            })
          )}
        </div>

      {/* Story Upload Modal */}
      <StoryUpload
        isOpen={showStoryUpload}
        onClose={() => setShowStoryUpload(false)}
        onUploadSuccess={handleStoryUploadSuccess}
        currentUserId={user?.id}
      />

      {/* Story Viewer Modal */}
      {showStoryViewer && (
        <StoryViewer
          allStories={stories}
          initialUserId={selectedUserId}
          currentUserId={user?.id}
          onClose={() => setShowStoryViewer(false)}
          onStoryDeleted={handleStoryDeleted}
        />
      )}
    </div>
  );
};

export default SocialFeed;

