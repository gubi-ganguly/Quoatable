import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = "http://localhost:8000/crm/opportunity";

    const response = await axios.post(backendUrl, body);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error proxying create opportunity request:", error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: error.message || "Internal Server Error" };
    return NextResponse.json(data, { status });
  }
}
