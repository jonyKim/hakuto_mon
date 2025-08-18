import { FirebaseEmailService } from '../infrastructure/firebase-email.service';

export interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromAddress: string;
    fromName: string;
}

export interface EmailTemplate {
    subject: string;
    html: string;
    text?: string;
}

export class EmailService {
    private config: EmailConfig;
    private firebaseEmailService: FirebaseEmailService | null = null;

    constructor(config: EmailConfig) {
        this.config = config;
        
        // Firebase 설정이 있는 경우 Firebase Email Service 초기화
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

        if (projectId && privateKey && clientEmail) {
            try {
                const firebaseConfig = {
                    projectId,
                    privateKey,
                    clientEmail,
                };
                this.firebaseEmailService = new FirebaseEmailService(firebaseConfig);
                this.firebaseEmailService.initialize();
                console.log('Firebase Email Service initialized in EmailService');
            } catch (error) {
                console.error('Failed to initialize Firebase Email Service:', error);
                this.firebaseEmailService = null;
            }
        } else {
            console.warn('Firebase configuration missing. Using mock email service.');
        }
    }

    /**
     * 이메일 인증 코드 발송
     */
    async sendVerificationCode(
        email: string, 
        verificationCode: string, 
        userName?: string
    ): Promise<boolean> {
        try {
            // Firebase Email Service가 사용 가능한 경우 우선 사용
            if (this.firebaseEmailService) {
                return await this.firebaseEmailService.sendVerificationCode(email, verificationCode, userName);
            }
            
            // Firebase를 사용할 수 없는 경우 기존 방식 사용
            const template = this.getVerificationEmailTemplate(verificationCode, userName);
            return await this.sendEmailInternal(email, template);
        } catch (error) {
            console.error('Failed to send verification email:', error);
            return false;
        }
    }

    /**
     * 인증 완료 알림 이메일 발송
     */
    async sendVerificationSuccessEmail(
        email: string, 
        userName?: string
    ): Promise<boolean> {
        try {
            // Firebase Email Service가 사용 가능한 경우 우선 사용
            if (this.firebaseEmailService) {
                return await this.firebaseEmailService.sendVerificationSuccessEmail(email, userName);
            }
            
            // Firebase를 사용할 수 없는 경우 기존 방식 사용
            const template = this.getVerificationSuccessTemplate(userName);
            return await this.sendEmailInternal(email, template);
        } catch (error) {
            console.error('Failed to send verification success email:', error);
            return false;
        }
    }

    /**
     * 일반 이메일 발송 (외부에서 사용 가능)
     */
    async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
        try {
            // Firebase Email Service가 사용 가능한 경우 우선 사용
            if (this.firebaseEmailService) {
                return await this.firebaseEmailService.sendEmail({
                    to,
                    subject: template.subject,
                    html: template.html,
                    text: template.text
                });
            }
            
            // Firebase를 사용할 수 없는 경우 기존 방식 사용
            return await this.sendEmailInternal(to, template);
        } catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }

    /**
     * 실제 이메일 발송 (nodemailer 없이 모의 구현)
     */
    private async sendEmailInternal(to: string, template: EmailTemplate): Promise<boolean> {
        // TODO: 실제 nodemailer 구현시 교체
        console.log('=== EMAIL MOCK SEND ===');
        console.log(`From: ${this.config.host}:${this.config.port}`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${template.subject}`);
        console.log(`HTML: ${template.html}`);
        console.log(`Text: ${template.text || 'N/A'}`);
        console.log('=====================');
        
        // 모의 성공 응답 (실제로는 nodemailer 결과 반환)
        return true;
    }

    /**
     * 인증 코드 이메일 템플릿
     */
    private getVerificationEmailTemplate(code: string, userName?: string): EmailTemplate {
        const name = userName || '사용자';
        
        return {
            subject: '[HAKUTO MON] Email Verification Code',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Email Verification</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .code { background: #fff; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; border: 2px dashed #667eea; }
                        .code-number { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🚀 HAKUTO MON</h1>
                            <p>Please verify your email address</p>
                        </div>
                        <div class="content">
                            <h2>Hello, ${name}!</h2>
                            <p>Thank you for using HAKUTO MON.</p>
                            <p>Please enter the verification code in the app to complete the email verification.</p>
                            
                            <div class="code">
                                <p>Verification Code</p>
                                <div class="code-number">${code}</div>
                            </div>
                            
                            <div class="warning">
                                <strong>⚠️ 주의사항:</strong>
                                <ul>
                                    <li>This code is valid for 10 minutes.</li>
                                    <li>If you did not request this email, please ignore it.</li>
                                    <li>Do not share this code with others.</li>
                                </ul>
                            </div>
                            
                            <p>If you have any questions, please contact us anytime.</p>
                        </div>
                        <div class="footer">
                            <p>© 2025 HAKUTO MON. All rights reserved.</p>
                            <p>This email was automatically sent.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
HAKUTO MON Email Verification

Hello, ${name}!

Please enter the verification code in the app:
${code}

Warning:
- This code is valid for 10 minutes.
- If you did not request this email, please ignore it.
- Do not share this code with others.

© 2025 HAKUTO MON
            `
        };
    }

    /**
     * 인증 완료 이메일 템플릿
     */
    private getVerificationSuccessTemplate(userName?: string): EmailTemplate {
        const name = userName || '사용자';
        
        return {
            subject: '[HAKUTO MON] Email Verification Success',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Email Verification Success</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #00b894 0%, #00a085 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 HAKUTO MON</h1>
                            <p>Email Verification Success</p>
                        </div>
                        <div class="content">
                            <h2>Congratulations, ${name}!</h2>
                            
                            <div class="success">
                                <h3>✅ Email Verification Success</h3>
                                <p>You can now use all the notification services.</p>
                            </div>
                            
                            <p>HAKUTO MON에서 제공하는 서비스:</p>
                            <ul>
                                <li>📈 Real-time price alerts</li>
                                <li>📱 Push notifications</li>
                                <li>📧 Email notifications</li>
                                <li>🔔 Custom notification settings</li>
                            </ul>
                            
                            <p>Thank you!</p>
                        </div>
                        <div class="footer">
                            <p>© 2025 HAKUTO MON. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
HAKUTO MON Email Verification Success

Congratulations, ${name}!

✅ Email Verification Success
You can now use all the notification services.

Services provided by HAKUTO MON:
- Real-time price alerts
- Push notifications
- Email notifications
- Custom notification settings

© 2025 HAKUTO MON
            `
        };
    }
} 