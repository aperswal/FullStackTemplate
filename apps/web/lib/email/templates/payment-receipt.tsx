import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

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
}: PaymentReceiptEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment receipt for {planName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Payment Receipt</Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>Thank you for your payment. Here are the details:</Text>
          <Container style={details}>
            <Text style={detailRow}>Plan: {planName}</Text>
            <Text style={detailRow}>Amount: {amount}</Text>
            <Text style={detailRow}>Date: {date}</Text>
          </Container>
          <Text style={footer}>If you have any questions, reply to this email.</Text>
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
