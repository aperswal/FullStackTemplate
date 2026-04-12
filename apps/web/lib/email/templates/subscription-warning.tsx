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

interface SubscriptionWarningEmailProps {
  userName: string;
  planName: string;
  billingUrl: string;
}

export function SubscriptionWarningEmail({
  userName,
  planName,
  billingUrl,
}: SubscriptionWarningEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Action needed: payment failed for {planName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Payment Failed</Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            We were unable to process your payment for the {planName} plan. Please update your
            payment method to keep your subscription active.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={billingUrl}>
              Update Payment Method
            </Button>
          </Section>
          <Text style={footer}>
            If your payment isn&apos;t updated within 7 days, your account will be downgraded to the
            free plan.
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
  backgroundColor: '#dc2626',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
};
const footer = { fontSize: '12px', color: '#9ca3af', marginTop: '24px' };
