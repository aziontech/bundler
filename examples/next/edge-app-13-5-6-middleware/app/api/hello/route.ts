import { NextRequest, NextResponse } from "next/server";
import { generateResponse } from "../utils";

export async function GET(request: NextRequest) {
  let requestHeaders: any = {};

  request.headers.forEach((value, name) => {
    requestHeaders[name] = value;
  });

  return generateResponse(requestHeaders);
}

export const runtime = "edge";
