import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApprovedPostsApi } from '../api/postsApi';
import { toggleLikeApi } from '../api/likesApi';
import { createCommentApi, deleteCommentApi } from '../api/commentsApi';
import './SocialFeed.css';

const SocialFeed = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' or 'stories'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({}); // postId -> comment text
  const [expandedComments, setExpandedComments] = useState(new Set()); // postIds with expanded comments

  // Load approved posts from backend
  useEffect(() => {
    loadPosts();
  }, []);

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Vừa xong';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Vừa xong';
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN');
    } catch {
      return 'Vừa xong';
    }
  };

  // Calculate level from streak (simple formula)
  const calculateLevel = (streak) => {
    return Math.floor(streak / 5) + 1;
  };

  // Mock data for stories (tạm thời dùng posts đã approved)
  const stories = posts.slice(0, 4).map(post => ({
    id: post.id,
    user: { 
      name: post.userName || 'Người dùng', 
      avatar: post.userAvatar || '🌱',
      avatarImage: post.userAvatarImage || null
    },
    image: post.imageUrl || '🌱'
  }));

  const handleLike = async (postId) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để thích bài viết');
      return;
    }

    try {
      const response = await toggleLikeApi(postId);
      if (response.success) {
        // Reload posts to get updated like count
        await loadPosts();
      } else {
        alert(response.message || 'Không thể thực hiện thao tác thích');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert(error.message || 'Có lỗi xảy ra khi thích bài viết');
    }
  };

  const handleComment = async (postId) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }

    const commentText = commentInputs[postId]?.trim();
    if (!commentText) {
      alert('Vui lòng nhập nội dung bình luận');
      return;
    }

    try {
      const response = await createCommentApi(postId, commentText);
      if (response.success) {
        // Clear comment input
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        // Reload posts to get updated comments
        await loadPosts();
      } else {
        alert(response.message || 'Không thể thêm bình luận');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert(error.message || 'Có lỗi xảy ra khi thêm bình luận');
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
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
      } else {
        alert(response.message || 'Không thể xóa bình luận');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert(error.message || 'Có lỗi xảy ra khi xóa bình luận');
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

      <div className="social-tabs">
        <button
          className={activeTab === 'feed' ? 'active' : ''}
          onClick={() => setActiveTab('feed')}
        >
          📰 Feed
        </button>
        <button
          className={activeTab === 'stories' ? 'active' : ''}
          onClick={() => setActiveTab('stories')}
        >
          📸 Stories
        </button>
      </div>

      {activeTab === 'stories' && (
        <div className="stories-section">
          <div className="stories-container">
            {stories.map(story => (
              <div key={story.id} className="story-item">
                {story.user.avatarImage ? (
              <img src={story.user.avatarImage} alt={story.user.name} className="story-avatar-image" />
            ) : (
              <div className="story-avatar">{story.user.avatar}</div>
            )}
                <div className="story-content">{story.image}</div>
                <div className="story-name">{story.user.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'feed' && (
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
                    </div>
                  ) : (
                    <div className="post-image">🌱</div>
                  )}

                  <div className="post-content">
                    <h3 className="post-title">{post.title || 'Hành động xanh'}</h3>
                    <p className="post-description">{post.content || post.description || ''}</p>
                    {post.awardedPoints > 0 && (
                      <div className="post-reward">
                        🪙 +{post.awardedPoints} điểm
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
                            post.comments.map(comment => (
                              <div key={comment.id || comment.Id} className="comment-item">
                                <div className="comment-content">
                                  <strong className="comment-author">
                                    {comment.userName || comment.UserName || 'Người dùng'}
                                  </strong>
                                  <span className="comment-text">{comment.content || comment.Content}</span>
                                </div>
                                <div className="comment-footer">
                                  <span className="comment-time">
                                    {formatTimeAgo(comment.createdAt || comment.CreatedAt)}
                                  </span>
                                  {isAuthenticated && user && (comment.userId === user.id || comment.UserId === user.id) && (
                                    <button
                                      className="comment-delete-btn"
                                      onClick={() => handleDeleteComment(comment.id || comment.Id, post.id)}
                                    >
                                      Xóa
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="no-comments">Chưa có bình luận nào</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SocialFeed;

