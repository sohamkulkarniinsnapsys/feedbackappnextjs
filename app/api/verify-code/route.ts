import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';

export async function POST(request: Request) {
  // Connect to the database
  await dbConnect();

  try {
    const { username, code } = await request.json();
    console.log(' Verify-code API called');
    console.log(' Received username:', username);
    console.log(' Received code:', code);
    
    const decodedUsername = decodeURIComponent(username);
    console.log(' Decoded username:', decodedUsername);
    const user = await UserModel.findOne({ username: decodedUsername });
    console.log(' User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log(' User not found in database');
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the code is correct and not expired
    const isCodeValid = user.verifyCode === code;
    const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();
    
    console.log(' Stored code:', user.verifyCode);
    console.log(' Provided code:', code);
    console.log(' Code valid:', isCodeValid);
    console.log(' Code expiry:', user.verifyCodeExpiry);
    console.log(' Current time:', new Date());
    console.log(' Code not expired:', isCodeNotExpired);

    if (isCodeValid && isCodeNotExpired) {
      // Update the user's verification status
      user.isVerified = true;
      await user.save();
      
      console.log(' Account verified successfully for user:', decodedUsername);

      return Response.json(
        { success: true, message: 'Account verified successfully' },
        { status: 200 }
      );
    } else if (!isCodeNotExpired) {
      // Code has expired
      console.log(' Verification code has expired');
      return Response.json(
        {
          success: false,
          message:
            'Verification code has expired. Please sign up again to get a new code.',
        },
        { status: 400 }
      );
    } else {
      // Code is incorrect
      console.log(' Incorrect verification code');
      return Response.json(
        { success: false, message: 'Incorrect verification code' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(' Exception in verify-code API:', error);
    return Response.json(
      { success: false, message: 'Error verifying user' },
      { status: 500 }
    );
  }
}