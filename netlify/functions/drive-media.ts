import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY
  const id = event.queryStringParameters?.id
  if (!apiKey || !id) return { statusCode: 400, body: 'Missing media configuration' }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media&key=${encodeURIComponent(apiKey)}`)
  if (!response.ok) return { statusCode: response.status, body: 'Unable to load media' }
  const bytes = Buffer.from(await response.arrayBuffer())
  return {
    statusCode: 200,
    isBase64Encoded: true,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
    body: bytes.toString('base64'),
  }
}
