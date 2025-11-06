import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import mongoose from "mongoose";
import { User } from "next-auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log('❌ GET /api/get-messages: Not authenticated');
      return Response.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const _user = session.user as any;
    // Session stores 'id' (string), not '_id'
    const userIdString = _user.id || _user._id;
    
    if (!userIdString) {
      console.log('❌ GET /api/get-messages: No user ID in session');
      return Response.json(
        { success: false, message: "Invalid session" },
        { status: 400 }
      );
    }

    const userId = new mongoose.Types.ObjectId(userIdString);

    console.log('📧 GET /api/get-messages: Fetching messages for user:', _user.username, '(ID:', userIdString, ')');

    // 🔒 Wait for DB connection before querying
    await dbConnect();

    // Use findById instead of aggregate to handle empty messages array
    const user = await UserModel.findById(userId).select('messages').lean();

    if (!user) {
      console.log('❌ GET /api/get-messages: User not found in database with ID:', userIdString);
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Sort messages by createdAt descending
    const messages = (user.messages || []).sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log('✅ GET /api/get-messages: Returning', messages.length, 'messages');

    return Response.json(
      { success: true, messages },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ GET /api/get-messages error:", error);
    return Response.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
