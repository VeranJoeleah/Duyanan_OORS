package com.duyanan.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String token) throws MessagingException {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject("Duyanan Restaurant — Reset Your Password");

        String htmlContent = """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #6e2c00 0%, #28140a 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 24px;">🍽️ Duyanan Restaurant</h1>
                        <p style="color: rgba(255,200,120,0.85); margin-top: 8px; font-size: 14px;">Password Reset Request</p>
                    </div>
                    <div style="padding: 30px;">
                        <p style="color: #e0e0e0; font-size: 15px; line-height: 1.6;">
                            Hello,<br><br>
                            We received a request to reset the password for your Duyanan account. Click the button below to set a new password:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #c2703a, #a0522d); color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 15px rgba(194,112,58,0.4);">
                                Reset My Password
                            </a>
                        </div>
                        <p style="color: #999; font-size: 13px; line-height: 1.6;">
                            This link will expire in <strong>30 minutes</strong>. If you did not request a password reset, please ignore this email — your password will remain unchanged.
                        </p>
                        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;">
                        <p style="color: #666; font-size: 12px; text-align: center;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="%s" style="color: #c2703a; word-break: break-all;">%s</a>
                        </p>
                    </div>
                </div>
                """.formatted(resetLink, resetLink, resetLink);

        helper.setText(htmlContent, true);
        mailSender.send(message);
    }
}
