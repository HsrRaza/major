import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.BACKEND_API_URL || 'http://127.0.0.1:3008';

async function proxyRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND_BASE_URL}/api/${path}${search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');

  try {
    const isGetOrHead = req.method === 'GET' || req.method === 'HEAD';
    const body = isGetOrHead ? undefined : await req.arrayBuffer();

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      // @ts-ignore
      duplex: 'half',
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[Next.js API Proxy Error] Failed to proxy ${req.method} /api/${path}:`, err.message);
    return NextResponse.json(
      { error: `Backend proxy error: ${err.message}` },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
export const HEAD = proxyRequest;
