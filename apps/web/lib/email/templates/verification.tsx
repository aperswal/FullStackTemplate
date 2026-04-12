import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface VerificationEmailProps {
  verificationUrl: string;
  userName: string;
}

export function VerificationEmail({ verificationUrl, userName }: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Verify your email</Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            Click the button below to verify your email address and activate your account.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={verificationUrl}>
              Verify Email
            </Button>
          </Section>
          <Text style={footer}>
            If you didn&apos;t create an account, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f6f9fc', fontFamily: 'system-ui, sans-serif' };
const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px',
  borderRadius: '8px',
  maxWidth: '480px',
};
const heading = { fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '16px' };
const text = { fontSize: '14px', color: '#4b5563', lineHeight: '24px' };
const buttonSection = { textAlign: 'center' as const, margin: '24px 0' };
const button = {
  backgroundColor: '#111827',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
};
const footer = { fontSize: '12px', color: '#9ca3af', marginTop: '24px' };
