import { useState, useEffect } from 'react';
import { createOrder, getEstimate } from '../api';
import { FiArrowLeft } from 'react-icons/fi';

function OrderPage({ bookUid, bookId, onComplete, onBack }) {
  const [form, setForm] = useState({
    recipientName: '',
    recipientPhone: '',
    postalCode: '',
    address1: '',
    address2: '',
    memo: '',
  });
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);

  useEffect(() => {
    if (!bookUid) return;
    getEstimate(bookUid).then(res => {
      if (res.data.success) setEstimate(res.data.data);
    }).catch(() => {});
  }, [bookUid]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.recipientName || !form.recipientPhone || !form.postalCode || !form.address1) {
      return alert('필수 항목을 모두 입력해주세요.');
    }
    setLoading(true);
    try {
      const res = await createOrder(bookUid, bookId, 1, form);
      if (res.data.success) {
        onComplete(res.data.data.orderUid);
      } else {
        alert('주문 생성에 실패했어요.');
      }
    } catch (err) {
      alert('주문 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FiArrowLeft size={16} /> 뒤로가기
      </button>

      {/* 가격 견적 */}
      {estimate && (
        <div className="form-card" style={{ marginBottom: '20px' }}>
          <h2 className="form-title">💰 주문 금액</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {estimate.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#374151' }}>
                <span>도서 ({item.pageCount}p × {item.quantity}권)</span>
                <span>{item.itemAmount?.toLocaleString()}원</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#374151' }}>
              <span>배송비</span>
              <span>{estimate.shippingFee === 0 ? '무료' : `${estimate.shippingFee?.toLocaleString()}원`}</span>
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '700', color: '#0ea5e9' }}>
              <span>총 결제 금액</span>
              <span>{estimate.totalAmount?.toLocaleString()}원</span>
            </div>
            {estimate.creditSufficient === false && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                충전금이 부족해요. 파트너 포털에서 충전해주세요.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="form-card">
        <h2 className="form-title">배송 정보 입력</h2>
        <form onSubmit={handleSubmit}>
          <input className="input" name="recipientName" placeholder="수령인 이름 *" value={form.recipientName} onChange={handleChange} />
          <input className="input" name="recipientPhone" placeholder="연락처 (010-1234-5678) *" value={form.recipientPhone} onChange={handleChange} />
          <input className="input" name="postalCode" placeholder="우편번호 *" value={form.postalCode} onChange={handleChange} />
          <input className="input" name="address1" placeholder="주소 *" value={form.address1} onChange={handleChange} />
          <input className="input" name="address2" placeholder="상세주소" value={form.address2} onChange={handleChange} />
          <input className="input" name="memo" placeholder="배송 메모 (선택)" value={form.memo} onChange={handleChange} />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '주문 중...' : '주문하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OrderPage;
