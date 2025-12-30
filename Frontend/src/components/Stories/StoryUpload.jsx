import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { uploadStoryApi } from '../../api/storiesApi';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast';
import './Stories.css';

/**
 * StoryUpload Component
 *
 * Modal for uploading new stories
 * Allows image preview before upload
 */
const StoryUpload = ({ isOpen, onClose, onUploadSuccess, currentUserId }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Vui lòng chọn file ảnh hợp lệ');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      showError('Vui lòng chọn ảnh để đăng Story');
      return;
    }

    const toastId = showLoading('Đang đăng Story...');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('userId', currentUserId);

      const result = await uploadStoryApi(formData);

      dismissToast(toastId);

      if (result.success) {
        showSuccess(result.message || 'Story đã được đăng!');
        resetForm();
        if (onUploadSuccess) {
          onUploadSuccess(result.data);
        }
        onClose();
      } else {
        showError(result.message || 'Không thể đăng Story');
      }
    } catch (error) {
      dismissToast(toastId);
      showError('Có lỗi xảy ra khi đăng Story');
      console.error('Upload story error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="story-upload-overlay" onClick={handleClose}>
      <div className="story-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="story-upload-header">
          <h3>Tạo Story mới</h3>
          <button
            className="story-upload-close"
            onClick={handleClose}
            disabled={isUploading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="story-upload-content">
          {!imagePreview ? (
            <div className="story-upload-empty">
              <ImageIcon size={64} className="story-upload-icon" />
              <p>Chọn ảnh để đăng Story</p>
              <p className="story-upload-hint">Story sẽ tự động xóa sau 24 giờ</p>
              <button
                className="story-upload-select-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload size={20} />
                Chọn ảnh
              </button>
            </div>
          ) : (
            <div className="story-upload-preview">
              <img src={imagePreview} alt="Preview" />
              <button
                className="story-upload-change-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Đổi ảnh khác
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
        </div>

        <div className="story-upload-footer">
          <button
            className="story-upload-cancel-btn"
            onClick={handleClose}
            disabled={isUploading}
          >
            Hủy
          </button>
          <button
            className="story-upload-submit-btn"
            onClick={handleUpload}
            disabled={!selectedImage || isUploading}
          >
            {isUploading ? 'Đang đăng...' : 'Đăng Story'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryUpload;
