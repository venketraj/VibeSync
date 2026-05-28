import { NextResponse } from "next/server";

type ApiMeta = Record<string, unknown>;

export function successResponse<T>(data: T, meta: ApiMeta = {}, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    { status },
  );
}

export function errorResponse(message: string, code: string, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
      },
    },
    { status },
  );
}
