import { useState } from 'react';
import { createBook, getBooks } from './api';
import { FiBook } from 'react-icons/fi';
import MainPage from './pages/MainPage';
import NewBookPage from './pages/NewBookPage';
import StyleSelectPage from './pages/StyleSelectPage';
import BookDetailPage from './pages/BookDetailPage';
import OrderPage from './pages/OrderPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CompletePage from './pages/CompletePage';
import './App.css';

function App() {
  const [step, setStep] = useState('main');
  const [styleSelectSource, setStyleSelectSource] = useState('newBook'); // 'newBook' | 'bookDetail'
  const [bookTitle, setBookTitle] = useState('');
  const [recordIds, setRecordIds] = useState([]);
  const [bookId, setBookId] = useState(null);
  const [bookUid, setBookUid] = useState(null);
  const [orderUid, setOrderUid] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedOrderUid, setSelectedOrderUid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [styleSelectRecords, setStyleSelectRecords] = useState([]);

  const handleNewBookNext = (title, ids, id, records) => {
    setBookTitle(title);
    setRecordIds(ids);
    setBookId(id);
    setStyleSelectSource('newBook');
    setStyleSelectRecords(records || []);
    setStep('styleSelect');
  };

  const handleStyleChange = (book, records = []) => {
    setSelectedBook(book);
    setBookTitle(book.title);
    setBookId(book.id);
    setRecordIds(records.map(r => r.id) || []);
    setStyleSelectSource('bookDetail');
    setStyleSelectRecords(records);
    setStep('styleSelect');
  };

  const handleStyleNext = async (template) => {
    setLoading(true);
    try {
      // 기존 책의 기록들을 사용하여 새 sweetbook_book_uid 생성
      const res = await createBook(bookTitle, recordIds, template.templateUid, bookId);
      if (res.data.success) {
        const newBookUid = res.data.bookUid;
        const newTemplateUid = template.templateUid;
        setBookUid(newBookUid);
        // 선택된 책의 sweetbook_book_uid와 template_uid 업데이트
        setSelectedBook(prev => ({
          ...prev,
          sweetbook_book_uid: newBookUid,
          template_uid: newTemplateUid
        }));
        if (styleSelectSource === 'bookDetail') {
          setStep('bookDetail');
        } else {
          setStep('bookMade');
        }
      } else {
        alert('책 만들기에 실패했어요.');
      }
    } catch (err) {
      alert('책 만들기 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookDetail = async (book) => {
    // 최신 책 정보 가져오기 (template_uid 포함)
    try {
      const res = await getBooks();
      const latestBook = res.data.find(b => b.id === book.id);
      if (latestBook) {
        setSelectedBook(latestBook);
      } else {
        setSelectedBook(book);
      }
    } catch (err) {
      setSelectedBook(book);
    }
    setStep('bookDetail');
  };

  const handleOrderDetail = (order) => {
    setSelectedOrderUid(order.orderUid);
    setStep('orderDetail');
  };

  // 상세 페이지에서 주문 버튼 클릭
  // - sweetbook_book_uid 있으면 바로 주문
  // - 없으면 스타일 선택 → 책 생성 → 주문
  const handleOrderRequest = (book, records) => {
    if (book.sweetbook_book_uid) {
      setBookUid(book.sweetbook_book_uid);
      setBookId(book.id);
      setStep('order');
    } else {
      setBookTitle(book.title);
      setBookId(book.id);
      setRecordIds(records.map(r => r.id));
      setStyleSelectSource('bookDetail');
      setStep('styleSelect');
    }
  };

  const handleOrderComplete = (uid) => {
    setOrderUid(uid);
    setStep('complete');
  };

  if (loading) return (
    <div className="loading-screen">
      📖 책을 만들고 있어요...<br />잠시만 기다려주세요.
    </div>
  );

  return (
    <div className="app-container">
      <h1 className="app-title">📔 나의 기억 책</h1>
      <p className="app-subtitle">소중한 순간을 사진과 글로 담아, 나만의 책으로 만들어보세요.</p>

      {step === 'main' && (
        <MainPage onNewBook={() => setStep('newBook')} onBookDetail={handleBookDetail} onOrderDetail={handleOrderDetail} />
      )}

      {step === 'newBook' && (
        <NewBookPage
          onNext={handleNewBookNext}
          onBack={() => setStep('main')}
        />
      )}

      {step === 'styleSelect' && (
        <StyleSelectPage
          onNext={handleStyleNext}
          onBack={() => setStep(styleSelectSource === 'bookDetail' ? 'bookDetail' : 'newBook')}
          bookId={bookId}
          records={styleSelectRecords}
        />
      )}

      {step === 'bookMade' && (
        <CompletePage mode="book" onBack={() => setStep('main')} />
      )}

      {step === 'bookDetail' && selectedBook && (
        <BookDetailPage
          book={selectedBook}
          onBack={() => setStep('main')}
          onOrderRequest={handleOrderRequest}
          onStyleChange={handleStyleChange}
        />
      )}

      {step === 'order' && (
        <OrderPage
          bookUid={bookUid}
          bookId={bookId}
          onComplete={handleOrderComplete}
          onBack={() => setStep('bookDetail')}
        />
      )}

      {step === 'complete' && (
        <CompletePage mode="order" orderUid={orderUid} onBack={() => setStep('main')} />
      )}

      {step === 'orderDetail' && selectedOrderUid && (
        <OrderDetailPage
          orderUid={selectedOrderUid}
          onBack={() => setStep('main')}
        />
      )}
    </div>
  );
}

export default App;
