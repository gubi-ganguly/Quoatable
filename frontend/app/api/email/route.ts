import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = request.headers.get("X-Session-Id");

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Forward all search params to the backend
    // axios params can take URLSearchParams directly
    const backendUrl = "http://localhost:8000/emails";

    const response = await axios.get(backendUrl, {
      params: searchParams,
      headers: {
        "X-Session-Id": sessionId
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error proxying request to backend:", error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: error.message || "Internal Server Error" };
    return NextResponse.json(data, { status });
  }
}
