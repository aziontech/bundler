import { NextRequest, NextResponse } from "next/server";
import { generateResponse } from "../utils";

export async function GET(request: NextRequest) {
  const data = { message: "Hello!" };
  return generateResponse(data);
}

export const runtime = "edge";
