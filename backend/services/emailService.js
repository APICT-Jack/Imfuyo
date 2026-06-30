import { Resend } from 'resend';
import crypto from 'crypto';

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.EMAIL_FROM;
    this.toEmail = process.env.EMAIL_TO;
    this.emailLogs = [];
    this.webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  }

  // Send email
  async sendEmail({ to, subject, html, text, attachments = [], cc = [], bcc = [] }) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
        attachments,
        cc,
        bcc,
        reply_to: this.fromEmail,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Log the email
      this.logEmail({
        to,
        subject,
        status: 'sent',
        messageId: data.id,
        timestamp: new Date(),
        type: 'outgoing'
      });

      return {
        success: true,
        messageId: data.id,
        data
      };
    } catch (error) {
      console.error('Error sending email:', error);
      
      this.logEmail({
        to,
        subject,
        status: 'failed',
        error: error.message,
        timestamp: new Date(),
        type: 'outgoing'
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send bulk emails
  async sendBulkEmails(recipients, { subject, html, text, attachments = [] }) {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await this.sendEmail({
        to: recipient.email,
        subject,
        html,
        text,
        attachments,
        cc: recipient.cc,
        bcc: recipient.bcc
      });
      
      results.push({
        email: recipient.email,
        ...result
      });
    }

    return results;
  }

  // Send template-based email
  async sendTemplateEmail({ to, template, data, subject }) {
    const templates = {
      welcome: {
        subject: 'Welcome to Imfuyo!',
        html: (data) => `
          <h1>Welcome ${data.name}!</h1>
          <p>Thank you for joining Imfuyo. We're excited to have you on board.</p>
          <p>Your account has been successfully created.</p>
          <p>Best regards,<br>The Imfuyo Team</p>
        `
      },
      resetPassword: {
        subject: 'Password Reset Request',
        html: (data) => `
          <h1>Password Reset</h1>
          <p>Hello ${data.name},</p>
          <p>We received a request to reset your password. Click the link below to reset it:</p>
          <a href="${data.resetLink}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      },
      notification: {
        subject: subject || 'Notification from Imfuyo',
        html: (data) => `
          <h1>${data.title || 'Notification'}</h1>
          <p>${data.message}</p>
          ${data.actionLink ? `<a href="${data.actionLink}">${data.actionText || 'Learn More'}</a>` : ''}
        `
      }
    };

    const emailTemplate = templates[template];
    if (!emailTemplate) {
      throw new Error(`Template ${template} not found`);
    }

    return this.sendEmail({
      to,
      subject: emailTemplate.subject,
      html: emailTemplate.html(data),
      text: emailTemplate.html(data).replace(/<[^>]*>/g, '')
    });
  }

  // Log emails
  logEmail(log) {
    this.emailLogs.push({
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    });

    // Keep only last 1000 logs
    if (this.emailLogs.length > 1000) {
      this.emailLogs = this.emailLogs.slice(-1000);
    }
  }

  // Get email logs
  getEmailLogs(filters = {}) {
    let logs = this.emailLogs;
    
    if (filters.status) {
      logs = logs.filter(log => log.status === filters.status);
    }
    
    if (filters.type) {
      logs = logs.filter(log => log.type === filters.type);
    }
    
    if (filters.fromDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.fromDate));
    }
    
    if (filters.toDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.toDate));
    }

    return logs;
  }

  // Get email statistics
  getEmailStats() {
    const total = this.emailLogs.length;
    const sent = this.emailLogs.filter(log => log.status === 'sent').length;
    const failed = this.emailLogs.filter(log => log.status === 'failed').length;
    const outgoing = this.emailLogs.filter(log => log.type === 'outgoing').length;
    const incoming = this.emailLogs.filter(log => log.type === 'incoming').length;

    return {
      total,
      sent,
      failed,
      outgoing,
      incoming,
      successRate: total > 0 ? ((sent / total) * 100).toFixed(2) : 0
    };
  }

  // Handle incoming webhook (for receiving emails)
  async handleIncomingWebhook(body, signature) {
    // Verify webhook signature
    if (this.webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new Error('Invalid webhook signature');
      }
    }

    // Parse incoming email
    const { to, from, subject, html, text, attachments } = body;

    // Log incoming email
    this.logEmail({
      to,
      from,
      subject,
      status: 'received',
      timestamp: new Date(),
      type: 'incoming',
      content: html || text
    });

    return {
      success: true,
      message: 'Email received',
      data: body
    };
  }

  // Process incoming email and trigger actions
  async processIncomingEmail(emailData) {
    const { from, subject, text, html } = emailData;

    // Check for support emails
    if (subject.toLowerCase().includes('support') || subject.toLowerCase().includes('help')) {
      // You can implement support ticket creation here
      console.log('Support email received from:', from);
    }

    // Check for specific commands
    if (text) {
      const commands = {
        'unsubscribe': this.handleUnsubscribe.bind(this),
        'help': this.handleHelp.bind(this),
        'status': this.handleStatus.bind(this)
      };

      for (const [command, handler] of Object.entries(commands)) {
        if (text.toLowerCase().includes(command)) {
          await handler(from, text);
          break;
        }
      }
    }
  }

  // Command handlers
  async handleUnsubscribe(email, message) {
    // Implement unsubscribe logic
    console.log(`Unsubscribe requested by ${email}`);
    // Send confirmation
    await this.sendEmail({
      to: email,
      subject: 'Unsubscribe Confirmation',
      html: '<p>You have been unsubscribed from all Imfuyo communications.</p>'
    });
  }

  async handleHelp(email, message) {
    // Send help information
    await this.sendEmail({
      to: email,
      subject: 'Help & Support - Imfuyo',
      html: `
        <h2>How can we help you?</h2>
        <p>Here are some common commands you can use:</p>
        <ul>
          <li>unsubscribe - Unsubscribe from all emails</li>
          <li>status - Check your account status</li>
          <li>help - Show this help message</li>
        </ul>
      `
    });
  }

  async handleStatus(email, message) {
    // Implement status check logic
    await this.sendEmail({
      to: email,
      subject: 'Account Status',
      html: `<p>Your account is active and in good standing.</p>`
    });
  }

  // Check email delivery status
  async checkEmailStatus(messageId) {
    try {
      const { data, error } = await this.resend.emails.get(messageId);
      
      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        status: data.status,
        data
      };
    } catch (error) {
      console.error('Error checking email status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new EmailService();