import { NextRequest, NextResponse } from 'next/server';
import { executeVmTests } from '@/services/vmTestRunner';
import * as diff from 'diff';

const BACKEND_BASE_URL = process.env.BACKEND_API_URL || 'http://127.0.0.1:3008';

async function handleFallback(req: NextRequest, path: string, bodyText: string) {
  // 1. In-process fallback for /api/run-tests
  if (path === 'run-tests' && req.method === 'POST') {
    try {
      const data = bodyText ? JSON.parse(bodyText) : {};
      const testResult = await executeVmTests(data.repoFiles || {});
      return NextResponse.json(testResult);
    } catch (vmErr: any) {
      return NextResponse.json(
        { error: `In-memory VM test runner error: ${vmErr.message}` },
        { status: 500 }
      );
    }
  }

  // 2. In-process fallback for /api/health
  if (path === 'health' && req.method === 'GET') {
    return NextResponse.json({
      status: 'online',
      platform: 'RefactorAI Code Intelligence Engine',
      backendProxy: 'Next.js Integrated Fallback',
      groqConfigured: !!process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  }

  // 3. In-process fallback for /api/generate-patch
  if (path === 'generate-patch' && req.method === 'POST') {
    try {
      const { filePath, originalCode = '', refactoredCode = '' } = bodyText ? JSON.parse(bodyText) : {};
      const patchText = diff.createTwoFilesPatch(
        `a/${filePath}`,
        `b/${filePath}`,
        originalCode,
        refactoredCode,
        'original',
        'refactored'
      );
      return new NextResponse(patchText, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="patchpilot-${filePath.replace(/[\/\\]/g, '-')}.patch"`
        }
      });
    } catch (patchErr: any) {
      return NextResponse.json(
        { error: `Patch generation error: ${patchErr.message}` },
        { status: 500 }
      );
    }
  }

  // 4. Detailed error for endpoints that require external Groq inference when server.js is offline
  return NextResponse.json(
    {
      error: `Backend daemon is not running on port 3008. Please run "npm run server" or "npm run dev:all" in your terminal to start the Express intelligence engine.`
    },
    { status: 503 }
  );
}

async function proxyRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND_BASE_URL}/api/${path}${search}`;

  const isGetOrHead = req.method === 'GET' || req.method === 'HEAD';
  let bodyBuffer: ArrayBuffer | undefined = undefined;
  let bodyText = '';

  if (!isGetOrHead) {
    try {
      bodyBuffer = await req.arrayBuffer();
      bodyText = new TextDecoder().decode(bodyBuffer);
    } catch {
      // Ignore body read errors
    }
  }

  try {
    const headers = new Headers(req.headers);
    headers.delete('host');

    // Attempt to proxy to the Express server running on port 3008
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: bodyBuffer,
      // @ts-ignore
      duplex: 'half',
      signal: AbortSignal.timeout(5000),
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    // If backend connection fails (port 3008 not running), invoke graceful in-process fallback
    console.warn(`[Next.js API Proxy] Port 3008 not reachable for /api/${path}. Using integrated fallback.`);
    return handleFallback(req, path, bodyText);
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
export const HEAD = proxyRequest;
