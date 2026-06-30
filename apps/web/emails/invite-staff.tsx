import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface InviteStaffEmailProps {
  fullName: string
  schoolName: string
  roleLabel: string
  inviteLink: string
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  maxWidth: '580px',
  marginTop: '40px',
}

const h1 = {
  color: '#0f172a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
}

const footer = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
}

export const InviteStaffEmail = ({
  fullName,
  schoolName,
  roleLabel,
  inviteLink,
}: InviteStaffEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>You have been invited to join {schoolName} on EduTrack</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to {schoolName}!</Heading>
          
          <Text style={text}>
            Hi {fullName},
          </Text>
          
          <Text style={text}>
            You have been invited to join <strong>{schoolName}</strong> on EduTrack as a <strong>{roleLabel}</strong>. 
            EduTrack is the platform we use to manage classes, students, and school operations.
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={inviteLink}>
              Accept Invitation
            </Button>
          </Section>
          
          <Text style={text}>
            Click the button above to set up your account password and activate your portal. If you have any questions, please contact your school administrator.
          </Text>
          
          <Hr style={hr} />
          
          <Text style={footer}>
            This invitation was intended for {fullName}. If you were not expecting this invitation, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default InviteStaffEmail
