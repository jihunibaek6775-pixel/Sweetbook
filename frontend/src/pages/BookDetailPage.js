import { useState, useEffect } from 'react';
import { getRecords, deleteBook, updateBookTitle, updateRecord, deleteRecord, getOrders, getTemplates, reorderRecords, createRecord } from '../api';
import { FiArrowLeft, FiEdit2, FiTrash2, FiImage, FiCheck, FiShoppingCart, FiEdit3 } from 'react-icons/fi';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

function RecordItem({ record, onUpdated, onDeleted, isOrderComplete }) {
  const [editing, setEditing] = useState(false);
  const [memo, setMemo] = useState(record.memo || '');
  const [photo, setPhoto] = useState(null);
  const [photoName, setPhotoName] = useState('');
  const [loading, setLoading] = useState(false);

  const photoUrl = `http://127.0.0.1:8000/uploads/${record.photo_path.split('/').pop()}`;

  const handleSave = async () => {
    if (isOrderComplete) {
      alert('주문 완료된 책은 수정할 수 없어요.');
      return;
    }
    const formData = new FormData();
    formData.append('memo', memo);
    if (photo) formData.append('photo', photo);

    setLoading(true);
    try {
      const response = await updateRecord(record.id, formData);
      if (response.data.success === false) {
        alert(response.data.message || '수정에 실패했어요.');
        return;
      }
      setEditing(false);
      setPhoto(null);
      setPhotoName('');
      onUpdated();
    } catch (err) {
      alert(err.response?.data?.message || '수정 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setMemo(record.memo || '');
    setPhoto(null);
    setPhotoName('');
  };

  const handleDelete = async () => {
    if (isOrderComplete) {
      alert('주문 완료된 책은 삭제할 수 없어요.');
      return;
    }
    if (!window.confirm('이 기록을 삭제할까요?')) return;
    try {
      const response = await deleteRecord(record.id);
      if (response.data.success === false) {
        alert(response.data.message || '삭제에 실패했어요.');
        return;
      }
      onDeleted();
    } catch (err) {
      alert(err.response?.data?.message || '삭제에 실패했어요.');
    }
  };

  return (
    <div className="record-card" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '12px' }}>
      {editing ? (
        <>
          <label className="file-input-label" style={{ width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <FiImage size={16} />
            {photoName ? photoName : '새 사진으로 교체 (선택)'}
            <input
              type="file"
              accept="image/*"
              className="file-input"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) { setPhoto(file); setPhotoName(file.name); }
              }}
            />
          </label>
          {!photo && (
            <img src={photoUrl} alt="현재 사진" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: '200px' }} />
          )}
          {photo && (
            <img src={URL.createObjectURL(photo)} alt="새 사진 미리보기" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: '200px' }} />
          )}
          <textarea
            className="textarea"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            style={{ marginBottom: 0 }}
          />
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </button>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={handleCancel} disabled={loading}>
              취소
            </button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'flex-start' }}>
          <img src={photoUrl} alt="기록사진" className="record-photo" />
          <div className="record-info" style={{ flex: 1 }}>
            <p className="record-memo">{record.memo || '(멘트 없음)'}</p>
            <p className="record-date">{new Date(record.created_at).toLocaleDateString('ko-KR')}</p>
            {!isOrderComplete && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '3px' }}
                  onClick={() => setEditing(true)}
                >
                  <FiEdit2 size={12} /> 수정
                </button>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px' }}
                  onClick={handleDelete}
                >
                  <FiTrash2 size={12} /> 삭제
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BookDetailPage({ book, onBack, onOrderRequest, onStyleChange }) {
  const [records, setRecords] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [hasOrder, setHasOrder] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);

  // New states for adding records
  const [showAddRecordForm, setShowAddRecordForm] = useState(false);
  const [newMemo, setNewMemo] = useState('');
  const [newPhoto, setNewPhoto] = useState(null);
  const [newPhotoName, setNewPhotoName] = useState('');
  const [loadingAddRecord, setLoadingAddRecord] = useState(false);

  const fetchRecords = () => {
    getRecords(book.id).then(res => setRecords(res.data));
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const newRecords = Array.from(records);
    const [reorderedItem] = newRecords.splice(result.source.index, 1);
    newRecords.splice(result.destination.index, 0, reorderedItem);

    setRecords(newRecords);
    await reorderRecords(book.id, newRecords.map(r => r.id));
  };

  useEffect(() => {
    fetchRecords();
    // 주문 상태 확인
    getOrders().then(res => {
      if (res.data.success) {
        const orders = res.data.data.items || [];
        const bookOrdered = orders.some(order => order.bookId === book.id);
        setHasOrder(bookOrdered);
      }
    }).catch(() => {
      setHasOrder(false);
    });

    // 현재 템플릿 정보 조회
    if (book.template_uid) {
      getTemplates().then(res => {
        if (res.data.success) {
          const templates = res.data.data.templates || [];
          const template = templates.find(t => t.templateUid === book.template_uid);
          setCurrentTemplate(template);
        }
      }).catch(() => {
        setCurrentTemplate(null);
      });
    }
  }, [book.id, book.template_uid]);

  const handleUpdateTitle = async () => {
    if (hasOrder) {
      alert('주문 완료된 책은 수정할 수 없어요.');
      return;
    }
    try {
      const response = await updateBookTitle(book.id, title);
      if (response.data.success === false) {
        alert(response.data.message || '수정에 실패했어요.');
        return;
      }
      setIsEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || '수정 중 오류가 발생했어요.');
    }
  };
  const handleDeleteBook = async () => {
    if (hasOrder) {
      alert('주문 완료된 책은 삭제할 수 없어요.');
      return;
    }
    if (!window.confirm('이 책을 삭제할까요? 모든 기록도 함께 삭제돼요.')) return;
    try {
      await deleteBook(book.id);
      onBack();
    } catch (err) {
      alert(err.response?.data?.message || '삭제에 실패했어요.');
    }
  };

  const handleAddRecord = async () => {
    if (!newPhoto) return alert('사진을 선택해주세요.');
    setLoadingAddRecord(true);
    const formData = new FormData();
    formData.append('book_id', book.id);
    formData.append('memo', newMemo);
    formData.append('photo', newPhoto);

    try {
      await createRecord(formData);
      setNewMemo('');
      setNewPhoto(null);
      setNewPhotoName('');
      setShowAddRecordForm(false);
      fetchRecords(); // Refresh records list
    } catch (err) {
      alert('기록 추가에 실패했어요.');
    } finally {
      setLoadingAddRecord(false);
    }
  };

  return (
    <div>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FiArrowLeft size={16} /> 뒤로가기
      </button>

      <div className="form-card">
        {isEditing ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ marginBottom: 0 }}
            />
            <button className="btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={handleUpdateTitle}>
              저장
            </button>
            <button className="btn-secondary" style={{ whiteSpace: 'nowrap' }} onClick={() => setIsEditing(false)}>
              취소
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className="form-title" style={{ margin: 0 }}>📔 {title}</h2>
            {!hasOrder && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setIsEditing(true)}>
                  <FiEdit2 size={14} /> 수정
                </button>
                <button className="btn-secondary" style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => onStyleChange(book, records)}>
                  <FiEdit3 size={14} /> 스타일 변경
                </button>
                <button className="btn-secondary" style={{ fontSize: '12px', padding: '4px 10px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={handleDeleteBook}>
                  <FiTrash2 size={14} /> 삭제
                </button>
              </div>
            )}
          </div>
        )}
        <p style={{ fontSize: '13px', color: '#a08c7d', marginTop: '8px' }}>
          기록 {records.length}개 · {new Date(book.createdAt).toLocaleDateString('ko-KR')}
        </p>
      </div>

      {book.sweetbook_book_uid || currentTemplate ? (
        <div className="form-card">
          <h2 className="section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>🎨 선택된 스타일</h2>
          {currentTemplate ? (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              {currentTemplate.thumbnails?.layout && (
                <img
                  src={currentTemplate.thumbnails.layout}
                  alt={currentTemplate.templateName}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb'
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#0ea5e9', marginBottom: '4px' }}>
                  {currentTemplate.theme || currentTemplate.templateName}
                </p>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                  {currentTemplate.templateName}
                </p>
                {!hasOrder && (
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => onStyleChange(book, records)}
                  >
                    <FiEdit3 size={12} /> 변경
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #e5e7eb' }}>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
                선택된 스타일이 없습니다.
              </p>
            </div>
          )}
        </div>
      ) : null}

      {!hasOrder && (
        <div className="form-card" style={{ marginTop: '24px' }}>
          <h2 className="section-title" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            새 기록 추가
            <button className="btn-secondary" onClick={() => setShowAddRecordForm(!showAddRecordForm)} style={{ fontSize: '12px', padding: '4px 10px' }}>
              {showAddRecordForm ? '닫기' : '열기'}
            </button>
          </h2>
          {showAddRecordForm && (
            <>
              <label className="file-input-label">
                <FiImage size={16} style={{ marginRight: '4px' }} />
                {newPhotoName ? newPhotoName : '사진을 선택해주세요'}
                <input type="file" accept="image/*" className="file-input" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setNewPhoto(file);
                    setNewPhotoName(file.name);
                  }
                }} />
              </label>
              {newPhoto && (
                <img
                  src={URL.createObjectURL(newPhoto)}
                  alt="미리보기"
                  style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }}
                />
              )}
              <textarea
                className="textarea"
                placeholder="이 순간을 기억하는 한 마디를 남겨보세요. (선택)"
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
                rows={3}
                style={{ marginBottom: '12px' }}
              />

              <button className="btn-primary" onClick={handleAddRecord} disabled={loadingAddRecord}>
                {loadingAddRecord ? '추가 중...' : '기록 추가하기'}
              </button>
            </>
          )}
        </div>
      )}

      <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FiImage size={20} /> 기록 목록
      </h2>
      {records.length === 0 && (
        <p className="empty-text">아직 기록이 없어요.</p>
      )}
      {!hasOrder && (
        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
          드래그 앤 드롭으로 페이지 순서를 바꿀 수 있어요.
        </p>
      )}
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
                      style={{ marginBottom: '12px', ...provided.draggableProps.style }}
                    >
                      <RecordItem
                        record={record}
                        onUpdated={fetchRecords}
                        onDeleted={fetchRecords} // Revert onDeleted to simple fetchRecords
                        isOrderComplete={hasOrder}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {records.length > 0 && hasOrder && (
        <button className="btn-primary" disabled style={{ marginTop: '24px', opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <FiCheck size={18} /> 주문 완료
        </button>
      )}
      {records.length > 0 && !hasOrder && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => onOrderRequest(book, records)} style={{ flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <FiShoppingCart size={18} /> 주문하기
          </button>
          {!currentTemplate && (
            <button className="btn-secondary" onClick={() => onStyleChange(book, records)} style={{ flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <FiEdit3 size={18} /> 스타일 선택
            </button>
          )}
        </div>
      )}
      {records.length === 0 && (
        <button className="btn-primary" disabled style={{ marginTop: '24px', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <FiShoppingCart size={18} /> 기록을 추가한 후 주문하기
        </button>
      )}
    </div>
  );
}

export default BookDetailPage;
