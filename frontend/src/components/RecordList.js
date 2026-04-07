import { useState } from 'react';

function RecordList({ records, onCreateBook }) {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <h2>내 기록 목록</h2>
      {records.length === 0 && <p>아직 기록이 없어요. 첫 기록을 남겨보세요!</p>}
      {records.map((record) => (
        <div key={record.id} style={{ border: '1px solid #ccc', margin: '8px', padding: '8px' }}>
          <input
            type="checkbox"
            checked={selectedIds.includes(record.id)}
            onChange={() => toggleSelect(record.id)}
          />
          <img
            src={`http://127.0.0.1:8000/uploads/${record.photo_path.split('/').pop()}`}
            alt="기록사진"
            style={{ width: '100px', height: '100px', objectFit: 'cover', margin: '0 8px' }}
          />
          <span>{record.memo}</span>
          <span style={{ marginLeft: '8px', color: '#999', fontSize: '12px' }}>
            {new Date(record.created_at).toLocaleDateString('ko-KR')}
          </span>
        </div>
      ))}
      {records.length > 0 && (
        <button
          onClick={() => onCreateBook(selectedIds)}
          disabled={selectedIds.length === 0}
        >
          선택한 기록으로 책 만들기 ({selectedIds.length}개)
        </button>
      )}
    </div>
  );
}

export default RecordList;