import { useState, useEffect } from 'react';
import { createBookDraft, createRecord, getRecords, deleteRecord, updateRecord, reorderRecords } from '../api';
import { FiArrowLeft, FiImage, FiEdit2, FiTrash2, FiChevronRight } from 'react-icons/fi';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

function NewBookPage({ onNext, onBack }) {
  const [title, setTitle] = useState('');
  const [bookId, setBookId] = useState(null);
  const [memo, setMemo] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoName, setPhotoName] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);


  const handleCreateBook = async () => {
    if (!title) return alert('책 제목을 입력해주세요.');
    setLoading(true);
    try {
      const res = await createBookDraft(title);
      if (res.data.success) {
        setBookId(res.data.bookId);
      }
    } catch (err) {
      alert('책 생성에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    if (!bookId) return;
    const res = await getRecords(bookId);
    setRecords(res.data);
  };

  useEffect(() => {
    fetchRecords();
  }, [bookId]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoName(file.name);
    }
  };

  const handleAddRecord = async () => {
    if (!photo) return alert('사진을 선택해주세요.');
    const formData = new FormData();
    formData.append('book_id', bookId);
    formData.append('memo', memo);
    formData.append('photo', photo);
    setLoading(true);
    try {
      await createRecord(formData);
      setMemo('');
      setPhoto(null);
      setPhotoName('');
      fetchRecords();
    } catch (err) {
      alert('기록 저장에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('이 기록을 삭제할까요?')) return;
    await deleteRecord(recordId);
    fetchRecords();
  };

  const handleEditRecord = (record) => {
    // For now, this just re-populates the add form with record data for editing.
    // A more advanced inline editor would be needed for true inline editing.
    setMemo(record.memo || '');
    setPhoto(null); // Clear photo for re-upload
    setPhotoName('');
    // Optionally, could set a state to indicate editing mode for the main form.
    alert('기록 편집은 상단의 "기록 추가" 폼을 이용해 주세요. 사진을 다시 선택하거나 멘트를 수정하고 "기록 추가하기" 버튼을 눌러주세요.');
  };







  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const newRecords = Array.from(records);
    const [reorderedItem] = newRecords.splice(result.source.index, 1);
    newRecords.splice(result.destination.index, 0, reorderedItem);

    setRecords(newRecords);
    if (bookId) {
      await reorderRecords(bookId, newRecords.map(r => r.id));
    }
  };

  const handleNext = () => {
    if (records.length === 0) return alert('기록을 최소 1개 이상 추가해주세요.');
    onNext(title, records.map(r => r.id), bookId, records);
  };

  return (
    <div>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FiArrowLeft size={16} /> 뒤로가기
      </button>

      {!bookId ? (
        <div className="form-card">
          <h2 className="form-title">📔 책 제목</h2>
          <input
            className="input"
            placeholder="책 제목을 입력해주세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button className="btn-primary" onClick={handleCreateBook} disabled={loading}>
            {loading ? '생성 중...' : '책 만들기 시작'}
          </button>
        </div>
      ) : (
        <>
          <div className="form-card">
            <h2 className="form-title">기록 추가</h2>
            <label className="file-input-label">
              <FiImage size={16} style={{ marginRight: '4px' }} />
              {photoName ? photoName : '사진을 선택해주세요'}
              <input type="file" accept="image/*" className="file-input" onChange={handlePhotoChange} />
            </label>

            {photo && (
              <img
                src={URL.createObjectURL(photo)}
                alt="미리보기"
                style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }}
              />
            )}
            <textarea
              className="textarea"
              placeholder="이 순간을 기억하는 한 마디를 남겨보세요. (선택)"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
            />
            <button className="btn-primary" onClick={handleAddRecord} disabled={loading}>
                {loading ? '추가 중...' : '기록 추가하기'}
              </button>
          </div>

          {records.length > 0 && (
            <div>
              <h2 className="section-title">추가된 기록 ({records.length}개)</h2>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                드래그 앤 드롭으로 페이지 순서를 바꿀 수 있어요.
              </p>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="records">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {records.map((record, index) => (
                        <Draggable key={record.id} draggableId={String(record.id)} index={index}>
                          {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="record-card"
                              >
                                <img
                                  src={`http://127.0.0.1:8000/uploads/${record.photo_path.split('/').pop()}`}
                                  alt="기록사진"
                                  className="record-photo"
                                />
                                <div className="record-info" style={{ flex: 1 }}>
                                  <p className="record-memo">{record.memo || '(멘트 없음)'}</p>
                                  <p className="record-date">{new Date(record.created_at).toLocaleDateString('ko-KR')}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <button
                                    className="btn-secondary"
                                    style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '3px' }}
                                    onClick={() => handleEditRecord(record)}
                                  >
                                    <FiEdit2 size={12} /> 수정
                                  </button>
                                  <button
                                    className="btn-secondary"
                                    style={{ fontSize: '12px', padding: '4px 10px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px' }}
                                    onClick={() => handleDeleteRecord(record.id)}
                                  >
                                    <FiTrash2 size={12} /> 삭제
                                  </button>
                                </div>
                              </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <button className="btn-book" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                다음 단계 — 스타일 선택 <FiChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default NewBookPage;
