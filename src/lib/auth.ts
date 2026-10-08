import { verify, type JwtPayload } from "jsonwebtoken";

export type AdminClaims = {
  userId: string;
  role: "ADMIN";
};

export class AdminAuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403,
  ) {
    super(message);
  }
}

export function verifyAdminToken(
  authorization: string | null,
  cookieToken?: string | null,
): AdminClaims {
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;
  const token = bearerToken || cookieToken;
  if (!token) throw new AdminAuthError("Authentication required.", 401);

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  if (secret.length < 32)
    throw new Error("JWT_SECRET must be at least 32 characters.");

  let decoded: string | JwtPayload;
  try {
    decoded = verify(token, secret);
  } catch {
    throw new AdminAuthError("Session is invalid or expired.", 401);
  }

  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "string" ||
    typeof decoded.role !== "string"
  ) {
    throw new AdminAuthError("Session is invalid.", 401);
  }
  if (decoded.role !== "ADMIN") {
    throw new AdminAuthError("Administrative access required.", 403);
  }

  return { userId: decoded.userId, role: "ADMIN" };
}

export function getAdminAuthError(error: unknown) {
  if (error instanceof AdminAuthError) {
    return { message: error.message, status: error.status };
  }
  return { message: "Unable to authenticate this request.", status: 500 };
}
