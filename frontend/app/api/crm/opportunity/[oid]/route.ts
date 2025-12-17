import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ oid: string }> }
) {
  const { oid } = await params;
  
  if (!oid) {
    return NextResponse.json({ error: "Opportunity ID is required" }, { status: 400 });
  }

  try {
    const backendUrl = `http://localhost:8000/crm/opportunity/${oid}`;
    const response = await axios.get(backendUrl);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error proxying get opportunity request:", error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: error.message || "Internal Server Error" };
    return NextResponse.json(data, { status });
  }
}
