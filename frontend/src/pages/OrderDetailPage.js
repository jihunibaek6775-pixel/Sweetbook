import { useState, useEffect } from 'react';
import { getOrder } from '../api';

function OrderDetailPage({ orderUid, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrder(orderUid)
      .then(res => {
        if (res.data.success) {
          console.log('Order API Response:', res.data.data);
          setOrder(res.data.data);
        }
      })
      .catch(err => {
        console.error('Order fetch error:', err);
        setOrder(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderUid]);

  if (loading) {
    return (
      <div>
        <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '20px' }}>
          ← 뒤로가기
        </button>
        <p className="empty-text">주문 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '20px' }}>
          ← 뒤로가기
        </button>
        <p className="empty-text">주문 정보를 찾을 수 없어요.</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    if (status?.includes('완료') || status?.includes('배송')) return '#4caf50';
    if (status?.includes('진행') || status?.includes('결제')) return '#2196f3';
    return '#ff9800';
  };

  // items 기반 금액 계산 (payment 필드가 없을 때 대비)
  const calculateTotals = () => {
    if (!order.items) return { product: 0, shipping: 0, packaging: 0 };
    const productPrice = order.items.reduce((sum, item) =>
      sum + (item.subtotalPrice || item.unitPrice * (item.quantity || 1) || 0), 0
    );
    const shippingPrice = order.payment?.shippingPrice || 3000; // 기본값
    const packagingPrice = order.payment?.packagingPrice || 0;
    return { product: productPrice, shipping: shippingPrice, packaging: packagingPrice };
  };

  const totals = calculateTotals();

  return (
    <div>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '20px' }}>
        ← 뒤로가기
      </button>

      <div className="form-card">
        <h2 className="form-title">📦 주문 상세</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#a08c7d' }}>주문번호</p>
            <p style={{ fontSize: '14px', fontWeight: '500', marginTop: '4px' }}>{order.orderUid}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#a08c7d' }}>주문상태</p>
            <p style={{ fontSize: '14px', fontWeight: '500', marginTop: '4px', color: getStatusColor(order.orderStatusDisplay) }}>
              {order.orderStatusDisplay}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#a08c7d' }}>주문일시</p>
            <p style={{ fontSize: '14px', fontWeight: '500', marginTop: '4px' }}>
              {new Date(order.orderedAt).toLocaleDateString('ko-KR')} {new Date(order.orderedAt).toLocaleTimeString('ko-KR')}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#a08c7d' }}>결제금액</p>
            <p style={{ fontSize: '14px', fontWeight: '600', marginTop: '4px', color: '#5c4033' }}>
              ₩{order.payment?.totalPrice?.toLocaleString() || order.totalPrice?.toLocaleString() || '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="form-card">
        <h2 className="form-title" style={{ fontSize: '16px' }}>📚 주문 상품</h2>
        <div style={{ marginTop: '12px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e8e0d9', backgroundColor: '#f7f5f2' }}>
                <th style={{ padding: '8px', textAlign: 'left', color: '#5c4033' }}>Book UID</th>
                <th style={{ padding: '8px', textAlign: 'left', color: '#5c4033' }}>제목</th>
                <th style={{ padding: '8px', textAlign: 'center', color: '#5c4033' }}>페이지</th>
                <th style={{ padding: '8px', textAlign: 'center', color: '#5c4033' }}>수량</th>
                <th style={{ padding: '8px', textAlign: 'right', color: '#5c4033' }}>단가</th>
                <th style={{ padding: '8px', textAlign: 'right', color: '#5c4033' }}>소계</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e8e0d9' }}>
                  <td style={{ padding: '10px', fontSize: '11px', color: '#a08c7d' }}>
                    {item.bookUid || '-'}
                  </td>
                  <td style={{ padding: '10px', color: '#5c4033', fontWeight: '500' }}>
                    {item.title || item.bookTitle || '책'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#5c4033' }}>
                    {item.pages || '-'}p
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#5c4033' }}>
                    {item.quantity || 1}권
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#5c4033', fontWeight: '500' }}>
                    ₩{item.unitPrice?.toLocaleString() || item.price?.toLocaleString() || '-'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#5c4033', fontWeight: '600' }}>
                    ₩{(item.subtotalPrice || item.price)?.toLocaleString() || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="form-card">
        <h2 className="form-title" style={{ fontSize: '16px' }}>💰 금액</h2>
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e8e0d9' }}>
            <span style={{ color: '#a08c7d' }}>상품가</span>
            <span style={{ color: '#5c4033', fontWeight: '500' }}>
              ₩{(order.payment?.productPrice || totals.product)?.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e8e0d9' }}>
            <span style={{ color: '#a08c7d' }}>배송비</span>
            <span style={{ color: '#5c4033', fontWeight: '500' }}>
              ₩{(order.payment?.shippingPrice || totals.shipping)?.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e8e0d9' }}>
            <span style={{ color: '#a08c7d' }}>포장비</span>
            <span style={{ color: '#5c4033', fontWeight: '500' }}>
              ₩{(order.payment?.packagingPrice || totals.packaging)?.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '2px solid #e8e0d9' }}>
            <span style={{ color: '#5c4033', fontWeight: '600' }}>합계</span>
            <span style={{ color: '#5c4033', fontWeight: '700', fontSize: '16px' }}>
              ₩{((order.payment?.productPrice || totals.product) + (order.payment?.shippingPrice || totals.shipping) + (order.payment?.packagingPrice || totals.packaging))?.toLocaleString()}
            </span>
          </div>
          {order.payment?.vat && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '12px', color: '#a08c7d' }}>
              <span>결제금액 (VAT 포함)</span>
              <span style={{ color: '#5c4033', fontWeight: '600' }}>₩{order.payment.vat?.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="form-card">
        <h2 className="form-title" style={{ fontSize: '16px' }}>🚚 배송 정보</h2>
        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#a08c7d' }}>수령인</p>
            <p style={{ fontSize: '13px', color: '#5c4033', marginTop: '4px', fontWeight: '500' }}>
              {order.shipping?.recipientName || '-'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#a08c7d' }}>연락처</p>
            <p style={{ fontSize: '13px', color: '#5c4033', marginTop: '4px', fontWeight: '500' }}>
              {order.shipping?.recipientPhone || '-'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#a08c7d' }}>우편번호</p>
            <p style={{ fontSize: '13px', color: '#5c4033', marginTop: '4px', fontWeight: '500' }}>
              {order.shipping?.postalCode || '-'}
            </p>
          </div>
          <div></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={{ fontSize: '12px', color: '#a08c7d' }}>주소</p>
            <p style={{ fontSize: '13px', color: '#5c4033', marginTop: '4px', fontWeight: '500' }}>
              {order.shipping?.address1 || '-'} {order.shipping?.address2 || ''}
            </p>
          </div>
          {order.shipping?.memo && (
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontSize: '12px', color: '#a08c7d' }}>배송메모</p>
              <p style={{ fontSize: '13px', color: '#5c4033', marginTop: '4px' }}>
                {order.shipping.memo}
              </p>
            </div>
          )}
        </div>
      </div>

      {order.timeline && order.timeline.length > 0 && (
        <div className="form-card">
          <h2 className="form-title" style={{ fontSize: '16px' }}>📋 주문 진행 상황</h2>
          <div style={{ marginTop: '12px' }}>
            {order.timeline.map((event, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: '#f7f5f2',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#5c4033', fontWeight: '500', marginBottom: '4px' }}>
                    {event.status || event.statusDisplay}
                  </p>
                  <p style={{ color: '#a08c7d', fontSize: '12px' }}>
                    {new Date(event.timestamp || event.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetailPage;
