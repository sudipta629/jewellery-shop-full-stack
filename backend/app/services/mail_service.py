"""
Email service — wraps SMTP sending.

Raises RuntimeError if mail is not configured,
so callers can return a proper error response.
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from flask import current_app

from app.models import OtpPurpose


def _build_otp_html(code: str, purpose: OtpPurpose, expiry_minutes: int = 10) -> str:
    purpose_label = {
        OtpPurpose.LOGIN: "log in",
        OtpPurpose.REGISTER: "create your account",
        OtpPurpose.EMAIL_VERIFY: "verify your email",
    }.get(purpose, "authenticate")

    return f"""
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; 
                background: #1a1108; color: #f5e6c8; padding: 40px; border-radius: 8px;">
        <h1 style="color: #c9a96e; font-size: 24px; margin-bottom: 8px;">JEWÉLIA</h1>
        <hr style="border-color: #c9a96e33; margin-bottom: 24px;" />
        <p style="font-size: 16px;">Your one-time password to {purpose_label}:</p>
        <div style="font-size: 48px; font-weight: bold; letter-spacing: 12px; 
                    color: #c9a96e; text-align: center; padding: 24px 0;">
            {code}
        </div>
        <p style="font-size: 14px; color: #9a8060;">
            This OTP is valid for {expiry_minutes} minutes and can only be used once.<br/>
            If you didn't request this, please ignore this email.
        </p>
        <hr style="border-color: #c9a96e33; margin-top: 24px;" />
        <p style="font-size: 12px; color: #6b5533; text-align: center;">
            © Jewélia. More than jewellery — it's a feeling.
        </p>
    </div>
    """


def send_otp_email(to_email: str, code: str, purpose: OtpPurpose) -> None:
    """
    Send an OTP email.

    Raises RuntimeError if SMTP is not configured.
    Raises smtplib.SMTPException on delivery failure.
    """
    app_config = current_app.config

    mail_server = app_config.get("MAIL_SERVER", "")
    mail_username = app_config.get("MAIL_USERNAME", "")
    mail_password = app_config.get("MAIL_PASSWORD", "")

    if not mail_server or not mail_username or not mail_password:
        if app_config.get("DEBUG") or app_config.get("TESTING"):
            print(f"\n===========================================================")
            print(f"  [DEV MODE] OTP generated for {to_email} is: {code}  ")
            print(f"===========================================================\n")
            current_app.logger.info(f"OTP for {to_email} is {code}")
            return
        raise RuntimeError(
            "SMTP is not configured. Set MAIL_SERVER, MAIL_USERNAME, and MAIL_PASSWORD "
            "in your .env file. See .env.example for details."
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your Jewélia OTP: {code}"
    msg["From"] = app_config.get("MAIL_DEFAULT_SENDER", mail_username)
    msg["To"] = to_email

    text_part = MIMEText(f"Your OTP is: {code}. Valid for 10 minutes.", "plain")
    html_part = MIMEText(_build_otp_html(code, purpose), "html")
    msg.attach(text_part)
    msg.attach(html_part)

    port = int(app_config.get("MAIL_PORT", 587))
    use_tls = app_config.get("MAIL_USE_TLS", True)

    with smtplib.SMTP(mail_server, port) as server:
        server.ehlo()
        if use_tls:
            server.starttls()
            server.ehlo()
        server.login(mail_username, mail_password)
        server.sendmail(msg["From"], [to_email], msg.as_string())
