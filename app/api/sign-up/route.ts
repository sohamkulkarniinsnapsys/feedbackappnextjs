import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/helpers/sendVerificationEmail';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, email, password } = await request.json();

    // Check for existing username
    const existingUsernameUser = await UserModel.findOne({ username, isVerified: true });
    if (existingUsernameUser) {
      return NextResponse.json({ success: false, message: 'Username is already taken' }, { status: 400 });
    }

    const existingUserByEmail = await UserModel.findOne({ email });
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiryDate = new Date(Date.now() + 3600000); // 1 hour expiry

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 400 });
      } else {
        // Update existing unverified user
        existingUserByEmail.username = username; // Update username in case it changed
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = expiryDate;
        await existingUserByEmail.save();
        console.log('🔄 Updated existing unverified user with new verification code:', verifyCode);
      }
    } else {
      // Create new user
      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry: expiryDate,
        isVerified: false,
        isAcceptingMessages: true,
        messages: [],
      });
      await newUser.save();
    }

    // Send verification email
    console.log('📧 Sending verification email to:', email, 'for user:', username);
    const emailResponse = await sendVerificationEmail(email, username, verifyCode);
    
    if (!emailResponse.success) {
      console.error('❌ Email sending failed:', emailResponse.message);
      // User is created but email failed - inform user to contact support
      return NextResponse.json({ 
        success: false, 
        message: `Account created but email delivery failed: ${emailResponse.message}. Please contact support with your email: ${email}` 
      }, { status: 500 });
    }

    console.log('✅ User registered and verification email sent successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'User registered successfully. Please check your email for the verification code.' 
    }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
