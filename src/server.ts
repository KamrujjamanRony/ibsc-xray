const { AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse } = require('@angular/ssr/node');
const express = require('express');
const { join } = require('node:path'); const path = require('path');
const fs = require('fs');
const { Jimp } = require('jimp');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const { environment } = require('./environments/environment');
// import { AngularNodeAppEngine,createNodeRequestHandler,isMainModule,writeResponseToNodeResponse} from '@angular/ssr/node';
// import express from 'express';
// import { join } from 'node:path'; import path from 'path';
// import fs from 'fs';
// import { Jimp } from 'jimp';
// import nodemailer from 'nodemailer';
// import bodyParser from 'body-parser';
// import compression from 'compression';
// import cors from 'cors';
// import { environment } from './environments/environment';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Middleware
app.use(bodyParser.json());
app.use(compression({
  level: 6,           // balanced CPU / compression
  threshold: 1024     // only compress >1KB
}));
// server.ts
app.use(cors({
  origin: [
    'http://localhost:1012',
    'http://localhost:3000',
    'http://ibscxray.com.bd',
    'https://ibscxray.com.bd',
    'https://api.mediray.supersoftbd.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  // credentials: true 
}));

// Email configuration - use environment file
const emailConfig = {
  host: environment.emailConfig.host,
  port: environment.emailConfig.port,
  secure: environment.emailConfig.secure,
  auth: {
    user: environment.emailConfig.user,
    pass: environment.emailConfig.pass,
  },
  from: environment.emailConfig.from,
  // Note: 'to' field will come from the request body
};

// Create transporter
const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: emailConfig.auth,
});

// Verify transporter connection
transporter.verify((error: any, success: any) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

// Email API endpoint
app.post('/api/email/send-contact', async (req: any, res: any) => {
  try {
    const { name, email, subject, message, toEmail } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message || !toEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate email format for sender
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sender email format'
      });
    }

    // Validate recipient email format
    if (!emailRegex.test(toEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient email format'
      });
    }

    // Email content
    const mailOptions = {
      from: `"${name}" <${emailConfig.from}>`,
      replyTo: email,
      to: toEmail, // Dynamic recipient from contact form
      subject: `Contact Form: ${subject}`,
      text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
This message was sent from your website contact form.
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #374151; }
        .message { background-color: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 5px; margin-top: 10px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>New Contact Form Submission</h2>
        </div>
        <div class="content">
            <div class="field">
                <span class="label">Name:</span> ${name}
            </div>
            <div class="field">
                <span class="label">Email:</span> <a href="mailto:${email}">${email}</a>
            </div>
            <div class="field">
                <span class="label">Subject:</span> ${subject}
            </div>
            <div class="field">
                <span class="label">Message:</span>
                <div class="message">
                    ${message.replace(/\n/g, '<br>').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </div>
            </div>
        </div>
        <div class="footer">
            <p>This message was sent to: <strong>${toEmail}</strong></p>
            <p>This message was sent from your website contact form.</p>
            <p>Timestamp: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully to:', toEmail);
    console.log('Email sent from:', email);
    console.log('Message ID:', info.messageId);

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      to: toEmail
    });

  } catch (error: any) {
    console.error('Error sending email:', error);

    // FIX: Use bracket notation for NODE_ENV
    return res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: process.env['NODE_ENV'] === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Optional: Test email endpoint
app.post('/api/email/test', async (req: any, res: any) => {
  try {
    const testMailOptions = {
      from: emailConfig.from,
      to: emailConfig.from, // Send to yourself for testing
      subject: 'Test Email from Website',
      text: 'This is a test email sent from your website server.',
      html: '<h1>Test Email</h1><p>This is a test email sent from your website server.</p>'
    };

    const info = await transporter.sendMail(testMailOptions);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: process.env['NODE_ENV'] === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Backend snippet
app.get('/uploads/:filename', async (req: any, res: any) => {
  const { filename } = req.params;
  const width = parseInt(req.query['w'] as string, 10);
  const filePath = path.join(process.cwd(), 'uploads', filename);

  if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
  if (isNaN(width)) return res.sendFile(filePath);

  try {
    const image = await Jimp.read(filePath);
    const mimeType = image.mime || 'image/jpeg';

    console.log(`Resizing ${filename} to width: ${width}`); // DEBUG LOG

    // Perform the resize
    image.resize({ w: width });

    const buffer = await image.getBuffer(mimeType as any);

    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Vary': 'Accept'
    });

    res.send(buffer);
  } catch (err) {
    console.error('Processing failed:', err);
    res.sendFile(filePath);
  }
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req: any, res: any) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    immutable: true,
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req: any, res: any, next: any) => {
  // console.log('SSR handling:', req.url);

  angularApp
    .handle(req)
    .then((response: any) => {
      if (!response) {
        // console.log('SSR returned null for:', req.url);
        return next();
      }
      return writeResponseToNodeResponse(response, res);
    })
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, (error: any) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
