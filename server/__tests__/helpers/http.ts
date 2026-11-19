export function fakeReqRes(opts: { query?: Record<string, any>; body?: any; headers?: Record<string, string>; ip?: string; params?: Record<string, string> } = {}) {
  const req: any = { query: opts.query ?? {}, body: opts.body ?? {}, headers: opts.headers ?? {}, ip: opts.ip ?? "127.0.0.1", params: opts.params ?? {} };
  const out: { status: number; body: any } = { status: 200, body: undefined };
  const res: any = {
    status(code: number) {
      out.status = code;
      return res;
    },
    json(payload: any) {
      out.body = payload;
      return res;
    },
  };
  return { req, res, out };
}
