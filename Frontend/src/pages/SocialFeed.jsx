import { useState } from 'react';
import './SocialFeed.css';

const SocialFeed = () => {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' or 'stories'

  // Mock data for posts
  const [posts] = useState([
    {
      id: 1,
      user: { name: 'Nguyễn Văn A', avatar: '🌱', level: 8 },
      image: '🚴',
      description: 'Hôm nay đi xe đạp đi làm, vừa khỏe vừa bảo vệ môi trường! #sốngxanh',
      likes: 45,
      comments: 12,
      time: '2 giờ trước',
      verified: true
    },
    {
      id: 2,
      user: { name: 'Trần Thị B', avatar: '🌿', level: 5 },
      image: '☕',
      description: 'Mang cốc cá nhân đến quán cà phê - một hành động nhỏ nhưng ý nghĩa lớn!',
      likes: 38,
      comments: 8,
      time: '5 giờ trước',
      verified: true
    },
    {
      id: 3,
      user: { name: 'Lê Văn C', avatar: '🌳', level: 12 },
      image: '🌳',
      description: 'Trồng thêm một cây xanh trong vườn nhà. Mỗi cây xanh là một món quà cho tương lai!',
      likes: 67,
      comments: 15,
      time: '1 ngày trước',
      verified: true
    },
    {
      id: 4,
      user: { name: 'Phạm Thị D', avatar: '♻️', level: 6 },
      image: '♻️',
      description: 'Phân loại rác tại nhà - bước đầu tiên để bảo vệ môi trường!',
      likes: 52,
      comments: 10,
      time: '1 ngày trước',
      verified: true
    }
  ]);

  // Mock data for stories
  const stories = [
    { id: 1, user: { name: 'Nguyễn Văn A', avatar: '🌱' }, image: '🚴' },
    { id: 2, user: { name: 'Trần Thị B', avatar: '🌿' }, image: '☕' },
    { id: 3, user: { name: 'Lê Văn C', avatar: '🌳' }, image: '🌳' },
    { id: 4, user: { name: 'Phạm Thị D', avatar: '♻️' }, image: '♻️' }
  ];

  const [likedPosts, setLikedPosts] = useState(new Set());

  const handleLike = (postId) => {
    const newLiked = new Set(likedPosts);
    if (newLiked.has(postId)) {
      newLiked.delete(postId);
    } else {
      newLiked.add(postId);
    }
    setLikedPosts(newLiked);
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
          {posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-user">
                  {post.user.avatarImage ? (
                <img src={post.user.avatarImage} alt={post.user.name} className="user-avatar-image" />
              ) : (
                <div className="user-avatar">{post.user.avatar}</div>
              )}
                  <div className="user-info">
                    <div className="user-name">
                      {post.user.name}
                      {post.verified && <span className="verified-badge">✓</span>}
                    </div>
                    <div className="user-level">Level {post.user.level} • {post.time}</div>
                  </div>
                </div>
              </div>

              <div className="post-image">{post.image}</div>

              <div className="post-content">
                <p className="post-description">{post.description}</p>

                <div className="post-actions">
                  <button
                    className={`action-btn like-btn ${likedPosts.has(post.id) ? 'liked' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    ❤️ {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                  </button>
                  <button className="action-btn">
                    💬 {post.comments}
                  </button>
                  <button className="action-btn">
                    🔗 Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialFeed;

