import { useState, useEffect } from 'react';
import { getBooks, getOrders } from '../api';
import { FiBook, FiPackage, FiChevronRight } from 'react-icons/fi';

function MainPage({ onNewBook, onBookDetail, onOrderDetail }) {
  const [tab, setTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getBooks().then(res => {
      setBooks(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'orders') {
      getOrders().then(res => {
        if (res.data.success) {
          setOrders(res.data.data.items || []);
        }
      }).catch(() => {
        setOrders([]);
      });
    }
  }, [tab]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          className={tab === 'books' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => setTab('books')}
        >
          <FiBook size={18} /> 내 책 목록
        </button>
        <button
          className={tab === 'orders' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => setTab('orders')}
        >
          <FiPackage size={18} /> 주문 내역
        </button>
      </div>

      {tab === 'books' && (
        <div>
          {books.length === 0 && (
            <p className="empty-text">아직 만든 책이 없어요. 첫 책을 만들어보세요!</p>
          )}
          {books.map((book) => (
            <div key={book.id} className="record-card" onClick={() => onBookDetail(book)} style={{ cursor: 'pointer' }}>
              <div className="record-info">
                <p className="record-memo" style={{ fontFamily: 'Nanum Myeongjo, serif', fontSize: '16px' }}>
                  {book.title}
                </p>
                <p className="record-date">
                  기록 {book.recordCount}개 · {new Date(book.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <FiChevronRight size={20} style={{ color: '#0ea5e9' }} />
            </div>
          ))}
          <button className="btn-book" onClick={onNewBook} style={{ marginTop: '16px' }}>
            + 새 책 만들기
          </button>
        </div>
      )}

      {tab === 'orders' && (
        <div>
          {orders.length === 0 && (
            <p className="empty-text">아직 주문 내역이 없어요.</p>
          )}
          {orders.map((order) => (
            <div key={order.orderUid} className="record-card" onClick={() => onOrderDetail(order)} style={{ cursor: 'pointer' }}>
              <div className="record-info">
                <p className="record-memo">{order.bookTitle}</p>
                <p className="record-date">
                  {order.orderStatusDisplay} · {new Date(order.orderedAt).toLocaleDateString('ko-KR')}
                </p>
                <p className="record-date">주문번호: {order.orderUid}</p>
              </div>
              <FiChevronRight size={20} style={{ color: '#0ea5e9' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MainPage;