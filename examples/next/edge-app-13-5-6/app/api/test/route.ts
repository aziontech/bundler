import { NextRequest, NextResponse } from "next/server";
import { baseEntity, generateResponse } from "../utils";

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl?.searchParams?.get("page") || '0', 10);
  const limit = parseInt(request.nextUrl?.searchParams?.get("limit") || '0', 10);

  const data = {
    ...baseEntity,
    requestData: {
      page,
      limit,
    }
  }

  return generateResponse(data);
}

export async function POST(request: Request) {
  const json = await request.json();

  const data = {
    ...baseEntity,
    newData: {
      ...json
    },
  };

  return generateResponse(data);
}

export async function HEAD(request: Request) {
  return generateResponse(baseEntity);
}

export async function OPTIONS(request: Request) {
  return generateResponse(baseEntity);
}

export const runtime = 'edge';