import * as admin from 'firebase-admin';

export interface FirebaseEmailConfig {
    projectId: string;
    privateKey: string;
    clientEmail: string;
}

export interface EmailData {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export class FirebaseEmailService {
    private db: admin.firestore.Firestore | null = null;
    private initialized = false;

    constructor(private config: FirebaseEmailConfig) {}

    /**
     * Firebase Admin SDK 및 Firestore 초기화
     */
    initialize(): void {
        if (this.initialized) {
            return;
        }

        try {
            // Firebase Admin이 이미 초기화되었는지 확인
            let app: admin.app.App;
            
            if (admin.apps.length === 0) {
                // 서비스 계정 키 정보 설정
                const serviceAccount = {
                    projectId: this.config.projectId,
                    privateKey: this.config.privateKey.replace(/\\n/g, '\n'),
                    clientEmail: this.config.clientEmail,
                };

                // Firebase Admin 초기화
                app = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: this.config.projectId,
                });
            } else {
                app = admin.apps[0] as admin.app.App;
            }

            // Firestore 인스턴스 생성
            this.db = app.firestore();
            this.initialized = true;
            
            console.log('Firebase Email Service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Firebase Email Service:', error);
            throw new Error('Firebase Email Service initialization failed');
        }
    }

    /**
     * 이메일 인증 코드 발송 (Firebase Extension 활용)
     */
    async sendVerificationCode(
        email: string, 
        verificationCode: string, 
        userName?: string
    ): Promise<boolean> {
        if (!this.initialized || !this.db) {
            console.error('Firebase Email Service not initialized');
            return false;
        }

        try {
            const name = userName || '사용자';
            const emailData: EmailData = {
                to: email,
                subject: '[HAKUTO MON] Email Verification Code',
                html: this.getVerificationEmailTemplate(verificationCode, name),
                text: this.getVerificationEmailText(verificationCode, name)
            };

            // Firebase Extension이 감지할 수 있도록 mail 컬렉션에 문서 추가
            const docRef = await this.db.collection('mail').add({
                to: emailData.to,
                message: {
                    subject: emailData.subject,
                    html: emailData.html,
                    text: emailData.text
                }
            });

            console.log(`Email queued for sending with ID: ${docRef.id}`);
            console.log(`Verification code email sent to: ${email}`);
            
            return true;
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
        if (!this.initialized || !this.db) {
            console.error('Firebase Email Service not initialized');
            return false;
        }

        try {
            const name = userName || '사용자';
            const emailData: EmailData = {
                to: email,
                subject: '[HAKUTO MON] 이메일 인증이 완료되었습니다',
                html: this.getVerificationSuccessTemplate(name),
                text: this.getVerificationSuccessText(name)
            };

            const docRef = await this.db.collection('mail').add({
                to: emailData.to,
                message: {
                    subject: emailData.subject,
                    html: emailData.html,
                    text: emailData.text
                }
            });

            console.log(`Success email queued for sending with ID: ${docRef.id}`);
            console.log(`Verification success email sent to: ${email}`);
            
            return true;
        } catch (error) {
            console.error('Failed to send verification success email:', error);
            return false;
        }
    }

    /**
     * 일반 이메일 발송
     */
    async sendEmail(emailData: EmailData): Promise<boolean> {
        if (!this.initialized || !this.db) {
            console.error('Firebase Email Service not initialized');
            return false;
        }

        try {
            const docRef = await this.db.collection('mail').add({
                to: emailData.to,
                message: {
                    subject: emailData.subject,
                    html: emailData.html,
                    text: emailData.text
                }
            });

            console.log(`Custom email queued for sending with ID: ${docRef.id}`);
            console.log(`Email sent to: ${emailData.to}`);
            
            return true;
        } catch (error) {
            console.error('Failed to send custom email:', error);
            return false;
        }
    }

    /**
     * 인증 코드 이메일 HTML 템플릿
     */
    private getVerificationEmailTemplate(code: string, userName: string): string {
        return `
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
                        <h2>Hello, ${userName}!</h2>
                        <p>Thank you for using HAKUTO MON.</p>
                        <p>Please enter the verification code in the app to complete the email verification.</p>
                        
                        <div class="code">
                            <p>Verification Code</p>
                            <div class="code-number">${code}</div>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ Warning:</strong>
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
        `;
    }

    /**
     * 인증 코드 이메일 텍스트 버전
     */
    private getVerificationEmailText(code: string, userName: string): string {
        return `
HAKUTO MON Email Verification

Hello, ${userName}!

Please enter the verification code in the app:
${code}

Warning:
- This code is valid for 10 minutes.
- If you did not request this email, please ignore it.
- Do not share this code with others.

© 2025 HAKUTO MON
        `;
    }

    /**
     * 인증 완료 이메일 HTML 템플릿
     */
    private getVerificationSuccessTemplate(userName: string): string {
        return `
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
                        <h2>Congratulations, ${userName}!</h2>
                        
                        <div class="success">
                            <h3>✅ Email Verification Success</h3>
                            <p>You can now use all the notification services.</p>
                        </div>
                        
                        <p>Services provided by HAKUTO MON:</p>
                        <ul>
                            <li>📈 Real-time price alerts</li>
                            <li>📱 Push notifications</li>
                            <li>📧 Email notifications</li>
                            <li>🔔 Custom notification settings</li>
                        </ul>
                        
                        <p>감사합니다!</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 HAKUTO MON. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * 인증 완료 이메일 텍스트 버전
     */
    private getVerificationSuccessText(userName: string): string {
        return `
HAKUTO MON Email Verification Success

Congratulations, ${userName}!

✅ Email Verification Success
You can now use all the notification services.

Services provided by HAKUTO MON:
- Real-time price alerts
- Push notifications
- Email notifications
- Custom notification settings

© 2025 HAKUTO MON
        `;
    }

    /**
     * Firebase 서비스 종료
     */
    async shutdown(): Promise<void> {
        if (this.initialized) {
            this.db = null;
            this.initialized = false;
            console.log('Firebase Email Service shutdown');
        }
    }
}
