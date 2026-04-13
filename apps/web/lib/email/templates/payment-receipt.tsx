import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

import messages from '@/messages/en.json';

const t = messages.email.paymentReceipt;

interface PaymentReceiptEmailProps {
  userName: string;
  planName: string;
  amount: string;
  date: string;
}

export function PaymentReceiptEmail({
  userName,
  planName,
  amount,
  date,
}: PaymentReceiptEmailProps): React.JSX.Element {
  return (
    <Html>
      <Head />
      <Preview>{t.preview.replace('{planName}', planName)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{t.heading}</Heading>
          <Text style={text}>{t.greeting.replace('{userName}', userName)}</Text>
          <Text style={text}>{t.thankYou}</Text>
          <Container style={details}>
            <Text style={detailRow}>{t.plan.replace('{planName}', planName)}</Text>
            <Text style={detailRow}>{t.amount.replace('{amount}', amount)}</Text>
            <Text style={detailRow}>{t.date.replace('{date}', date)}</Text>
          </Container>
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
const details = {
  backgroundColor: '#f9fafb',
  padding: '16px',
  borderRadius: '6px',
  margin: '16px 0',
};
const detailRow = { fontSize: '14px', color: '#111827', margin: '4px 0' };
const footer = { fontSize: '12px', color: '#9ca3af', marginTop: '24px' };
