// app/api/accept-messages/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";

export const runtime = "nodejs"; // ensure Node runtime for mongoose

// Helper to read user id from the session safely.
// NextAuth by default has session.user.id (string). If you add _id to the session
// in callbacks, support that too.
function sessionUserId(session: any): string | null {
  if (!session?.user) return null;
  // prefer id, fallback to _id, fallback to email-based lookup later if needed
  return session.user.id ?? session.user._id ?? null;
}

export async function POST(request: Request) {
  try {
    // Validate body
    const body = await request.json().catch(() => ({}));
    const acceptMessages = body?.acceptMessages;

    if (typeof acceptMessages !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload: 'acceptMessages' must be boolean",
        },
        { status: 400 }
      );
    }

    // get session
    const session = await getServerSession(authOptions);
    const uid = sessionUserId(session);

    if (!session || !uid) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // ensure DB is connected
    await dbConnect();

    // update user
    const updatedUser = await UserModel.findByIdAndUpdate(
      uid,
      { isAcceptingMessages: acceptMessages },
      { new: true }
    ).select("-password -__v"); // hide sensitive fields

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to find user to update message acceptance status",
        },
        { status: 404 }
      );
    }

    // respond with minimal user fields to avoid sending entire object
    return NextResponse.json(
      {
        success: true,
        message: "Message acceptance status updated successfully",
        isAcceptingMessages: updatedUser.isAcceptingMessages,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error updating message acceptance status:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // get session
    const session = await getServerSession(authOptions);
    const uid = sessionUserId(session);

    if (!session || !uid) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // ensure DB is connected
    await dbConnect();

    // find user
    const foundUser = await UserModel.findById(uid).select("isAcceptingMessages");

    if (!foundUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        isAcceptingMessages: Boolean(foundUser.isAcceptingMessages),
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error retrieving message acceptance status:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
