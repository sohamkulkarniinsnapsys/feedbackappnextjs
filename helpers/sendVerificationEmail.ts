import { resend } from "@/lib/resend";
import VerificationEmail from "@/emails/VerificationEmail";
import { ApiResponse } from "@/types/ApiResponse";

export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string
): Promise<ApiResponse> {
  try {
    // Validate Resend API key
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not configured in environment variables');
      return { 
        success: false, 
        message: 'Email service not configured. Please contact support.' 
      };
    }

    // Use proper email format for 'from' field
    // Resend requires: 'Name <email@domain.com>' or 'email@domain.com'
    // If you have a verified domain in Resend, use: 'onboarding@resend.dev' (default)
    // or your custom domain like: 'noreply@yourdomain.com'
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    
    console.log('📧 Attempting to send verification email to:', email);
    console.log('📧 From address:', fromEmail);
    console.log('📧 Verification code:', verifyCode);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'NextEchoBox - Verification Code',
      react: VerificationEmail({ username, otp: verifyCode }),
    });

    if (error) {
      console.error('❌ Resend API Error:', JSON.stringify(error, null, 2));
      return { 
        success: false, 
        message: `Failed to send email || 'Unknown error'}` 
      };
    }

    console.log('✅ Email sent successfully! Email ID:', data?.id);
    return { 
      success: true, 
      message: 'Verification email sent successfully.' 
    };
    
  } catch (emailError: any) {
    console.error('❌ Exception sending verification email:');
    console.error('Error name:', emailError?.name);
    console.error('Error message:', emailError?.message);
    console.error('Error stack:', emailError?.stack);
    
    return { 
      success: false, 
      message: `Email delivery failed || 'Unknown error'}` 
    };
  }
}