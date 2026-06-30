import emailService from '../services/emailService.js';

export const sendEmail = async (req, res) => {
  try {
    const { to, subject, html, text, attachments, cc, bcc } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email and subject are required'
      });
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      text,
      attachments,
      cc,
      bcc
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

export const sendTemplateEmail = async (req, res) => {
  try {
    const { to, template, data, subject } = req.body;

    if (!to || !template) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email and template are required'
      });
    }

    const result = await emailService.sendTemplateEmail({
      to,
      template,
      data,
      subject
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send template email',
      error: error.message
    });
  }
};

export const sendBulkEmails = async (req, res) => {
  try {
    const { recipients, subject, html, text, attachments } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients array is required'
      });
    }

    const results = await emailService.sendBulkEmails(recipients, {
      subject,
      html,
      text,
      attachments
    });

    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk emails',
      error: error.message
    });
  }
};

export const getEmailLogs = (req, res) => {
  try {
    const { status, type, fromDate, toDate } = req.query;
    const filters = { status, type, fromDate, toDate };
    
    const logs = emailService.getEmailLogs(filters);
    
    res.status(200).json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get email logs',
      error: error.message
    });
  }
};

export const getEmailStats = (req, res) => {
  try {
    const stats = emailService.getEmailStats();
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get email statistics',
      error: error.message
    });
  }
};

export const handleIncomingWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-resend-signature'];
    const result = await emailService.handleIncomingWebhook(req.body, signature);
    
    // Process the email
    await emailService.processIncomingEmail(req.body);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to process incoming email',
      error: error.message
    });
  }
};

export const checkEmailStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Message ID is required'
      });
    }

    const result = await emailService.checkEmailStatus(messageId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check email status',
      error: error.message
    });
  }
};