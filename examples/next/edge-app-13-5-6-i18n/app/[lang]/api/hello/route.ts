import { NextRequest } from "next/server";
import { generateResponse } from "../utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { lang: string } },
) {
  const { lang } = params;
  const data = { lang };
  return generateResponse(data);
}

export const runtime = "edge";
