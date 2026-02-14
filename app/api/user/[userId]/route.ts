"use server";

import User from "@/models/User";
import { connectDB } from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) => {
  const { userId } = await params;

  try {
    await connectDB();
    const user = await User.findOne({ _id: userId }).select("-password");

    if (!user)
      return NextResponse.json(
        {
          message: "User Not Found",
        },
        { status: 404 },
      );

    return NextResponse.json(user);
  } catch (error) {

    console.log("Error while fetching user", error);
    return NextResponse.json({
      message: "Something Went Wrong"
    }, {status: 500})
  }
};
