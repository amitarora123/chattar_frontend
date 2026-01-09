import type { NextRequest } from "next/server";
import { connectDB } from "@/utils/db";
import User, { IUser } from "@/models/User";

export const POST = async (request: NextRequest) => {
  try {
    await connectDB();
    const { username, email, password }: IUser = await request.json();

    const user = await User.create({
      username,
      email,
      password,
    });

    return Response.json(user, { status: 201 });
  } catch (error) {
    console.log("Error registering user: ", error);
    return Response.json("Internal Server Error", { status: 500 });
  }
};
