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

    constructor(config: EmailConfig) {
        this.config = config;
        // config는 실제 이메일 서비스 구현시 사용됩니다
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
        return await this.sendEmailInternal(to, template);
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
            subject: '[HAKUTO MON] 이메일 인증 코드',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>이메일 인증</title>
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
                            <p>이메일 인증을 완료해주세요</p>
                        </div>
                        <div class="content">
                            <h2>안녕하세요, ${name}님!</h2>
                            <p>HAKUTO MON 서비스를 이용해주셔서 감사합니다.</p>
                            <p>아래 인증 코드를 앱에 입력하여 이메일 인증을 완료해주세요.</p>
                            
                            <div class="code">
                                <p>인증 코드</p>
                                <div class="code-number">${code}</div>
                            </div>
                            
                            <div class="warning">
                                <strong>⚠️ 주의사항:</strong>
                                <ul>
                                    <li>이 코드는 10분간 유효합니다.</li>
                                    <li>본인이 요청하지 않은 경우 이 이메일을 무시해주세요.</li>
                                    <li>타인과 코드를 공유하지 마세요.</li>
                                </ul>
                            </div>
                            
                            <p>문의사항이 있으시면 언제든 연락주세요.</p>
                        </div>
                        <div class="footer">
                            <p>© 2025 HAKUTO MON. All rights reserved.</p>
                            <p>이 이메일은 자동으로 발송되었습니다.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
HAKUTO MON 이메일 인증

안녕하세요, ${name}님!

아래 인증 코드를 앱에 입력해주세요:
${code}

주의사항:
- 이 코드는 10분간 유효합니다.
- 본인이 요청하지 않은 경우 이 이메일을 무시해주세요.
- 타인과 코드를 공유하지 마세요.

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
            subject: '[HAKUTO MON] 이메일 인증이 완료되었습니다',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>인증 완료</title>
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
                            <p>인증이 완료되었습니다!</p>
                        </div>
                        <div class="content">
                            <h2>축하합니다, ${name}님!</h2>
                            
                            <div class="success">
                                <h3>✅ 이메일 인증 완료</h3>
                                <p>이제 모든 알림 서비스를 이용하실 수 있습니다.</p>
                            </div>
                            
                            <p>HAKUTO MON에서 제공하는 서비스:</p>
                            <ul>
                                <li>📈 실시간 가격 알림</li>
                                <li>📱 푸시 알림</li>
                                <li>📧 이메일 알림</li>
                                <li>🔔 커스텀 알림 설정</li>
                            </ul>
                            
                            <p>감사합니다!</p>
                        </div>
                        <div class="footer">
                            <p>© 2025 HAKUTO MON. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
HAKUTO MON 이메일 인증 완료

축하합니다, ${name}님!

✅ 이메일 인증이 완료되었습니다.
이제 모든 알림 서비스를 이용하실 수 있습니다.

제공 서비스:
- 실시간 가격 알림
- 푸시 알림
- 이메일 알림
- 커스텀 알림 설정

© 2025 HAKUTO MON
            `
        };
    }
} 