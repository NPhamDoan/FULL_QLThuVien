import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Alert, Popconfirm, Space, Tag, Select, Row, Col, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { bookApi } from '../services/api';
import axios from 'axios';

interface BookRecord {
  maSach: string;
  tieuDe: string;
  tacGia: string;
  soBanSao: number;
  soMat: number;
  soBaoTri: number;
  soDangMuon: number;
  soKhaDung: number;
}

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
    form.setFieldsValue({ soBanSao: 1 });
    setModalOpen(true);
  };

  const openEditModal = (book: BookRecord) => {
    setEditingBook(book);
    setModalError(null);
    form.setFieldsValue({
      tieuDe: book.tieuDe,
      tacGia: book.tacGia,
      soBanSao: book.soBanSao,
      soMat: book.soMat,
      soBaoTri: book.soBaoTri,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      setModalError(null);
      if (editingBook) {
        await bookApi.update(editingBook.maSach, {
          tieuDe: values.tieuDe,
          tacGia: values.tacGia,
          soBanSao: values.soBanSao,
          soMat: values.soMat,
          soBaoTri: values.soBaoTri,
        });
      } else {
        await bookApi.create({
          tieuDe: values.tieuDe,
          tacGia: values.tacGia,
          soBanSao: values.soBanSao ?? 1,
        });
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
    { title: 'Mã sách', dataIndex: 'maSach', key: 'maSach', width: 100 },
    { title: 'Tiêu đề', dataIndex: 'tieuDe', key: 'tieuDe' },
    { title: 'Tác giả', dataIndex: 'tacGia', key: 'tacGia', width: 180 },
    {
      title: 'Khả dụng', key: 'soKhaDung', width: 110,
      render: (_: unknown, r: BookRecord) => {
        const color = r.soKhaDung > 0 ? 'green' : 'red';
        return (
          <Tooltip title={`${r.soBanSao} bản - ${r.soDangMuon} mượn - ${r.soBaoTri} bảo trì - ${r.soMat} mất`}>
            <Tag color={color}>{r.soKhaDung} / {r.soBanSao}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Đang mượn', dataIndex: 'soDangMuon', key: 'soDangMuon', width: 90,
      render: (v: number) => v > 0 ? <Tag color="orange">{v}</Tag> : <span style={{ color: '#94A3B8' }}>0</span>,
    },
    {
      title: 'Bảo trì', dataIndex: 'soBaoTri', key: 'soBaoTri', width: 80,
      render: (v: number) => v > 0 ? <Tag color="blue">{v}</Tag> : <span style={{ color: '#94A3B8' }}>0</span>,
    },
    {
      title: 'Mất', dataIndex: 'soMat', key: 'soMat', width: 70,
      render: (v: number) => v > 0 ? <Tag color="red">{v}</Tag> : <span style={{ color: '#94A3B8' }}>0</span>,
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
          <Row gutter={12}>
            <Col span={editingBook ? 8 : 24}>
              <Form.Item
                name="soBanSao"
                label="Tổng số bản"
                rules={[{ required: true, message: 'Bắt buộc' }]}
                tooltip="Tổng số bản của đầu sách này mà thư viện sở hữu"
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            {editingBook && (
              <>
                <Col span={8}>
                  <Form.Item
                    name="soBaoTri"
                    label="Đang bảo trì"
                    tooltip="Số bản đang sửa chữa, không cho mượn"
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="soMat"
                    label="Đã mất"
                    tooltip="Số bản bị mất không thể khôi phục"
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
          {editingBook && (
            <Alert
              type="info"
              message={`Khả dụng = ${editingBook.soBanSao} - ${editingBook.soMat} mất - ${editingBook.soBaoTri} bảo trì - ${editingBook.soDangMuon} đang mượn = ${editingBook.soKhaDung}`}
              style={{ marginTop: 8 }}
            />
          )}
        </Form>
      </Modal>
    </div>
  );
}
