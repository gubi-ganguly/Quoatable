import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = request.headers.get("X-Session-Id");

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const backendUrl = `http://localhost:8000/emails/${id}/attachments`;

    const response = await axios.get(backendUrl, {
      headers: {
        "X-Session-Id": sessionId
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error proxying attachment request to backend:", error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: error.message || "Internal Server Error" };
    return NextResponse.json(data, { status });
  }
}
