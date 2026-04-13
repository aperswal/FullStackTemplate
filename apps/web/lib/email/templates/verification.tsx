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

import messages from '@/messages/en.json';

const t = messages.email.verification;

interface VerificationEmailProps {
  verificationUrl: string;
  userName: string;
}

export function VerificationEmail({
  verificationUrl,
  userName,
}: VerificationEmailProps): React.JSX.Element {
  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{t.heading}</Heading>
          <Text style={text}>{t.greeting.replace('{userName}', userName)}</Text>
          <Text style={text}>{t.body}</Text>
          <Section style={buttonSection}>
            <Button style={button} href={verificationUrl}>
              {t.button}
            </Button>
          </Section>
          <Text style={footer}>{t.footer}</Text>
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
