import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { useUsers } from '../context/UsersContext';
import { getAllItemsApi, addItemApi, updateItemApi, deleteItemApi } from '../api/itemsAdminApi';
import { getAllExchangesApi, updateShippedStatusApi } from '../api/adminExchangesApi';
import { formatDate } from '../utils/dateUtils';
import { UserPlus, Package, Users, Gift, ShoppingCart } from 'lucide-react';
import './Admin.css';

const Admin = () => {
  const { user } = useAuth();
  const { config, updateStreakMilestone, updateActionReward, updateDefaultActionReward, deleteStreakMilestone, deleteActionReward } = useConfig();
  const { createModerator, updateUser, deleteUser, loadAllUsers, allUsers } = useUsers();
  const [activeTab, setActiveTab] = useState('moderators');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Moderator creation form
  const [modEmail, setModEmail] = useState('');
  const [modPassword, setModPassword] = useState('');
  const [modNickname, setModNickname] = useState('');
  const [modRole, setModRole] = useState('moderator'); // 'user' hoặc 'moderator'

  // Items management
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    requiredPoints: '',
    tag: 'handmade',
    imageFile: null
  });

  const categories = ['all', 'handmade', 'vouchers', 'books', 'movies', 'donations'];

  // Rewards sub-tab
  const [rewardsSubTab, setRewardsSubTab] = useState('streaks'); // 'streaks' or 'actions'

  // Exchanges management
  const [exchanges, setExchanges] = useState([]);
  const [filteredExchanges, setFilteredExchanges] = useState([]);
  const [exchangeDateFilter, setExchangeDateFilter] = useState('');
  const [exchangeShippedFilter, setExchangeShippedFilter] = useState('all'); // 'all', 'shipped', 'not_shipped'

  // Streak milestone modal
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showDeleteStreakModal, setShowDeleteStreakModal] = useState(false);
  const [streakToDelete, setStreakToDelete] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditingStreak, setIsEditingStreak] = useState(false);
  const [streakForm, setStreakForm] = useState({
    streak: '',
    color: '#FFD700',
    emoji: '🌟',
    name: ''
  });

  // Danh sách emoji linh vật để admin chọn
  const mascotEmojis = [
    '🌱', '🌿', '🍃', '🌳', '🌲', '🌴', '🌵', '🌾',
    '🦋', '🐢', '🦎', '🐸', '🐍', '🦜', '🦅', '🦉',
    '🐼', '🐨', '🦁', '🐯', '🐻', '🐰', '🦊', '🐺',
    '🐬', '🐳', '🦈', '🐙', '🦑', '🦀', '🦐', '🐠',
    '🌟', '⭐', '✨', '💫', '🌙', '☀️', '🌈', '🔥',
    '💚', '💙', '💛', '🧡', '❤️', '💜', '🤍', '🖤',
    '🌍', '🌎', '🌏', '🗺️', '🏔️', '⛰️', '🌊', '🏞️'
  ];

  // Action reward modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDeleteActionModal, setShowDeleteActionModal] = useState(false);
  const [actionToDelete, setActionToDelete] = useState(null);
  const [isEditingDefault, setIsEditingDefault] = useState(false);
  const [actionForm, setActionForm] = useState({
    streakMilestone: '',
    bonusTokens: ''
  });

  const [filteredUsers, setFilteredUsers] = useState([]);

  // Load items
  useEffect(() => {
    const loadItems = async () => {
      // Load items khi vào tab items
      if (activeTab === 'items') {
        try {
          const response = await getAllItemsApi();
          if (response.success) {
            setItems(response.data || []);
          } else {
            console.error('[Admin] Failed to load items:', response.message);
            setItems([]);
          }
        } catch (error) {
          console.error('[Admin] Error loading items:', error);
          setItems([]);
        }
      }
    };
    loadItems();
  }, [activeTab]);

  // Load users when entering users tab
  useEffect(() => {
    if (activeTab === 'users') {
      loadAllUsers();
    }
  }, [activeTab, loadAllUsers]);

  // Filter users based on search term (using allUsers from context)
  useEffect(() => {
    if (activeTab === 'users') {
      if (!searchTerm) {
        // No search term, show all users
        setFilteredUsers(allUsers || []);
      } else {
        // Filter users based on search term
        const term = searchTerm.toLowerCase();
        const filtered = (allUsers || []).filter(user =>
          user.username?.toLowerCase().includes(term) ||
          user.name?.toLowerCase().includes(term) ||
          user.nickname?.toLowerCase().includes(term) ||
          user.phone?.toLowerCase().includes(term) ||
          user.phoneNumber?.toLowerCase().includes(term)
        );
        setFilteredUsers(filtered);
      }
    }
  }, [searchTerm, allUsers, activeTab]);

  // Load exchanges when entering exchanges tab
  useEffect(() => {
    if (activeTab === 'exchanges') {
      loadExchanges();
    }
  }, [activeTab]);

  // Filter exchanges
  useEffect(() => {
    if (activeTab === 'exchanges') {
      let filtered = [...exchanges];

      // Filter by date
      if (exchangeDateFilter) {
        const filterDate = new Date(exchangeDateFilter);
        filterDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);

        filtered = filtered.filter(exchange => {
          const exchangeDate = new Date(exchange.exchangedAt);
          exchangeDate.setHours(0, 0, 0, 0);
          return exchangeDate >= filterDate && exchangeDate < nextDay;
        });
      }

      // Filter by shipped status
      if (exchangeShippedFilter === 'shipped') {
        filtered = filtered.filter(exchange => exchange.isShipped);
      } else if (exchangeShippedFilter === 'not_shipped') {
        filtered = filtered.filter(exchange => !exchange.isShipped);
      }

      setFilteredExchanges(filtered);
    }
  }, [exchanges, exchangeDateFilter, exchangeShippedFilter, activeTab]);

  const loadExchanges = async () => {
    try {
      console.log('[Admin] Loading exchanges...');
      const response = await getAllExchangesApi();
      console.log('[Admin] Exchanges response:', {
        success: response.success,
        dataLength: response.data?.length || 0,
        message: response.message
      });
      if (response.success) {
        setExchanges(response.data || []);
        console.log('[Admin] Exchanges loaded:', response.data?.length || 0);
      } else {
        console.error('[Admin] Failed to load exchanges:', response.message);
        setExchanges([]);
      }
    } catch (error) {
      console.error('[Admin] Error loading exchanges:', error);
      setExchanges([]);
    }
  };

  const handleToggleShipped = async (exchangeId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const response = await updateShippedStatusApi(exchangeId, newStatus);
      if (response.success) {
        // Update local state
        setExchanges(prev => prev.map(ex =>
          ex.id === exchangeId ? { ...ex, isShipped: newStatus } : ex
        ));
      } else {
        alert(response.message || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.error('[Admin] Error updating shipped status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleCreateModerator = async (e) => {
    e.preventDefault();
    if (!modEmail || !modPassword || !modNickname) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Validate password length
    if (modPassword.length < 8) {
      alert('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    try {
      // Backend chỉ cần username và password
      // Username có thể là email hoặc nickname
      console.log('[Admin] Creating user:', { username: modEmail, role: modRole, roleId: modRole === 'moderator' ? 3 : 1 });

      const result = await createModerator({
        username: modEmail, // Dùng email làm username
        password: modPassword,
        nickname: modNickname,
        role: modRole, // 'user' hoặc 'moderator'
        roleId: modRole === 'moderator' ? 3 : 1
      });

      console.log('[Admin] Create result:', result);

      if (result && result.success) {
        alert(result.message || `Đã tạo tài khoản thành công: ${modNickname}`);
        setModEmail('');
        setModPassword('');
        setModNickname('');
        await loadAllUsers();
      } else {
        // Hiển thị error message chi tiết
        const errorMsg = result?.message || 'Có lỗi xảy ra khi tạo tài khoản';
        console.error('[Admin] Create failed:', {
          result: result,
          errorMsg: errorMsg,
          fullError: JSON.stringify(result, null, 2)
        });

        // Hiển thị alert với message chi tiết
        alert(`❌ ${errorMsg}\n\nVui lòng kiểm tra:\n1. Migration đã chạy chưa (RoleId=3)\n2. Username đã tồn tại chưa\n3. Password >= 8 ký tự\n4. Backend logs để xem chi tiết`);
      }
    } catch (error) {
      console.error('[Admin] Error creating moderator:', {
        error: error,
        message: error.message,
        stack: error.stack
      });
      alert(`❌ Lỗi: ${error.message || 'Có lỗi xảy ra khi tạo tài khoản'}\n\nVui lòng mở Console (F12) để xem chi tiết.`);
    }
  };


  const handleEditUser = (user) => {
    setSelectedUser(user);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    // Map frontend data sang backend format
    const updateData = {
      name: selectedUser.name || selectedUser.nickname || null,
      email: selectedUser.email || null,
      phoneNumber: selectedUser.phone || selectedUser.phoneNumber || null,
      address: selectedUser.address || null,
      gender: selectedUser.gender || null,
      currentPoints: selectedUser.currentPoints ?? selectedUser.ecoTokens ?? null,
      streak: selectedUser.streak ?? null,
    };

    // Remove null values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null) {
        delete updateData[key];
      }
    });

    const result = await updateUser(selectedUser.id, updateData);
    if (result.success) {
      alert(result.message || 'Đã cập nhật thông tin user');
      setSelectedUser(null);
      await loadAllUsers();
    } else {
      alert(result.message || 'Có lỗi xảy ra khi cập nhật user');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa user "${username}"?\n\nLưu ý: Hành động này không thể hoàn tác.`)) {
      return;
    }

    const result = await deleteUser(userId);
    if (result.success) {
      alert(result.message || 'Đã xóa user thành công');
      await loadAllUsers();
    } else {
      alert(result.message || 'Có lỗi xảy ra khi xóa user');
    }
  };

  // Item Modal Handlers
  const handleOpenAddItemModal = () => {
    setSelectedItem(null);
    setItemForm({ name: '', requiredPoints: '', tag: 'handmade', imageFile: null });
    setShowItemModal(true);
  };

  const handleOpenEditItemModal = (item) => {
    setSelectedItem(item);
    setItemForm({
      name: item.name,
      requiredPoints: item.requiredPoints || item.price || '',
      tag: item.tag || item.category || 'handmade',
      imageFile: null
    });
    setShowItemModal(true);
  };

  const handleCloseItemModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
    setItemForm({ name: '', requiredPoints: '', tag: 'handmade', imageFile: null });
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        // Update
        const result = await updateItemApi(selectedItem.id, {
          name: itemForm.name,
          requiredPoints: parseInt(itemForm.requiredPoints),
          tag: itemForm.tag,
          imageFile: itemForm.imageFile
        });
        if (result.success) {
          alert(result.message);
          handleCloseItemModal();
          // Reload items
          const response = await getAllItemsApi();
          if (response.success) setItems(response.data || []);
        } else {
          alert(result.message);
        }
      } else {
        // Add
        const result = await addItemApi({
          name: itemForm.name,
          requiredPoints: parseInt(itemForm.requiredPoints),
          tag: itemForm.tag,
          imageFile: itemForm.imageFile
        });
        if (result.success) {
          alert(result.message);
          handleCloseItemModal();
          // Reload items
          const response = await getAllItemsApi();
          if (response.success) setItems(response.data || []);
        } else {
          alert(result.message);
        }
      }
    } catch (error) {
      console.error('[Admin] Error submitting item:', error);
      alert('Có lỗi xảy ra: ' + (error.message || 'Không xác định'));
    }
  };

  const handleOpenDeleteModal = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const result = await deleteItemApi(itemToDelete.id);
      if (result.success) {
        alert(result.message);
        handleCloseDeleteModal();
        // Reload items
        const response = await getAllItemsApi();
        if (response.success) setItems(response.data || []);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('[Admin] Error deleting item:', error);
      alert('Có lỗi xảy ra: ' + (error.message || 'Không xác định'));
    }
  };

  // Streak Milestone Handlers
  const handleOpenAddStreakModal = () => {
    setIsEditingStreak(false);
    setStreakForm({ streak: '', color: '#FFD700', emoji: '🌟', name: '' });
    setShowStreakModal(true);
  };

  const handleOpenEditStreakModal = (streakValue, milestone) => {
    setIsEditingStreak(true);
    setStreakForm({
      streak: streakValue.toString(),
      color: milestone.color || '#FFD700',
      emoji: milestone.emoji || '🌟',
      name: milestone.name || ''
    });
    setShowStreakModal(true);
  };

  const handleCloseStreakModal = () => {
    setShowStreakModal(false);
    setShowEmojiPicker(false);
    setIsEditingStreak(false);
    setStreakForm({ streak: '', color: '#FFD700', emoji: '🌟', name: '' });
  };

  const handleSubmitStreak = async (e) => {
    e.preventDefault();
    if (!streakForm.streak || !streakForm.name || !streakForm.emoji) {
      alert('Vui lòng điền đầy đủ thông tin (số ngày, tên linh vật, và chọn emoji)');
      return;
    }

    const streakValue = parseInt(streakForm.streak);
    if (isNaN(streakValue) || streakValue < 1) {
      alert('Số ngày streak phải là số nguyên dương');
      return;
    }

    try {
      const result = await updateStreakMilestone(streakValue.toString(), {
        color: streakForm.color,
        emoji: streakForm.emoji,
        name: streakForm.name
      });
      if (result.success) {
        alert(result.message || (isEditingStreak
          ? `Đã cập nhật milestone streak ${streakForm.streak}`
          : `Đã thêm milestone streak ${streakForm.streak}`));
        handleCloseStreakModal();
      } else {
        alert(result.message || (isEditingStreak
          ? 'Có lỗi xảy ra khi cập nhật milestone'
          : 'Có lỗi xảy ra khi thêm milestone'));
      }
    } catch (error) {
      console.error('[Admin] Error submitting streak:', error);
      alert('Có lỗi xảy ra: ' + (error.message || 'Không xác định'));
    }
  };

  // Đóng emoji picker khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleOpenDeleteStreakModal = (streakValue) => {
    setStreakToDelete(streakValue);
    setShowDeleteStreakModal(true);
  };

  const handleCloseDeleteStreakModal = () => {
    setShowDeleteStreakModal(false);
    setStreakToDelete(null);
  };

  const handleConfirmDeleteStreak = async () => {
    if (!streakToDelete) return;

    try {
      const result = await deleteStreakMilestone(streakToDelete);
      if (result.success) {
        alert(result.message || 'Đã xóa milestone thành công');
        handleCloseDeleteStreakModal();
      } else {
        alert(result.message || 'Có lỗi xảy ra khi xóa milestone');
      }
    } catch (error) {
      console.error('[Admin] Error deleting streak:', error);
      alert('Có lỗi xảy ra: ' + (error.message || 'Không xác định'));
    }
  };

  // Action Reward Handlers
  const handleOpenAddActionModal = () => {
    setIsEditingDefault(false);
    setActionForm({ streakMilestone: '', bonusTokens: '' });
    setShowActionModal(true);
  };

  const handleOpenEditDefaultModal = () => {
    setIsEditingDefault(true);
    setActionForm({
      streakMilestone: '',
      bonusTokens: ''
    });
    setShowActionModal(true);
  };

  const handleOpenEditActionModal = (streakMilestone, bonusTokens) => {
    setIsEditingDefault(false);
    setActionForm({
      streakMilestone: streakMilestone,
      bonusTokens: bonusTokens.toString()
    });
    setShowActionModal(true);
  };

  const handleCloseActionModal = () => {
    setShowActionModal(false);
    setIsEditingDefault(false);
    setActionForm({ streakMilestone: '', bonusTokens: '' });
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();

    // Nếu đang edit default reward
    if (isEditingDefault) {
      try {
        const result = await updateDefaultActionReward({
          streak: parseInt(config.actionRewards?.default?.streak || 1),
          ecoTokens: parseInt(config.actionRewards?.default?.ecoTokens || 10)
        });
        if (result.success) {
          alert(result.message || 'Đã cập nhật phần thưởng mặc định');
          handleCloseActionModal();
        } else {
          alert(result.message || 'Có lỗi xảy ra khi cập nhật phần thưởng mặc định');
        }
      } catch (error) {
        console.error('[Admin] Error submitting default reward:', error);
        alert('Có lỗi xảy ra: ' + (error.message || 'Không xác định'));
      }
      return;
    }

    // Nếu đang add/edit action reward milestone
    if (!actionForm.streakMilestone || !actionForm.bonusTokens) {
      alert('Vui lòng nhập đầy đủ streak milestone và bonus tokens');
      return;
    }
    const streakMilestone = actionForm.streakMilestone.trim();
    const bonusTokens = parseInt(actionForm.bonusTokens);
    if (isNaN(bonusTokens) || bonusTokens < 0) {
      alert('Bonus tokens phải là số nguyên dương');
      return;
    }
    try {
      const result = await updateActionReward(streakMilestone, bonusTokens);
      if (result.success) {
        alert(result.message || 'Đã cập nhật phần thưởng milestone');
        handleCloseActionModal();
      } else {
        alert(result.message || 'Có lỗi xảy ra khi cập nhật phần thưởng milestone');
      }
    } catch (error) {
      console.error('[Admin] Error submitting action milestone:', error);
      alert('Có lỗi xảy ra: ' + (error.message || 'Không xác định'));
    }
  };

  const handleOpenDeleteActionModal = (streakMilestone) => {
    setActionToDelete(streakMilestone);
    setShowDeleteActionModal(true);
  };

  const handleCloseDeleteActionModal = () => {
    setShowDeleteActionModal(false);
    setActionToDelete(null);
  };

  const handleConfirmDeleteAction = async () => {
    if (!actionToDelete) return;

    try {
      const result = await deleteActionReward(actionToDelete);
      if (result.success) {
        alert(result.message || 'Đã xóa action reward thành công');
        handleCloseDeleteActionModal();
      } else {
        alert(result.message || 'Có lỗi xảy ra khi xóa action reward');
      }
    } catch (error) {
      console.error('[Admin] Error deleting action:', error);
      alert('Có lỗi xảy ra: ' + (error.message || 'Không xác định'));
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1> Trang Quản Trị</h1>
        <p>Xin chào, {user?.nickname || 'Admin'}</p>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'moderators' ? 'active' : ''}
          onClick={() => setActiveTab('moderators')}
        >
          <UserPlus size={18} className="tab-icon" />
          <span className="tab-text">Tạo người kiểm duyệt / người dùng</span>
        </button>
        <button
          className={activeTab === 'items' ? 'active' : ''}
          onClick={() => setActiveTab('items')}
        >
          <Package size={18} className="tab-icon" />
          <span className="tab-text">Quản lý quà</span>
        </button>
        <button
          className={activeTab === 'rewards' ? 'active' : ''}
          onClick={() => setActiveTab('rewards')}
        >
          <Gift size={18} className="tab-icon" />
          <span className="tab-text">Phần thưởng</span>
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} className="tab-icon" />
          <span className="tab-text">Quản lý người dùng</span>
        </button>
        <button
          className={activeTab === 'exchanges' ? 'active' : ''}
          onClick={() => setActiveTab('exchanges')}
        >
          <ShoppingCart size={18} className="tab-icon" />
          <span className="tab-text">Quản lý đổi quà</span>
        </button>
      </div>

      {activeTab === 'moderators' && (
        <div className="admin-section">
          <h2>Tạo tài khoản kiểm duyệt / User</h2>
          <form onSubmit={handleCreateModerator} className="admin-form">
            <div className="form-group">
              <label>Username (Email) *</label>
              <input
                type="text"
                value={modEmail}
                onChange={(e) => setModEmail(e.target.value)}
                placeholder="Username (có thể dùng email)"
                required
              />
            </div>
            <div className="form-group">
              <label>Mật khẩu *</label>
              <input
                type="password"
                value={modPassword}
                onChange={(e) => setModPassword(e.target.value)}
                placeholder="Mật khẩu"
                required
              />
            </div>
            <div className="form-group">
              <label>Nickname *</label>
              <input
                type="text"
                value={modNickname}
                onChange={(e) => setModNickname(e.target.value)}
                placeholder="Tên hiển thị"
                required
              />
            </div>
            <div className="form-group">
              <label>Vai trò (Role) *</label>
              <select
                value={modRole}
                onChange={(e) => setModRole(e.target.value)}
                required
              >
                <option value="moderator">Moderator (Kiểm duyệt viên)</option>
                <option value="user">User (Người dùng thường)</option>
              </select>
              <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                {modRole === 'moderator'
                  ? 'Moderator có quyền duyệt bài và quản lý user bình thường'
                  : 'User chỉ có quyền đăng bài và đổi quà'}
              </p>
            </div>
            <button type="submit" className="submit-btn">
              Tạo {modRole === 'moderator' ? 'Moderator' : 'User'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="admin-section">
          {/* Category Filter */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.4em' }}>Danh sách quà</h3>
              <button
                onClick={handleOpenAddItemModal}
                className="submit-btn"
                style={{ padding: '8px 16px', fontSize: '0.9em' }}
              >
                + Thêm phần quà mới
              </button>
            </div>
            <div className="category-filter" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: selectedCategory === category ? '#4a7c2a' : 'white',
                    color: selectedCategory === category ? 'white' : '#333',
                    cursor: 'pointer'
                  }}
                >
                  {category === 'all' ? 'Tất cả' :
                   category === 'handmade' ? 'Thủ công' :
                   category === 'vouchers' ? 'Phiếu khuyến mãi' :
                   category === 'books' ? 'Sách' :
                   category === 'movies' ? 'Phim' :
                   'Quyên góp'}
                </button>
              ))}
            </div>
          </div>

          {/* Items Statistics */}
          <div className="items-stats">
            <div className="item-stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <div className="stat-value">{items.length}</div>
                <div className="stat-label">Tổng số items</div>
              </div>
            </div>
            {categories.filter(cat => cat !== 'all').map(category => {
              const count = items.filter(item => (item.tag || item.category || 'handmade') === category).length;
              const categoryEmojis = {
                handmade: '🎨',
                vouchers: '🎫',
                books: '📚',
                movies: '🎬',
                donations: '❤️'
              };
              return (
                <div key={category} className="item-stat-card">
                  <div className="stat-icon">{categoryEmojis[category] || '📦'}</div>
                  <div className="stat-info">
                    <div className="stat-value">{count}</div>
                    <div className="stat-label">
                      {category === 'handmade' ? 'Thủ công' :
                       category === 'vouchers' ? 'Phiếu khuyến mãi' :
                       category === 'books' ? 'Sách' :
                       category === 'movies' ? 'Phim' :
                       'Quyên góp'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Items List */}
          <div>
            {(() => {
              const filteredItems = selectedCategory === 'all'
                ? items
                : items.filter(item => (item.tag || item.category || 'handmade') === selectedCategory);

              const getTagInfo = (tag) => {
                const tagMap = {
                  handmade: { emoji: '🎨', name: 'Thủ công', color: '#e91e63' },
                  vouchers: { emoji: '🎫', name: 'Phiếu khuyến mãi', color: '#2196f3' },
                  books: { emoji: '📚', name: 'Sách', color: '#9c27b0' },
                  movies: { emoji: '🎬', name: 'Phim', color: '#f44336' },
                  donations: { emoji: '❤️', name: 'Quyên góp', color: '#ff5722' }
                };
                return tagMap[tag] || { emoji: '📦', name: tag || 'Khác', color: '#757575' };
              };

              return (
                <>
                  <div className="items-header-info">
                    <p className="items-count-text">
                      Hiển thị <strong>{filteredItems.length}</strong> / {items.length} items
                      {selectedCategory !== 'all' && (
                        <span className="category-filter-badge">
                          {getTagInfo(selectedCategory).emoji} {getTagInfo(selectedCategory).name}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="admin-items-grid">
                    {filteredItems.map(item => {
                      const tagInfo = getTagInfo(item.tag || item.category || 'handmade');

                      return (
                        <div key={item.id} className="admin-item-card">
                          <div className="item-card-image-wrapper">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="item-card-image"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const fallback = e.target.nextElementSibling;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="item-card-image-placeholder"
                              style={{ display: item.imageUrl ? 'none' : 'flex' }}
                            >
                              <span className="placeholder-icon">📦</span>
                            </div>
                            <div className="item-card-tag-badge" style={{ backgroundColor: tagInfo.color }}>
                              <span className="tag-emoji">{tagInfo.emoji}</span>
                              <span className="tag-name">{tagInfo.name}</span>
                            </div>
                          </div>

                          <div className="item-card-content">
                            <h3 className="item-card-title">{item.name || 'Quà tặng'}</h3>

                            <div className="item-card-info">
                              <div className="item-points">
                                <span className="points-icon">🪙</span>
                                <span className="points-value">{item.requiredPoints || item.price || 0}</span>
                                <span className="points-label">điểm</span>
                              </div>
                            </div>

                            <div className="item-card-actions">
                              <button
                                className="item-edit-btn"
                                onClick={() => handleOpenEditItemModal(item)}
                              >
                                <span className="btn-icon">✏️</span>
                                <span className="btn-text">Sửa</span>
                              </button>
                              <button
                                className="item-delete-btn"
                                onClick={() => handleOpenDeleteModal(item)}
                              >
                                <span className="btn-icon">🗑️</span>
                                <span className="btn-text">Xóa</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {filteredItems.length === 0 && (
                    <div className="items-empty-state">
                      <div className="empty-icon">📦</div>
                      <p className="empty-text">Không có items nào trong danh mục này</p>
                      <button
                        className="empty-add-btn"
                        onClick={handleOpenAddItemModal}
                      >
                        + Thêm item mới
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="admin-section">
          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
            <button
              className={rewardsSubTab === 'streaks' ? 'active' : ''}
              onClick={() => setRewardsSubTab('streaks')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '1em',
                color: rewardsSubTab === 'streaks' ? '#FFD700' : '#666',
                borderBottom: rewardsSubTab === 'streaks' ? '3px solid #FFD700' : '3px solid transparent',
                fontWeight: rewardsSubTab === 'streaks' ? '600' : '400',
                transition: 'all 0.3s'
              }}
            >
              🔥 Streak Milestones
            </button>
            <button
              className={rewardsSubTab === 'actions' ? 'active' : ''}
              onClick={() => setRewardsSubTab('actions')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '1em',
                color: rewardsSubTab === 'actions' ? '#FFD700' : '#666',
                borderBottom: rewardsSubTab === 'actions' ? '3px solid #FFD700' : '3px solid transparent',
                fontWeight: rewardsSubTab === 'actions' ? '600' : '400',
                transition: 'all 0.3s'
              }}
            >
              🎯 Action Rewards
            </button>
          </div>

          {/* Streak Milestones Tab */}
          {rewardsSubTab === 'streaks' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Quy ước điểm linh vật (Streak Milestones)</h3>
                <button
                  onClick={handleOpenAddStreakModal}
                  className="submit-btn"
                  style={{ padding: '10px 20px', fontSize: '1em' }}
                >
                  + Thêm Milestone
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '20px' }}>
                {Object.entries(config.streakMilestones || {}).map(([streak, milestone]) => (
                  <div key={streak} className="config-item" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.5em', marginBottom: '5px' }}>{milestone.emoji}</div>
                      <div><strong>Streak {streak}</strong></div>
                      <div style={{ color: '#666' }}>{milestone.name}</div>
                      <div style={{ fontSize: '0.9em', color: milestone.color || '#666' }}>
                        Màu: <span style={{ backgroundColor: milestone.color || '#666', width: '20px', height: '20px', display: 'inline-block', borderRadius: '4px', verticalAlign: 'middle' }}></span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleOpenEditStreakModal(streak, milestone)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4a7c2a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleOpenDeleteStreakModal(streak)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
                {Object.keys(config.streakMilestones || {}).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666', gridColumn: '1 / -1' }}>
                    <p>Chưa có milestone nào. Nhấn "+ Thêm Milestone" để thêm mới.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Rewards Tab */}
          {rewardsSubTab === 'actions' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Phần thưởng milestone theo streak</h3>
                <button
                  onClick={handleOpenAddActionModal}
                  className="submit-btn"
                  style={{ padding: '10px 20px', fontSize: '1em' }}
                >
                  + Thêm Milestone
                </button>
              </div>

              {/* Default Reward */}
              <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 15px 0' }}>Phần thưởng mặc định</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div><strong>Mặc định:</strong> 1 Streak = {config.actionRewards?.default?.ecoTokens || 10} Tokens</div>
                    <div style={{ color: '#666', fontSize: '0.9em', marginTop: '5px' }}>
                      Mỗi bài viết được duyệt sẽ nhận {config.actionRewards?.default?.ecoTokens || 10} tokens
                    </div>
                  </div>
                  <button
                    onClick={handleOpenEditDefaultModal}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#4a7c2a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Sửa
                  </button>
                </div>
              </div>

              {/* Action Rewards Milestones List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '20px' }}>
                {Object.entries(config.actionRewards?.milestones || {})
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([streakMilestone, bonusTokens]) => (
                  <div key={streakMilestone} className="config-item" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div><strong>Streak {streakMilestone}</strong></div>
                      <div style={{ color: '#666', marginTop: '5px' }}>
                        Thưởng thêm: +{bonusTokens} Tokens
                      </div>
                      <div style={{ color: '#999', fontSize: '0.85em', marginTop: '3px' }}>
                        Khi đạt {streakMilestone} streak liên tiếp
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleOpenEditActionModal(streakMilestone, bonusTokens)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4a7c2a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleOpenDeleteActionModal(streakMilestone)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
                {Object.keys(config.actionRewards?.milestones || {}).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666', gridColumn: '1 / -1' }}>
                    <p>Chưa có milestone nào. Nhấn "+ Thêm Milestone" để thêm mới.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm user (tên, email, số điện thoại)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          {filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>{searchTerm ? 'Không tìm thấy user nào' : 'Chưa có user nào trong hệ thống'}</p>
            </div>
          ) : (
            <>
              <p style={{ color: '#666', marginBottom: '10px' }}>
                Hiển thị {filteredUsers.length} / {allUsers?.length || 0} users
              </p>
              <div className="users-list">
                {filteredUsers.map((u) => {
                  const userRole = u.roleName || u.role || 'user';
                  const roleBadgeClass = userRole.toLowerCase() === 'admin' ? 'role-badge-admin' :
                                        userRole.toLowerCase() === 'moderator' ? 'role-badge-moderator' :
                                        'role-badge-user';

                  return (
                    <div key={u.id} className="admin-user-card">
                      <div className="admin-user-avatar-section">
                        {u.avatarImage ? (
                          <img
                            src={u.avatarImage}
                            alt={u.nickname || u.name || u.username}
                            className="admin-user-avatar-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.nextElementSibling;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="admin-user-avatar"
                          style={{ display: u.avatarImage ? 'none' : 'flex' }}
                        >
                          {u.avatar || '👤'}
                        </div>
                      </div>

                      <div className="admin-user-info">
                        <div className="admin-user-header">
                          <div className="admin-user-name-section">
                            <h3 className="admin-user-name">{u.name || u.nickname || u.username || 'Chưa có tên'}</h3>
                            <span className={`admin-role-badge ${roleBadgeClass}`}>
                              {userRole === 'Admin' ? '👑 Admin' :
                               userRole === 'Moderator' ? '👮 Moderator' :
                               '👤 User'}
                            </span>
                          </div>
                        </div>

                        <div className="admin-user-details-grid">
                          <div className="admin-user-detail-item">
                            <span className="detail-label">Username:</span>
                            <span className="detail-value">{u.username || 'N/A'}</span>
                          </div>
                          {u.email && (
                            <div className="admin-user-detail-item">
                              <span className="detail-label">Email:</span>
                              <span className="detail-value">{u.email}</span>
                            </div>
                          )}
                          {(u.phone || u.phoneNumber) && (
                            <div className="admin-user-detail-item">
                              <span className="detail-label">SĐT:</span>
                              <span className="detail-value">{u.phone || u.phoneNumber}</span>
                            </div>
                          )}
                          {u.address && (
                            <div className="admin-user-detail-item">
                              <span className="detail-label">Địa chỉ:</span>
                              <span className="detail-value">{u.address}</span>
                            </div>
                          )}
                        </div>

                        <div className="admin-user-stats">
                          <div className="admin-user-stat-item">
                            <span className="stat-icon">🪙</span>
                            <span className="stat-label">Tokens:</span>
                            <span className="stat-value">{u.currentPoints ?? u.ecoTokens ?? 0}</span>
                          </div>
                          {u.streak !== undefined && u.streak !== null && (
                            <div className="admin-user-stat-item">
                              <span className="stat-icon">🔥</span>
                              <span className="stat-label">Streak:</span>
                              <span className="stat-value">{u.streak}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="admin-user-actions">
                        <button
                          className="admin-edit-btn"
                          onClick={() => handleEditUser(u)}
                        >
                          ✏️ Chỉnh sửa
                        </button>
                        {u.roleId !== 2 && ( // Không hiển thị nút xóa cho Admin
                          <button
                            className="admin-delete-btn"
                            onClick={() => handleDeleteUser(u.id, u.username || u.name || 'user')}
                          >
                            🗑️ Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'exchanges' && (
        <div className="admin-section">
          <div className="exchanges-filters">
            <div className="filter-group">
              <label>Lọc theo ngày:</label>
              <input
                type="date"
                value={exchangeDateFilter}
                onChange={(e) => setExchangeDateFilter(e.target.value)}
                className="filter-date-input"
              />
              {exchangeDateFilter && (
                <button
                  className="filter-clear-btn"
                  onClick={() => setExchangeDateFilter('')}
                >
                  ✕ Xóa
                </button>
              )}
            </div>
            <div className="filter-group">
              <label>Trạng thái:</label>
              <select
                value={exchangeShippedFilter}
                onChange={(e) => setExchangeShippedFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả</option>
                <option value="not_shipped">Chưa gửi đơn</option>
                <option value="shipped">Đã gửi đơn</option>
              </select>
            </div>
          </div>

          <div className="exchanges-stats">
            <div className="exchange-stat-item">
              <span className="stat-label">Tổng số:</span>
              <span className="stat-value">{exchanges.length}</span>
            </div>
            <div className="exchange-stat-item">
              <span className="stat-label">Đã gửi:</span>
              <span className="stat-value shipped">{exchanges.filter(e => e.isShipped).length}</span>
            </div>
            <div className="exchange-stat-item">
              <span className="stat-label">Chưa gửi:</span>
              <span className="stat-value not-shipped">{exchanges.filter(e => !e.isShipped).length}</span>
            </div>
            <div className="exchange-stat-item">
              <span className="stat-label">Hiển thị:</span>
              <span className="stat-value">{filteredExchanges.length}</span>
            </div>
          </div>

          {filteredExchanges.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>{exchanges.length === 0 ? 'Chưa có đơn đổi quà nào' : 'Không có đơn nào khớp với bộ lọc'}</p>
            </div>
          ) : (
            <div className="exchanges-list">
              {filteredExchanges.map((exchange) => (
                <div key={exchange.id} className={`exchange-card ${exchange.isShipped ? 'shipped' : ''}`}>
                  <div className="exchange-item-info">
                    {exchange.giftImageUrl ? (
                      <img
                        src={exchange.giftImageUrl}
                        alt={exchange.giftName}
                        className="exchange-item-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="exchange-item-placeholder"
                      style={{ display: exchange.giftImageUrl ? 'none' : 'flex' }}
                    >
                      📦
                    </div>
                    <div className="exchange-item-details">
                      <h3 className="exchange-item-name">{exchange.giftName || 'Quà tặng'}</h3>
                      <div className="exchange-item-meta">
                        <span className="exchange-price">🪙 {exchange.price || 0} điểm</span>
                        <span className="exchange-date">📅 {formatDate(exchange.exchangedAt)}</span>
                      </div>
                      <div className="exchange-user-info">
                        <div className="exchange-user-name">👤 {exchange.userName || 'Người dùng'}</div>
                        {exchange.userPhoneNumber && (
                          <div className="exchange-user-phone">📞 {exchange.userPhoneNumber}</div>
                        )}
                        {exchange.userAddress && (
                          <div className="exchange-user-address">📍 {exchange.userAddress}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="exchange-actions">
                    <label className="exchange-shipped-checkbox">
                      <input
                        type="checkbox"
                        checked={exchange.isShipped || false}
                        onChange={() => handleToggleShipped(exchange.id, exchange.isShipped || false)}
                      />
                      <span className="checkbox-label">
                        {exchange.isShipped ? '✅ Đã gửi đơn' : '⏳ Chưa gửi đơn'}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Chỉnh sửa User: {selectedUser.name || selectedUser.nickname || selectedUser.username}</h2>
            <div className="form-group">
              <label>Tên (Name)</label>
              <input
                type="text"
                value={selectedUser.name || selectedUser.nickname || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value, nickname: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Username (Không thể sửa)</label>
              <input
                type="text"
                value={selectedUser.username || ''}
                disabled
                style={{ background: '#f5f5f5' }}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={selectedUser.email || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                value={selectedUser.phone || selectedUser.phoneNumber || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value, phoneNumber: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Địa chỉ</label>
              <input
                type="text"
                value={selectedUser.address || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, address: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Giới tính</label>
              <select
                value={selectedUser.gender || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, gender: e.target.value })}
              >
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div className="form-group">
              <label>Eco Tokens (Current Points)</label>
              <input
                type="number"
                value={selectedUser.currentPoints ?? selectedUser.ecoTokens ?? 0}
                onChange={(e) => setSelectedUser({ ...selectedUser, currentPoints: parseInt(e.target.value) || 0, ecoTokens: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>Streak</label>
              <input
                type="number"
                value={selectedUser.streak || 0}
                onChange={(e) => setSelectedUser({ ...selectedUser, streak: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>Level</label>
              <input
                type="number"
                value={selectedUser.level || 0}
                onChange={(e) => setSelectedUser({ ...selectedUser, level: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="modal-actions">
              <button className="save-btn" onClick={handleSaveUser}>Lưu</button>
              <button className="cancel-btn" onClick={() => setSelectedUser(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal (Add/Edit) */}
      {showItemModal && (
        <div className="modal-overlay" onClick={handleCloseItemModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedItem ? 'Chỉnh sửa Item' : 'Thêm Item mới'}</h3>
              <button className="modal-close" onClick={handleCloseItemModal}>×</button>
            </div>
            <form onSubmit={handleSubmitItem} className="modal-form">
              <div className="form-group">
                <label>Tên Item *</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="Tên item"
                  required
                />
              </div>
              <div className="form-group">
                <label>Điểm yêu cầu (Required Points) *</label>
                <input
                  type="number"
                  value={itemForm.requiredPoints}
                  onChange={(e) => setItemForm({ ...itemForm, requiredPoints: e.target.value })}
                  placeholder="Số điểm cần để đổi"
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Tag/Category *</label>
                <select
                  value={itemForm.tag}
                  onChange={(e) => setItemForm({ ...itemForm, tag: e.target.value })}
                  required
                >
                  <option value="handmade">Thủ công</option>
                  <option value="vouchers">Phiếu khuyến mãi</option>
                  <option value="books">Sách</option>
                  <option value="movies">Phim</option>
                  <option value="donations">Quyên góp</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ảnh Item</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setItemForm({ ...itemForm, imageFile: e.target.files[0] })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="submit-btn" style={{ flex: 1 }}>
                  {selectedItem ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseItemModal}
                  style={{
                    flex: 1,
                    padding: '15px',
                    border: '2px solid #ddd',
                    borderRadius: '10px',
                    fontSize: '1.1em',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: 'white',
                    color: '#333'
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="modal-overlay" onClick={handleCloseDeleteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Xác nhận xóa Item</h3>
              <button className="modal-close" onClick={handleCloseDeleteModal}>×</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa item <strong>"{itemToDelete.name}"</strong>?</p>
              <p style={{ color: '#dc3545', fontSize: '0.9em', marginTop: '10px' }}>
                ⚠️ Hành động này không thể hoàn tác.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1em',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Xóa
              </button>
              <button
                onClick={handleCloseDeleteModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1em',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'white',
                  color: '#333'
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streak Milestone Modal */}
      {showStreakModal && (
        <div className="modal-overlay" onClick={handleCloseStreakModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditingStreak ? 'Chỉnh sửa Streak Milestone' : 'Thêm Streak Milestone mới'}</h3>
              <button className="modal-close" onClick={handleCloseStreakModal}>×</button>
            </div>
            <form onSubmit={handleSubmitStreak} className="modal-form">
              <div className="form-group">
                <label>Số ngày Streak *</label>
                <input
                  type="number"
                  value={streakForm.streak}
                  onChange={(e) => setStreakForm({ ...streakForm, streak: e.target.value })}
                  placeholder="Ví dụ: 50, 100"
                  min="1"
                  required
                  disabled={isEditingStreak}
                  style={isEditingStreak ? { background: '#f5f5f5', cursor: 'not-allowed' } : {}}
                />
                {isEditingStreak && (
                  <small style={{ color: '#666', fontSize: '0.85em', marginTop: '5px', display: 'block' }}>
                    Không thể thay đổi số ngày streak khi chỉnh sửa
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Màu sắc linh vật *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <input
                    type="color"
                    value={streakForm.color}
                    onChange={(e) => setStreakForm({ ...streakForm, color: e.target.value })}
                    style={{ width: '60px', height: '45px', cursor: 'pointer', border: '2px solid #ddd', borderRadius: '8px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      padding: '10px 15px',
                      backgroundColor: streakForm.color,
                      borderRadius: '8px',
                      color: '#fff',
                      textAlign: 'center',
                      fontWeight: '600',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                    }}>
                      Màu này sẽ hiển thị trong giao diện user
                    </div>
                    <p style={{ fontSize: '0.85em', color: '#666', marginTop: '5px', marginBottom: 0 }}>
                      Màu sắc sẽ được dùng để tô điểm cho linh vật và background
                    </p>
                  </div>
                </div>
              </div>
              <div className="form-group emoji-picker-container" style={{ position: 'relative' }}>
                <label>Emoji linh vật *</label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: '#f9f9f9',
                    minHeight: '45px',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  onMouseEnter={(e) => e.target.style.borderColor = '#4a7c2a'}
                  onMouseLeave={(e) => e.target.style.borderColor = '#ddd'}
                >
                  <span style={{ fontSize: '2em' }}>{streakForm.emoji || '🌱'}</span>
                  <span style={{ color: '#666', flex: 1 }}>Nhấn để chọn emoji</span>
                  <span style={{ color: '#999', transform: showEmojiPicker ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                </div>

                {showEmojiPicker && (
                  <div
                    className="emoji-picker-dropdown"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '5px',
                      backgroundColor: 'white',
                      border: '2px solid #4a7c2a',
                      borderRadius: '8px',
                      padding: '15px',
                      zIndex: 1000,
                      maxHeight: '300px',
                      overflowY: 'auto',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{
                      fontSize: '0.9em',
                      color: '#666',
                      marginBottom: '10px',
                      fontWeight: '600'
                    }}>
                      Chọn emoji linh vật:
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(8, 1fr)',
                      gap: '8px',
                      marginBottom: '15px'
                    }}>
                      {mascotEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setStreakForm({ ...streakForm, emoji });
                            setShowEmojiPicker(false);
                          }}
                          style={{
                            fontSize: '2em',
                            padding: '8px',
                            border: streakForm.emoji === emoji ? '3px solid #4a7c2a' : '2px solid #ddd',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: streakForm.emoji === emoji ? '#e8f5e9' : 'white',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            if (streakForm.emoji !== emoji) {
                              e.target.style.backgroundColor = '#f0f0f0';
                              e.target.style.borderColor = '#4a7c2a';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (streakForm.emoji !== emoji) {
                              e.target.style.backgroundColor = 'white';
                              e.target.style.borderColor = '#ddd';
                            }
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div style={{
                      padding: '10px',
                      borderTop: '1px solid #eee',
                      marginTop: '10px',
                      fontSize: '0.9em',
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span>Hoặc nhập emoji tùy chỉnh:</span>
                      <input
                        type="text"
                        value={streakForm.emoji}
                        onChange={(e) => setStreakForm({ ...streakForm, emoji: e.target.value })}
                        placeholder="🌱"
                        style={{
                          padding: '5px 10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          width: '100px',
                          fontSize: '1.2em'
                        }}
                        maxLength={2}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Tên linh vật *</label>
                <input
                  type="text"
                  value={streakForm.name}
                  onChange={(e) => setStreakForm({ ...streakForm, name: e.target.value })}
                  placeholder="Ví dụ: Linh vật vàng"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="submit-btn" style={{ flex: 1 }}>
                  {isEditingStreak ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseStreakModal}
                  style={{
                    flex: 1,
                    padding: '15px',
                    border: '2px solid #ddd',
                    borderRadius: '10px',
                    fontSize: '1.1em',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: 'white',
                    color: '#333'
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Streak Modal */}
      {showDeleteStreakModal && streakToDelete && (
        <div className="modal-overlay" onClick={handleCloseDeleteStreakModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Xác nhận xóa Milestone</h3>
              <button className="modal-close" onClick={handleCloseDeleteStreakModal}>×</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa milestone <strong>Streak {streakToDelete}</strong>?</p>
              <p style={{ color: '#dc3545', fontSize: '0.9em', marginTop: '10px' }}>
                ⚠️ Hành động này không thể hoàn tác.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleConfirmDeleteStreak}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1em',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Xóa
              </button>
              <button
                onClick={handleCloseDeleteStreakModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1em',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'white',
                  color: '#333'
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Reward Modal */}
      {showActionModal && (
        <div className="modal-overlay" onClick={handleCloseActionModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {isEditingDefault
                  ? 'Chỉnh sửa Phần thưởng Mặc định'
                  : (actionForm.streakMilestone && config.actionRewards?.milestones?.[actionForm.streakMilestone] !== undefined
                    ? `Chỉnh sửa Milestone: Streak ${actionForm.streakMilestone}`
                    : 'Thêm Milestone mới')}
              </h3>
              <button className="modal-close" onClick={handleCloseActionModal}>×</button>
            </div>
            <form onSubmit={handleSubmitAction} className="modal-form">
              {isEditingDefault ? (
                <>
                  <div className="form-group">
                    <label>Phần thưởng mặc định</label>
                    <input
                      type="text"
                      value="Mặc định: 1 Streak = 10 Tokens (mỗi bài viết được duyệt)"
                      disabled
                      style={{ background: '#f5f5f5', color: '#666' }}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tokens mỗi Streak</label>
                      <input
                        type="number"
                        value={config.actionRewards?.default?.ecoTokens || 10}
                        disabled
                        style={{ background: '#f5f5f5' }}
                      />
                    </div>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px', marginBottom: '15px', fontSize: '0.9em', color: '#856404' }}>
                    ⚠️ Phần thưởng mặc định được quản lý riêng. Vui lòng liên hệ developer để thay đổi.
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Streak Milestone *</label>
                    <input
                      type="number"
                      value={actionForm.streakMilestone}
                      onChange={(e) => setActionForm({ ...actionForm, streakMilestone: e.target.value })}
                      placeholder="Ví dụ: 10 (khi đạt 10 streak)"
                      min="2"
                      required
                      disabled={actionForm.streakMilestone && config.actionRewards?.milestones?.[actionForm.streakMilestone] !== undefined}
                      style={actionForm.streakMilestone && config.actionRewards?.milestones?.[actionForm.streakMilestone] !== undefined ? { background: '#f5f5f5' } : {}}
                    />
                    <small style={{ color: '#666', fontSize: '0.85em' }}>
                      Số streak cần đạt để nhận bonus tokens
                    </small>
                  </div>
                  <div className="form-group">
                    <label>Bonus Tokens *</label>
                    <input
                      type="number"
                      value={actionForm.bonusTokens}
                      onChange={(e) => setActionForm({ ...actionForm, bonusTokens: e.target.value })}
                      placeholder="Ví dụ: 20 (thưởng thêm 20 tokens)"
                      min="1"
                      required
                    />
                    <small style={{ color: '#666', fontSize: '0.85em' }}>
                      Số tokens thưởng thêm khi đạt milestone này
                    </small>
                  </div>
                  {actionForm.streakMilestone && actionForm.bonusTokens && !isNaN(parseInt(actionForm.bonusTokens)) && (
                    <div style={{ padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '5px', marginBottom: '15px', fontSize: '0.9em', color: '#0c5460' }}>
                      💡 Khi user đạt {actionForm.streakMilestone} streak liên tiếp, họ sẽ nhận thêm {actionForm.bonusTokens} tokens (ngoài {config.actionRewards?.default?.ecoTokens || 10} tokens mặc định cho mỗi streak)
                    </div>
                  )}
                </>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="submit-btn" style={{ flex: 1 }} disabled={isEditingDefault}>
                  {isEditingDefault ? 'Không thể sửa' : (actionForm.streakMilestone && config.actionRewards?.milestones?.[actionForm.streakMilestone] !== undefined ? 'Cập nhật' : 'Thêm mới')}
                </button>
                <button
                  type="button"
                  onClick={handleCloseActionModal}
                  style={{
                    flex: 1,
                    padding: '15px',
                    border: '2px solid #ddd',
                    borderRadius: '10px',
                    fontSize: '1.1em',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: 'white',
                    color: '#333'
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Action Modal */}
      {showDeleteActionModal && actionToDelete && (
        <div className="modal-overlay" onClick={handleCloseDeleteActionModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Xác nhận xóa Milestone</h3>
              <button className="modal-close" onClick={handleCloseDeleteActionModal}>×</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa milestone cho streak <strong>"{actionToDelete}"</strong>?</p>
              <p style={{ fontSize: '0.9em', marginTop: '10px', color: '#666' }}>
                Milestone này sẽ bị xóa và users sẽ không còn nhận bonus tokens khi đạt {actionToDelete} streak.
              </p>
              <p style={{ color: '#dc3545', fontSize: '0.9em', marginTop: '10px' }}>
                ⚠️ Hành động này không thể hoàn tác.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleConfirmDeleteAction}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1em',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Xóa
              </button>
              <button
                onClick={handleCloseDeleteActionModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1em',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: 'white',
                  color: '#333'
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

