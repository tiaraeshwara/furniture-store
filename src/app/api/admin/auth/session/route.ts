import { NextRequest, NextResponse } from "next/server";
import { AdminAuthError, verifyAdminToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const claims = verifyAdminToken(
      request.headers.get("authorization"),
      request.cookies.get("fieldroom_admin")?.value,
    );
    const user = await prisma.user.findUnique({
      where: { id: claims.userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof AdminAuthError && error.status === 401) {
      return NextResponse.json({ user: null });
    }
    const status = error instanceof AdminAuthError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Unable to verify session.";
    return NextResponse.json(
      { error: status === 500 ? "Unable to verify session." : message },
      { status },
    );
  }
}
