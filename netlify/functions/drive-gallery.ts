import type { Handler } from '@netlify/functions'

const API = 'https://www.googleapis.com/drive/v3/files'
const FOLDER_MIME = 'application/vnd.google-apps.folder'

type DriveFile = { id: string; name: string; mimeType: string; createdTime?: string; modifiedTime?: string; thumbnailLink?: string; imageMediaMetadata?: { width?: number; height?: number } }

async function listFiles(folderId: string, apiKey: string): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    key: apiKey,
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id,name,mimeType,createdTime,modifiedTime,thumbnailLink,imageMediaMetadata)',
    orderBy: 'name',
    pageSize: '1000',
  })
  const response = await fetch(`${API}?${params}`)
  if (!response.ok) throw new Error(`Google Drive returned ${response.status}`)
  const data = await response.json() as { files?: DriveFile[] }
  return data.files ?? []
}

export const handler: Handler = async () => {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY
  const rootFolder = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!apiKey || !rootFolder) return { statusCode: 503, body: JSON.stringify({ error: 'Drive gallery is not configured' }) }

  try {
    const rootFiles = await listFiles(rootFolder, apiKey)
    const folders = rootFiles.filter((file) => file.mimeType === FOLDER_MIME)
    const albums = await Promise.all(folders.map(async (folder) => {
      const files = (await listFiles(folder.id, apiKey)).filter((file) => file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/'))
      const media = files.map((file) => ({
        id: file.id,
        name: file.name.replace(/\.[^.]+$/, ''),
        type: file.mimeType.startsWith('video/') ? 'video' : 'image',
        src: `/.netlify/functions/drive-media?id=${encodeURIComponent(file.id)}`,
        thumbnail: file.thumbnailLink?.replace(/=s\d+$/, '=w1200') ?? `/.netlify/functions/drive-media?id=${encodeURIComponent(file.id)}`,
      }))
      const dateMatch = folder.name.match(/(20\d{2})[-_ ](\d{2})[-_ ](\d{2})/)
      const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : folder.createdTime?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
      const title = folder.name.replace(/[-_ ]?20\d{2}[-_ ]\d{2}[-_ ]\d{2}/, '').replace(/[_-]+/g, ' ').trim()
      return {
        id: folder.id,
        title,
        eyebrow: 'Shared memory',
        date,
        location: 'With friends & family',
        description: `Photos and videos shared from ${title}.`,
        cover: media[0]?.thumbnail ?? '',
        color: '#8c6f58',
        media,
      }
    }))
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, s-maxage=900' }, body: JSON.stringify({ albums: albums.filter((album) => album.media.length) }) }
  } catch (error) {
    return { statusCode: 502, body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to read Google Drive' }) }
  }
}
