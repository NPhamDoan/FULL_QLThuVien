import { useState, useEffect } from 'react';
import { Table, Button, Typography, message, Tag, Space } from 'antd';
import { DownloadOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { backupApi } from '../services/api';

interface BackupFile {
  name: string;
  size: number;
  mtime: string;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const { data } = await backupApi.list();
      setBackups(data.data);
    } catch {
      message.error('Không tải được danh sách backup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBackups(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await backupApi.create();
      message.success('Tạo backup thành công');
      fetchBackups();
    } catch {
      message.error('Tạo backup thất bại');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (name: string) => {
    try {
      await backupApi.download(name);
    } catch {
      message.error('Tải xuống thất bại');
    }
  };

  const formatSize = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
  const formatDate = (iso: string) => new Date(iso).toLocaleString('vi-VN');

  const columns = [
    { title: 'Tên file', dataIndex: 'name', key: 'name' },
    {
      title: 'Kích thước', dataIndex: 'size', key: 'size', width: 120,
      render: (v: number) => formatSize(v),
    },
    {
      title: 'Thời gian tạo', dataIndex: 'mtime', key: 'mtime', width: 200,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Trạng thái', key: 'status', width: 120,
      render: (_: unknown, r: BackupFile, i: number) =>
        i === 0 ? <Tag color="green">Mới nhất</Tag> : <Tag>Cũ</Tag>,
    },
    {
      title: '', key: 'action', width: 140,
      render: (_: unknown, r: BackupFile) => (
        <Button
          type="primary"
          size="small"
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(r.name)}
        >
          Tải xuống
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Button icon={<ReloadOutlined />} onClick={fetchBackups} loading={loading}>
          Làm mới
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} loading={creating}>
          Tạo backup ngay
        </Button>
      </div>

      <div style={{ marginBottom: 12, color: '#64748B', fontSize: 13 }}>
        <Typography.Text type="secondary">
          Hệ thống tự động backup mỗi 24 giờ (chỉ chạy trên production). Giữ tối đa 7 bản gần nhất.
        </Typography.Text>
      </div>

      <Table
        columns={columns}
        dataSource={backups}
        rowKey="name"
        loading={loading}
        pagination={false}
        locale={{ emptyText: 'Chưa có backup nào' }}
      />
    </div>
  );
}
