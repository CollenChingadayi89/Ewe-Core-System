import { Layout } from 'antd';
import { ReactNode } from 'react';

const { Content } = Layout;

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff', margin: 0 }}>
              EWE Core
            </h1>
            <p style={{ color: '#8c8c8c', margin: '8px 0 0' }}>
              Internal Operations Platform
            </p>
          </div>
          {children}
        </div>
      </Content>
    </Layout>
  );
};
