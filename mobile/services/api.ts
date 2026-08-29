// Shared HTTP client for the FastAPI backend.

const RAW_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

export const api = {
  get: async <T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> => {
    const cleanEndpoint = endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;

    const url = `${API_BASE_URL}${cleanEndpoint}`;

    console.log(`[API GET] ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(options?.headers as Record<string, string> || {}),
        },
        ...options,
      });

      console.log(`[API GET] response status: ${response.status}`);

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `API GET error (${response.status}): ${responseText}`
        );
      }

      return JSON.parse(responseText) as T;
    } catch (err: any) {
      console.error(`[API GET Exception] for ${url}:`, err);
      if (err.message && err.message.includes('Network request failed')) {
        throw new Error(
          `Unable to connect to backend at ${url}. Please verify your device and server are on the same network.`
        );
      }
      throw err;
    }
  },

  post: async <T>(
    endpoint: string,
    body: any,
    options?: RequestInit
  ): Promise<T> => {
    const cleanEndpoint = endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;

    const url = `${API_BASE_URL}${cleanEndpoint}`;

    console.log(`[API POST] ${url}`);

    const isFormData = Boolean(
      body && (
        (typeof FormData !== 'undefined' && body instanceof FormData) ||
        typeof body.getParts === 'function' ||
        Array.isArray(body._parts)
      )
    );

    console.log(`[API POST] isFormData: ${isFormData}`);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };

    let requestBody: any = body;

    if (!isFormData && typeof body === 'object' && body !== null) {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }

    // IMPORTANT:
    // Do NOT manually set Content-Type for FormData.
    // fetch/runtime must generate the multipart boundary itself.

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: requestBody,
        ...options,
      });

      console.log(`[API POST] response status: ${response.status}`);

      const responseText = await response.text();

      if (!response.ok) {
        let parsedDetail = responseText;
        try {
          const errorJson = JSON.parse(responseText);
          if (errorJson?.detail) {
            if (Array.isArray(errorJson.detail)) {
              parsedDetail = errorJson.detail
                .map((d: any) => `${d.loc ? d.loc.join('.') : 'field'}: ${d.msg}`)
                .join('; ');
            } else if (typeof errorJson.detail === 'string') {
              parsedDetail = errorJson.detail;
            } else {
              parsedDetail = JSON.stringify(errorJson.detail);
            }
          }
        } catch {
          // keep responseText as parsedDetail
        }
        console.error(`[API POST Error ${response.status}]`, parsedDetail);
        throw new Error(`API POST error (${response.status}): ${parsedDetail}`);
      }

      return JSON.parse(responseText) as T;
    } catch (err: any) {
      console.error(`[API POST Exception] for ${url}:`, err);
      if (err.message && err.message.includes('Network request failed')) {
        throw new Error(
          `Unable to connect to backend at ${url}. Please verify your phone and Mac are on the same Wi-Fi network and backend is running on 0.0.0.0:8000.`
        );
      }
      throw err;
    }
  },
};