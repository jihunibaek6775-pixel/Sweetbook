import { FiCheck, FiArrowLeft } from 'react-icons/fi';

function CompletePage({ mode, orderUid, onBack }) {
  if (mode === 'book') {
    return (
      <div className="complete-card">
        <div className="complete-icon">
          <FiCheck size={48} style={{ color: '#0ea5e9' }} />
        </div>
        <h2 className="complete-title">책이 완성됐어요!</h2>
        <p className="complete-order" style={{ marginBottom: '32px' }}>
          내 책 목록에서 완성된 책을 확인하고<br />
          주문까지 진행해보세요.
        </p>
        <button className="btn-primary" onClick={onBack}>
          내 책 목록 보기
        </button>
      </div>
    );
  }

  return (
    <div className="complete-card">
      <div className="complete-icon">
        <FiCheck size={48} style={{ color: '#10b981' }} />
      </div>
      <h2 className="complete-title">주문이 완료됐어요!</h2>
      <p className="complete-order">주문번호: {orderUid}</p>
      <p className="complete-order" style={{ marginBottom: '32px' }}>
        입력하신 주소로 배송될 예정이에요.<br />
        소중한 기억이 책이 되어 곧 도착할 거예요. 📖
      </p>
      <button className="btn-secondary" onClick={onBack}>
        메인으로 돌아가기
      </button>
    </div>
  );
}

export default CompletePage;
