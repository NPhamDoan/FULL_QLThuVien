import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Alert, Popconfirm, Space, Tag, Select, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { bookApi } from '../services/api';
import axios from 'axios';

interface BookRecord {
  maSach: string;
  tieuDe: string;
  tacGia: string;
  tinhTrang: string;
}

const tinhTrangConfig: Record<string, { label: string; color: string }> = {
  SAN_SANG: { label: 'Sẵn sàng', color: 'green' },
  DA_MUON: { label: 'Đã mượn', color: 'orange' },
  BAO_TRI: { label: 'Bảo trì', color: 'blue' },
  MAT: { label: 'Mất', color: 'red' },
};

type SearchType = 'tieuDe' | 'tacGia' | 'maSach';

export default function BooksPage() {
  const [allBooks, setAllBooks] = useState<BookRecord[]>([]);
  const [displayBooks, setDisplayBooks] = useState<BookRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchType, setSearchType] = useState<SearchType>('tieuDe');
  const [keyword, setKeyword] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookRecord | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await bookApi.list();
      const books = Array.isArray(data) ? data : [];
      setAllBooks(books);
      if (!isSearching) setDisplayBooks(books);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Lỗi khi tải danh sách sách');
      } else {
        setError('Lỗi khi tải danh sách sách');
      }
    } finally {
      setLoading(false);
    }
  }, [isSearching]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setIsSearching(false);
      setDisplayBooks(allBooks);
      return;
    }
    setSearchLoading(true);
    setIsSearching(true);
    try {
      const params: Record<string, string> = { [searchType]: keyword.trim() };
      const { data } = await bookApi.search(params);
      setDisplayBooks(Array.isArray(data) ? data : []);
    } catch {
      setDisplayBooks([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setKeyword('');
    setIsSearching(false);
    setDisplayBooks(allBooks);
  };

  const openAddModal = () => {
    setEditingBook(null);
    setModalError(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (book: BookRecord) => {
    setEditingBook(book);
    setModalError(null);
    form.setFieldsValue({ tieuDe: book.tieuDe, tacGia: book.tacGia });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      setModalError(null);
      if (editingBook) {
        await bookApi.update(editingBook.maSach, { tieuDe: values.tieuDe, tacGia: values.tacGia });
      } else {
        await bookApi.create({ tieuDe: values.tieuDe, tacGia: values.tacGia });
      }
      setModalOpen(false);
      form.resetFields();
      setIsSearching(false);
      setKeyword('');
      fetchBooks();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setModalError(err.response?.data?.error || 'Lỗi khi lưu thông tin sách');
      } else if (err instanceof Error && 'errorFields' in err) {
        // form validation
      } else {
        setModalError('Lỗi khi lưu thông tin sách');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (maSach: string) => {
    try {
      await bookApi.delete(maSach);
      fetchBooks();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        Modal.error({ title: 'Không thể xóa', content: err.response?.data?.error || 'Lỗi khi xóa sách' });
      }
    }
  };

  const columns = [
    { title: 'Mã sách', dataIndex: 'maSach', key: 'maSach', width: 110 },
    { title: 'Tiêu đề', dataIndex: 'tieuDe', key: 'tieuDe' },
    { title: 'Tác giả', dataIndex: 'tacGia', key: 'tacGia' },
    {
      title: 'Tình trạng', dataIndex: 'tinhTrang', key: 'tinhTrang', width: 120,
      render: (val: string) => {
        const cfg = tinhTrangConfig[val];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{val}</Tag>;
      },
    },
    {
      title: 'Thao tác', key: 'actions', width: 160,
      render: (_: unknown, record: BookRecord) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEditModal(record)}>Sửa</Button>
          <Popconfirm title="Xác nhận xóa sách này?" onConfirm={() => handleDelete(record.maSach)} okText="Xóa" cancelText="Hủy">
            <Button icon={<DeleteOutlined />} size="small" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header: Search + Add */}
      <Row gutter={16} align="middle" style={{ marginBottom: 20 }}>
        <Col flex="auto">
          <Space.Compact style={{ width: '100%' }}>
            <Select
              value={searchType}
              onChange={(v) => setSearchType(v)}
              style={{ width: 130 }}
              options={[
                { value: 'tieuDe', label: 'Tiêu đề' },
                { value: 'tacGia', label: 'Tác giả' },
                { value: 'maSach', label: 'Mã sách' },
              ]}
            />
            <Input
              placeholder="Tìm kiếm sách..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              onClear={handleClearSearch}
              style={{ maxWidth: 360 }}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={searchLoading}>
              Tìm
            </Button>
          </Space.Compact>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>Thêm sách</Button>
        </Col>
      </Row>

      {isSearching && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color="blue">Kết quả tìm kiếm: {displayBooks.length} sách</Tag>
          <Button type="link" size="small" onClick={handleClearSearch}>Xóa bộ lọc</Button>
        </div>
      )}

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      <Table
        columns={columns}
        dataSource={displayBooks}
        rowKey="maSach"
        loading={loading || searchLoading}
        locale={{ emptyText: isSearching ? 'Không tìm thấy sách phù hợp' : 'Chưa có sách nào' }}
        pagination={{ pageSize: 10 }}
        size="small"
      />

      <Modal
        title={editingBook ? 'Sửa thông tin sách' : 'Thêm sách mới'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        confirmLoading={modalLoading}
        okText={editingBook ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
      >
        {modalError && <Alert message={modalError} type="error" showIcon style={{ marginBottom: 12 }} />}
        <Form form={form} layout="vertical">
          <Form.Item name="tieuDe" label="Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề sách' }]}>
            <Input placeholder="Nhập tiêu đề sách" />
          </Form.Item>
          <Form.Item name="tacGia" label="Tác giả" rules={[{ required: true, message: 'Vui lòng nhập tên tác giả' }]}>
            <Input placeholder="Nhập tên tác giả" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
