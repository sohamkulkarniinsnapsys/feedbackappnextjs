import UserModel from '@/model/User';
import dbConnect from '@/lib/dbConnect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/options';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ messageid: string }> } // Next.js expects a Promise for params
) {
  try {
    // Await the params promise
    const { messageid } = await context.params;

    // Connect to the database
    await dbConnect();

    // Get the current user session
    const session = await getServerSession(authOptions);

    const user = session?.user as any;
    const userIdString = user?.id || user?._id;

    if (!session?.user || !userIdString) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = userIdString;

    // Remove the message from the user's messages array
    const updateResult = await UserModel.updateOne(
      { _id: userId },
      { $pull: { messages: { _id: messageid } } }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Message not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Message deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting message' },
      { status: 500 }
    );
  }
}
