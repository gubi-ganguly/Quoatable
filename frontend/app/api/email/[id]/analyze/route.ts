import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const sessionId = request.headers.get("X-Session-Id");

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Forward request to backend
    const backendUrl = `http://localhost:8000/emails/${id}/analyze`;

    const response = await axios.post(
      backendUrl, 
      {}, // Empty body for now as per backend spec
      {
        headers: {
          "X-Session-Id": sessionId
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error proxying analyze request to backend:", error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: error.message || "Internal Server Error" };
    return NextResponse.json(data, { status });
  }
}
