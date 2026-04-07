import { useState, useEffect } from 'react';
import { getTemplates, uploadCoverPhoto } from '../api';
import { FiArrowLeft, FiImage, FiCheck } from 'react-icons/fi';

function StyleSelectPage({ onNext, onBack, bookId, records }) {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coverSource, setCoverSource] = useState('record'); // 'record' | 'upload'
  const [selectedRecordPhoto, setSelectedRecordPhoto] = useState(null);
  const [uploadedCover, setUploadedCover] = useState(null);
  const [uploadedCoverName, setUploadedCoverName] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    getTemplates().then(res => {
      if (res.data.success) {
        const filtered = res.data.data.templates.filter(t =>
          t.thumbnails?.layout &&
          t.templateName !== '빈내지' &&
          t.templateName !== '내지_월시작' &&
          t.templateName !== '내지_monthHeader' &&
          t.templateName !== '내지_gallery' &&
          t.theme !== null
        );
        setTemplates(filtered);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleCoverUpload = async (file) => {
    if (!file || !bookId) return;
    setUploadedCoverName(file.name);
    setUploadedCover(file);
    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      await uploadCoverPhoto(bookId, formData);
    } catch (err) {
      alert('표지 사진 업로드에 실패했어요.');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSelectRecordCover = async (record) => {
    if (!bookId) return;
    setSelectedRecordPhoto(record.id);
    setCoverUploading(true);
    try {
      const photoUrl = `http://127.0.0.1:8000/uploads/${record.photo_path.split('/').pop()}`;
      const res = await fetch(photoUrl);
      const blob = await res.blob();
      const filename = record.photo_path.split('/').pop();
      const file = new File([blob], filename, { type: blob.type });
      const formData = new FormData();
      formData.append('photo', file);
      await uploadCoverPhoto(bookId, formData);
    } catch (err) {
      alert('표지 사진 설정에 실패했어요.');
    } finally {
      setCoverUploading(false);
    }
  };

  const isCoverSelected = coverSource === 'upload' ? !!uploadedCover : !!selectedRecordPhoto;

  return (
    <div>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FiArrowLeft size={16} /> 뒤로가기
      </button>

      {/* 표지 사진 선택 */}
      <div className="form-card">
        <h2 className="form-title">📸 표지 사진 선택</h2>
        <p style={{ fontSize: '13px', color: '#a08c7d', marginBottom: '16px' }}>
          책의 표지에 들어갈 사진을 선택해주세요.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setCoverSource('record')}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: '2px solid',
              borderColor: coverSource === 'record' ? '#0ea5e9' : '#e5e7eb',
              background: coverSource === 'record' ? '#f0f9ff' : '#f8fafc',
              color: coverSource === 'record' ? '#0ea5e9' : '#6b7280',
              fontWeight: '600', fontSize: '13px', cursor: 'pointer'
            }}
          >
            기록 사진에서 선택
          </button>
          <button
            onClick={() => setCoverSource('upload')}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: '2px solid',
              borderColor: coverSource === 'upload' ? '#0ea5e9' : '#e5e7eb',
              background: coverSource === 'upload' ? '#f0f9ff' : '#f8fafc',
              color: coverSource === 'upload' ? '#0ea5e9' : '#6b7280',
              fontWeight: '600', fontSize: '13px', cursor: 'pointer'
            }}
          >
            새 사진 업로드
          </button>
        </div>

        {coverSource === 'record' && records && records.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {records.map(record => {
              const photoUrl = `http://127.0.0.1:8000/uploads/${record.photo_path.split('/').pop()}`;
              const isSelected = selectedRecordPhoto === record.id;
              return (
                <div
                  key={record.id}
                  onClick={() => handleSelectRecordCover(record)}
                  style={{
                    position: 'relative', cursor: 'pointer', borderRadius: '8px', overflow: 'hidden',
                    border: `2.5px solid ${isSelected ? '#0ea5e9' : 'transparent'}`,
                    aspectRatio: '1'
                  }}
                >
                  <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {isSelected && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(14,165,233,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FiCheck size={24} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {coverSource === 'upload' && (
          <label className="file-input-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <FiImage size={16} />
            {uploadedCoverName || '표지 사진을 업로드해주세요'}
            <input
              type="file"
              accept="image/*"
              className="file-input"
              onChange={(e) => { if (e.target.files[0]) handleCoverUpload(e.target.files[0]); }}
            />
          </label>
        )}

        {uploadedCover && coverSource === 'upload' && (
          <img
            src={URL.createObjectURL(uploadedCover)}
            alt="표지 미리보기"
            style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }}
          />
        )}

        {coverUploading && (
          <p style={{ fontSize: '12px', color: '#0ea5e9', marginTop: '8px', textAlign: 'center' }}>
            표지 사진 저장 중...
          </p>
        )}
      </div>

      {/* 내지 스타일 선택 */}
      <h2 className="section-title">내지 스타일 선택</h2>
      <p style={{ fontSize: '13px', color: '#a08c7d', marginBottom: '20px' }}>
        원하는 내지 스타일을 선택해주세요.
      </p>

      {loading && <p className="empty-text">템플릿 불러오는 중...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        {templates.map((template) => (
          <div
            key={template.templateUid}
            onClick={() => setSelected(template)}
            style={{
              background: '#fff', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
              border: selected?.templateUid === template.templateUid ? '2.5px solid #0ea5e9' : '2px solid transparent',
              boxShadow: '0 2px 8px rgba(14,165,233,0.08)', transition: 'all 0.2s'
            }}
          >
            <img src={template.thumbnails.layout} alt={template.templateName} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
            <div style={{ padding: '10px' }}>
              <p style={{ fontSize: '12px', fontWeight: '500', color: '#0ea5e9' }}>{template.theme || template.templateName}</p>
              <p style={{ fontSize: '11px', color: '#9ca3af' }}>{template.templateName}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn-primary"
        onClick={() => onNext(selected)}
        disabled={!selected || !isCoverSelected || coverUploading}
      >
        {coverUploading ? '표지 저장 중...' : '이 스타일로 책 만들기'}
      </button>
    </div>
  );
}

export default StyleSelectPage;
