import { Form, Input, Button, message, Checkbox } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';

// Place ewe-core-icon.png in your assets folder (e.g. src/assets/)
// and update the import path below.
import eweCoreIcon from '../../assets/ewe-core-icon.png';
import formBackground from '../../assets/geometric-background-with-copy-space.jpg';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    try {
      const success = await login(values.email, values.password);

      if (success) {
        message.success('Login successful!');
        navigate('/dashboard');
      } else {
        message.error('Invalid email or password');
      }
    } catch (error) {
      message.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ewe-login">
      {/* All styling for this page lives here, scoped under .ewe-login */}
      <style>{`
        /* Break out of Vite's default #root centering/max-width/padding,
           whatever the rest of the app's global CSS does to it. */
        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
          max-width: none;
          display: block;
          place-items: unset;
          text-align: left;
        }

        .ewe-login {
          --ewe-green-deep: #0b3d2b;
          --ewe-green-mid: #0f5132;
          --ewe-gold: #d1a13f;
          --ewe-gold-soft: #e9cd86;
          --ewe-cream: #f7f6f2;
          --ewe-ink: #16261f;
          --ewe-muted: #6b7d74;

          position: fixed;
          inset: 0;
          display: grid;
          grid-template-columns: minmax(320px, 38%) 1fr;
          width: 100vw;
          height: 100vh;
          overflow-y: auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: var(--ewe-ink);
        }

        /* Left — branded panel */
        .ewe-login__brand {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 56px 48px;
          overflow: hidden;
          background:
            radial-gradient(circle at 15% 12%, rgba(233, 205, 134, 0.10), transparent 45%),
            linear-gradient(155deg, var(--ewe-green-deep) 0%, var(--ewe-green-mid) 100%);
          color: #fff;
        }

        .ewe-login__texture {
          position: absolute;
          inset: 0;
          opacity: 0.08;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='96' viewBox='0 0 84 96'%3E%3Cpath d='M42 1 L83 24 V72 L42 95 L1 72 V24 Z' fill='none' stroke='%23F7F6F2' stroke-width='1'/%3E%3C/svg%3E");
          background-size: 84px 96px;
        }

        .ewe-login__brand-top { position: relative; z-index: 1; }

        .ewe-login__mark {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 44px;
        }

        .ewe-login__mark img {
          width: 300px;
          height: 300px;
          border-radius: 16px;
          display: block;
        }

        .ewe-login__wordmark {
          font-size: 25px;
          font-weight: 700;
          letter-spacing: 0.02em;
          line-height: 1;
        }

        .ewe-login__wordmark span { color: var(--ewe-gold); }

        .ewe-login__wordmark small {
          display: block;
          margin-top: 7px;
          font-size: 11.5px;
          font-weight: 500;
          letter-spacing: 0.14em;
          color: rgba(247, 246, 242, 0.6);
        }

        .ewe-login__headline {
          max-width: 380px;
          font-size: 28px;
          line-height: 1.3;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0 0 18px;
        }

        .ewe-login__subhead {
          max-width: 340px;
          font-size: 14.5px;
          line-height: 1.65;
          color: rgba(247, 246, 242, 0.72);
          margin: 0;
        }

        .ewe-login__features {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 36px;
        }

        .ewe-login__feature {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: rgba(247, 246, 242, 0.88);
        }

        .ewe-login__feature-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--ewe-gold);
          flex-shrink: 0;
        }

        .ewe-login__brand-bottom {
          position: absolute;
          z-index: 1;
          left: 48px;
          right: 48px;
          bottom: 32px;
          padding-top: 16px;
          border-top: 1px solid rgba(247, 246, 242, 0.14);
          font-size: 12.5px;
          color: rgba(247, 246, 242, 0.5);
        }

        /* Right — form panel */
        .ewe-login__form-side {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background-size: cover;
          background-position: center;
          padding: 40px;
        }

        .ewe-login__form-side::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(247, 246, 242, 0.90);
        }

        .ewe-login__form-wrap {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 380px;
        }

        .ewe-login__form-header { margin-bottom: 36px; }

        .ewe-login__form-header h1 {
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 8px;
          color: var(--ewe-green-deep);
          letter-spacing: -0.01em;
        }

        .ewe-login__form-header p {
          margin: 0;
          font-size: 14.5px;
          color: var(--ewe-muted);
          line-height: 1.5;
        }

        .ewe-login .ant-form-item-label > label {
          font-size: 13px;
          font-weight: 600;
          color: var(--ewe-ink);
        }

        .ewe-login .ant-input-affix-wrapper,
        .ewe-login .ant-input {
          border-radius: 8px;
          border-color: #dfe3df;
          background: #fff;
          padding-top: 10px;
          padding-bottom: 10px;
        }

        .ewe-login .ant-input-affix-wrapper:hover,
        .ewe-login .ant-input:hover { border-color: var(--ewe-gold); }

        .ewe-login .ant-input-affix-wrapper-focused,
        .ewe-login .ant-input-affix-wrapper:focus-within {
          border-color: var(--ewe-green-mid) !important;
          box-shadow: 0 0 0 3px rgba(15, 81, 50, 0.12) !important;
        }

        .ewe-login .ant-input-prefix { color: var(--ewe-muted); margin-right: 10px; }

        .ewe-login__row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .ewe-login__row a {
          font-size: 13.5px;
          color: var(--ewe-green-mid);
          font-weight: 500;
        }

        .ewe-login__row a:hover { color: var(--ewe-gold); }

        .ewe-login .ant-checkbox-wrapper { font-size: 13.5px; color: var(--ewe-muted); }

        .ewe-login .ant-checkbox-checked .ant-checkbox-inner {
          background-color: var(--ewe-green-deep);
          border-color: var(--ewe-green-deep);
        }

        .ewe-login__submit.ant-btn {
          height: 46px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          background: var(--ewe-green-deep);
          border-color: var(--ewe-green-deep);
          margin-top: 8px;
        }

        .ewe-login__submit.ant-btn:hover,
        .ewe-login__submit.ant-btn:focus {
          background: var(--ewe-green-mid) !important;
          border-color: var(--ewe-green-mid) !important;
        }

        .ewe-login__demo {
          margin-top: 22px;
          padding: 12px 14px;
          border-radius: 8px;
          background: #eef1ea;
          border: 1px dashed #c9d2c4;
        }

        .ewe-login__demo p { margin: 0; font-size: 12px; line-height: 1.6; color: var(--ewe-muted); }
        .ewe-login__demo strong { color: var(--ewe-ink); }

        .ewe-login__footer-note {
          margin-top: 32px;
          text-align: center;
          font-size: 12.5px;
          color: var(--ewe-muted);
        }

        @media (max-width: 860px) {
          .ewe-login { grid-template-columns: 1fr; }
          .ewe-login__brand { padding: 36px 28px; min-height: 260px; }
          .ewe-login__headline { font-size: 26px; }
          .ewe-login__features { display: none; }
          .ewe-login__form-side { padding: 32px 24px 48px; }
        }
      `}</style>

      {/* Left — branded panel */}
      <div className="ewe-login__brand">
        <div className="ewe-login__texture" />

        <div className="ewe-login__brand-top">
          <div className="ewe-login__mark">
            <img src={eweCoreIcon} alt="EWE CORE" />
            <div className="ewe-login__wordmark">
              EWE <span>CORE</span>
              <small>OPERATIONS PLATFORM</small>
            </div>
          </div>

          <h1 className="ewe-login__headline">
            Everything the organisation runs on, in one place.
          </h1>
          <p className="ewe-login__subhead">
            Sign in to manage HR, finance, assets, documents and fleet
            operations across Women Excel SACCO.
          </p>

          <div className="ewe-login__features">
            <div className="ewe-login__feature">
              <span className="ewe-login__feature-dot" />
              HR — onboarding &amp; leave applications
            </div>
            <div className="ewe-login__feature">
              <span className="ewe-login__feature-dot" />
              Finance — payables, receivables, petty cash &amp; procurement
            </div>
            <div className="ewe-login__feature">
              <span className="ewe-login__feature-dot" />
              Assets &amp; fleet management
            </div>
            <div className="ewe-login__feature">
              <span className="ewe-login__feature-dot" />
              Documents &amp; reporting
            </div>
          </div>
        </div>

        <div className="ewe-login__brand-bottom">
          © {new Date().getFullYear()} Women Excel SACCO. All rights reserved.
        </div>
      </div>

      {/* Right — form panel */}
      <div
        className="ewe-login__form-side"
        style={{ backgroundImage: `url(${formBackground})` }}
      >
        <div className="ewe-login__form-wrap">
          <div className="ewe-login__form-header">
            <h1>Welcome back</h1>
            <p>Enter your credentials to access your dashboard.</p>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            requiredMark={false}
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

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                size="large"
              />
            </Form.Item>

            <div className="ewe-login__row">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              <a onClick={() => navigate('/forgot-password')}>Forgot password?</a>
            </div>

            <Form.Item style={{ marginTop: 20 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                className="ewe-login__submit"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          {/* Remove this block before shipping to production */}
          

          <p className="ewe-login__footer-note">
            Need help signing in? Contact your SACCO administrator.
          </p>
        </div>
      </div>
    </div>
  );
};