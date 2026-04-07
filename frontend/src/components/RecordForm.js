import { useState } from 'react';
import { createRecord } from '../api';

function RecordForm({ onRecordAdded }) {
  const [memo, setMemo] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoName, setPhotoName] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memo || !photo) return alert('사진과 메모를 입력해주세요.');

    const formData = new FormData();
    formData.append('memo', memo);
    formData.append('photo', photo);

    setLoading(true);
    try {
      await createRecord(formData);
      setMemo('');
      setPhoto(null);
      setPhotoName('');
      onRecordAdded();
    } catch (err) {
      alert('기록 저장에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2 className="form-title">✏️ 오늘의 기억 남기기</h2>
      <form onSubmit={handleSubmit}>
        <label className="file-input-label">
          {photoName ? `📷 ${photoName}` : '📷 사진을 선택해주세요'}
          <input
            type="file"
            accept="image/*"
            className="file-input"
            onChange={handlePhotoChange}
          />
        </label>
        <textarea
          className="textarea"
          placeholder="이 순간을 기억하는 한 마디를 남겨보세요."
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '저장 중...' : '기록 저장하기'}
        </button>
      </form>
    </div>
  );
}

export default RecordForm;