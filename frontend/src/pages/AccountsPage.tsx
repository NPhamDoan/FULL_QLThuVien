import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, LockOutlined, UnlockOutlined, KeyOutlined, DeleteOutlined } from '@ant-design/icons';
import { accountApi } from '../services/api';
import { VaiTro, TrangThaiTaiKhoan, type VaiTroType, type TrangThaiTaiKhoanType } from '../constants';

interface Account {
  maTaiKhoan: string;
  tenDangNhap: string;
  vaiTro: VaiTroType;
  trangThai: TrangThaiTaiKhoanType;
  createdAt: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await accountApi.list();
      setAccounts(data.data);
    } catch {
      message.error('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleCreate = async (values: { tenDangNhap: string; matKhau: string; vaiTro: string }) => {
    try {
      const { data } = await accountApi.create(values);
      if (data.success) {
        message.success('Tạo tài khoản thành công');
        setCreateOpen(false);
        form.resetFields();
        fetchAccounts();
      } else {
        message.error(data.error);
      }
    } catch {
      message.error('Tạo tài khoản thất bại');
    }
  };

  const handleToggleStatus = async (record: Account) => {
    const newStatus = record.trangThai === TrangThaiTaiKhoan.HOAT_DONG ? TrangThaiTaiKhoan.BI_KHOA : TrangThaiTaiKhoan.HOAT_DONG;
    try {
      await accountApi.updateStatus(record.maTaiKhoan, newStatus);
      message.success(newStatus === TrangThaiTaiKhoan.BI_KHOA ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      fetchAccounts();
    } catch {
      message.error('Cập nhật thất bại');
    }
  };

  const handleResetPassword = async (values: { matKhau: string }) => {
    try {
      await accountApi.resetPassword(selectedAccount, values.matKhau);
      message.success('Đổi mật khẩu thành công');
      setPasswordOpen(false);
      passwordForm.resetFields();
    } catch {
      message.error('Đổi mật khẩu thất bại');
    }
  };

  const handleDelete = async (maTaiKhoan: string) => {
    try {
      await accountApi.delete(maTaiKhoan);
      message.success('Xóa tài khoản thành công');
      fetchAccounts();
    } catch {
      message.error('Xóa tài khoản thất bại');
    }
  };

  const columns = [
    { title: 'Mã TK', dataIndex: 'maTaiKhoan', key: 'maTaiKhoan', width: 100 },
    { title: 'Tên đăng nhập', dataIndex: 'tenDangNhap', key: 'tenDangNhap' },
    {
      title: 'Vai trò', dataIndex: 'vaiTro', key: 'vaiTro',
      render: (v: string) => v === VaiTro.QUAN_TRI_VIEN
        ? <Tag color="purple">Quản trị viên</Tag>
        : <Tag color="blue">Thủ thư</Tag>,
    },
    {
      title: 'Trạng thái', dataIndex: 'trangThai', key: 'trangThai',
      render: (v: string) => v === TrangThaiTaiKhoan.HOAT_DONG
        ? <Tag color="green">Hoạt động</Tag>
        : <Tag color="red">Bị khóa</Tag>,
    },
    {
      title: 'Hành động', key: 'actions',
      render: (_: unknown, record: Account) => (
        <Space>
          <Button
            size="small"
            icon={record.trangThai === TrangThaiTaiKhoan.HOAT_DONG ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.trangThai === TrangThaiTaiKhoan.HOAT_DONG ? 'Khóa' : 'Mở khóa'}
          </Button>
          <Button
            size="small"
            icon={<KeyOutlined />}
            onClick={() => { setSelectedAccount(record.maTaiKhoan); setPasswordOpen(true); }}
          >
            Đổi MK
          </Button>
          <Popconfirm title="Xóa tài khoản này?" onConfirm={() => handleDelete(record.maTaiKhoan)}>
            <Button size="small" danger icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Tạo tài khoản
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={accounts}
        rowKey="maTaiKhoan"
        loading={loading}
        pagination={false}
      />

      {/* Create Account Modal */}
      <Modal
        title="Tạo tài khoản mới"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="tenDangNhap" label="Tên đăng nhập" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="matKhau" label="Mật khẩu" rules={[{ required: true, message: 'Bắt buộc' }, { min: 6, message: 'Tối thiểu 6 ký tự' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="vaiTro" label="Vai trò" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Select>
              <Select.Option value="THU_THU">Thủ thư</Select.Option>
              <Select.Option value="QUAN_TRI_VIEN">Quản trị viên</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        title="Đổi mật khẩu"
        open={passwordOpen}
        onCancel={() => { setPasswordOpen(false); passwordForm.resetFields(); }}
        onOk={() => passwordForm.submit()}
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleResetPassword}>
          <Form.Item name="matKhau" label="Mật khẩu mới" rules={[{ required: true, message: 'Bắt buộc' }, { min: 6, message: 'Tối thiểu 6 ký tự' }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
