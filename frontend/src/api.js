import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// 책 초안 생성
export const createBookDraft = (title) => {
  return api.post(`/books/draft?title=${encodeURIComponent(title)}`);
};

// 책 목록 조회
export const getBooks = () => {
  return api.get('/books');
};

// 책 이름 수정
export const updateBookTitle = (bookId, title) => {
  return api.patch(`/books/${bookId}/title`, { title });
};

// 책 삭제
export const deleteBook = (bookId) => {
  return api.delete(`/books/${bookId}`);
};

// 스위트북 API로 책 최종 생성
export const createBook = (title, recordIds, templateUid, bookId) => {
  return api.post('/books/create', {
    title,
    record_ids: recordIds,
    template_uid: templateUid,
    book_id: bookId,
  });
};

// 기록 추가 (book_id 포함)
export const createRecord = (formData) => {
  return api.post('/records', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// 책별 기록 조회
export const getRecords = (bookId) => {
  return api.get(`/records/${bookId}`);
};

// 기록 수정
export const updateRecord = (recordId, formData) => {
  return api.patch(`/records/${recordId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// 기록 삭제
export const deleteRecord = (recordId) => {
  return api.delete(`/records/${recordId}`);
};

// 주문 생성
export const createOrder = (bookUid, bookId, quantity, shipping) => {
  return api.post('/orders', {
    bookUid,
    bookId,
    quantity,
    shipping,
  });
};

// 주문 목록 조회
export const getOrders = () => {
  return api.get('/orders');
};

// 주문 상세 조회
export const getOrder = (orderUid) => {
  return api.get(`/orders/${orderUid}`);
};

// 배송지 수정
export const updateShipping = (orderUid, shippingData) => {
  return api.patch(`/orders/${orderUid}/shipping`, shippingData);
};

// 템플릿 목록 조회
export const getTemplates = () => {
  return api.get('/templates/list', {
    params: { templateKind: 'content' }
  });
};

// 표지 사진 업로드
export const uploadCoverPhoto = (bookId, formData) => {
  return api.post(`/books/${bookId}/cover-photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// 가격 견적 조회
export const getEstimate = (bookUid) => {
  return api.get(`/orders/estimate/${bookUid}`);
};

// 기록 순서 변경
export const reorderRecords = (bookId, recordIds) => {
  return api.patch(`/books/${bookId}/records/reorder`, { record_ids: recordIds });
};