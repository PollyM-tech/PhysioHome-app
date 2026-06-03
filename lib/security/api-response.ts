export type ApiSuccess<TPayload extends Record<string, unknown>> = {
  success: true;
} & TPayload;

export type ApiFailure = {
  message: string;
  success: false;
};

export function jsonSuccess<TPayload extends Record<string, unknown>>(
  payload: TPayload,
  init?: ResponseInit,
): Response {
  return Response.json(
    {
      success: true,
      ...payload,
    } satisfies ApiSuccess<TPayload>,
    init,
  );
}

export function jsonFailure(
  message: string,
  status: number,
  init?: ResponseInit,
): Response {
  return Response.json(
    {
      success: false,
      message,
    } satisfies ApiFailure,
    {
      ...init,
      status,
    },
  );
}
