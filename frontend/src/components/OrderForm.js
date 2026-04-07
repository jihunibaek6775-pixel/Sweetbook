import { useState } from 'react';
import { createOrder } from '../api';

function OrderForm({ bookUid, onOrderComplete }) {
  const [form, setForm] = useState({
    recipientName: '',
    recipientPhone: '',
    postalCode: '',
    address1: '',
    address2: '',
    memo: '',
  });
  const [loading, setLoading] = useState(false);

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
      const res = await createOrder(bookUid, 1, form);
      if (res.data.success) {
        onOrderComplete(res.data.data.orderUid);
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
    <div className="form-card">
      <h2 className="form-title">🚚 배송 정보 입력</h2>
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
  );
}

export default OrderForm;