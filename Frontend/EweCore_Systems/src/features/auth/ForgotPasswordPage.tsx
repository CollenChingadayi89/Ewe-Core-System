import { Form, Input, Button, Card, message, Result } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface ForgotPasswordFormData {
  email: string;
}

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: ForgotPasswordFormData) => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      message.success('Password reset link sent to your email');
    }, 1000);
  };

  if (submitted) {
    return (
      <Card>
        <Result
          status="success"
          title="Check Your Email"
          subTitle="We've sent you a password reset link. Please check your email inbox."
          extra={[
            <Button type="primary" key="login" onClick={() => navigate('/login')}>
              Back to Login
            </Button>,
          ]}
        />
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>Forgot Password?</h2>
        <p style={{ color: '#8c8c8c', margin: '8px 0 0' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <Form
        name="forgot-password"
        onFinish={onFinish}
        autoComplete="off"
        layout="vertical"
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="your.email@ewesacco.org"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Send Reset Link
          </Button>
        </Form.Item>

        <Form.Item>
          <Button type="link" block onClick={() => navigate('/login')}>
            Back to Login
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
