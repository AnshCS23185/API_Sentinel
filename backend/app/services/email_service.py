import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_consumer_welcome_email(recipient_email: str, consumer_name: str, initial_password: str = "TempPass9824!") -> bool:
    """
    Sends an initial credentials welcome email to a newly provisioned API Consumer via SMTP.
    """
    if not recipient_email or "@" not in recipient_email:
        logger.warning(f"Invalid email recipient: {recipient_email}. Skipping email dispatch.")
        return False

    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD.replace(" ", "") if settings.SMTP_PASSWORD else ""

    if not smtp_user or not smtp_password or "your_smtp" in smtp_password:
        logger.warning(f"SMTP credentials not fully configured. Skipping email dispatch to {recipient_email}.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"⚡ Welcome to API Sentinel — Credentials Provisioned for {consumer_name}"
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = recipient_email

        plain_text = f"""Hello {consumer_name},

Your API Consumer account has been successfully provisioned on API Sentinel.

Here are your initial portal login credentials:
- Consumer Name: {consumer_name}
- Portal Login Email: {recipient_email}
- Initial Password: {initial_password}

Login Portal URL: http://localhost:5173/login/consumer

Please sign in and update your password upon your first access.

Best regards,
API Sentinel System
"""

        html_text = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }}
            .container {{ max-width: 520px; margin: 0 auto; background-color: #111827; border-radius: 16px; border: 1px solid #1f2937; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }}
            .brand {{ font-size: 20px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px; text-align: center; }}
            .header {{ font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 12px; text-align: center; }}
            .desc {{ font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 24px; text-align: center; }}
            .box {{ background-color: #1f2937; border-radius: 12px; border: 1px solid #374151; padding: 20px; margin-bottom: 24px; }}
            .item {{ margin-bottom: 12px; }}
            .item:last-child {{ margin-bottom: 0; }}
            .lbl {{ font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }}
            .val {{ font-size: 14px; font-weight: 700; color: #38bdf8; font-family: monospace; }}
            .pass-val {{ font-size: 16px; font-weight: 800; color: #f97316; font-family: monospace; }}
            .btn-wrap {{ text-align: center; margin-top: 24px; margin-bottom: 24px; }}
            .btn {{ display: inline-block; background-color: #ea580c; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.4); }}
            .footer {{ font-size: 11px; color: #6b7280; margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 16px; text-align: center; line-height: 1.5; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="brand">⚡ API SENTINEL</div>
            <div class="header">Account Credentials Provisioned</div>
            <div class="desc">Welcome <strong>{consumer_name}</strong>! Your API Consumer profile has been provisioned on API Sentinel Gateway. Use the temporary credentials below to log into the Consumer Portal.</div>
            
            <div class="box">
              <div class="item">
                <div class="lbl">Consumer Name</div>
                <div class="val" style="color: #ffffff;">{consumer_name}</div>
              </div>
              <div class="item">
                <div class="lbl">Portal Access Email</div>
                <div class="val">{recipient_email}</div>
              </div>
              <div class="item" style="border-t: 1px solid #374151; pt: 8px; mt: 8px;">
                <div class="lbl">Initial Temporary Password</div>
                <div class="pass-val">{initial_password}</div>
              </div>
            </div>

            <div class="btn-wrap">
              <a href="http://localhost:5173/login/consumer" class="btn">Sign In to Consumer Portal &rarr;</a>
            </div>

            <div class="footer">
              This is an automated system notification dispatched by API Sentinel Management Console.<br>
              If you did not request access, please contact system security.
            </div>
          </div>
        </body>
        </html>
        """

        part1 = MIMEText(plain_text, "plain")
        part2 = MIMEText(html_text, "html")
        msg.attach(part1)
        msg.attach(part2)

        logger.info(f"Connecting to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT} as {smtp_user}...")
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12)
        if settings.SMTP_TLS:
            server.starttls()
        
        server.login(smtp_user, smtp_password)
        server.sendmail(settings.EMAILS_FROM_EMAIL or smtp_user, [recipient_email], msg.as_string())
        server.quit()
        logger.info(f"Successfully sent welcome email to {recipient_email} via Gmail SMTP!")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {recipient_email} via SMTP: {str(e)}")
        return False
