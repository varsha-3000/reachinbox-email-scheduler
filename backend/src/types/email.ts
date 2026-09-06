export interface ScheduleEmailRequest {
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  senderEmail: string;
}

export interface EmailRecord {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  scheduled_at: Date;
  sent_at: Date | null;
  status: string;
  bull_job_id: string | null;
}