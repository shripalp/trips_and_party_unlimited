import type { Handler } from '@netlify/functions'

const API = 'https://www.googleapis.com/drive/v3/files'
const FOLDER_MIME = 'application/vnd.google-apps.folder'

type DriveFile = { id: string; name: string; mimeType: string; createdTime?: string; modifiedTime?: string; thumbnailLink?: string; imageMediaMetadata?: { width?: number; height?: number } }

function fileType(mimeType: string): 'image' | 'video' | 'document' | null {
  if (mimeType === FOLDER_MIME) return null
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf' || mimeType.startsWith('application/vnd.google-apps.') || mimeType.includes('wordprocessingml') || mimeType.includes('spreadsheetml') || mimeType.includes('presentationml') || mimeType === 'application/msword' || mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.ms-powerpoint' || mimeType.startsWith('text/')) return 'document'
  return null
}

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
      const files = (await listFiles(folder.id, apiKey)).filter((file) => fileType(file.mimeType))
      const media = files.map((file) => {
        const type = fileType(file.mimeType)!
        const preview = file.thumbnailLink?.replace(/=s\d+$/, '=w2400')
        return {
          id: file.id,
          name: file.name.replace(/\.[^.]+$/, ''),
          type,
          src: type === 'image' ? preview ?? `/.netlify/functions/drive-media?id=${encodeURIComponent(file.id)}` : `https://drive.google.com/file/d/${encodeURIComponent(file.id)}/preview`,
          thumbnail: file.thumbnailLink?.replace(/=s\d+$/, '=w1200') ?? `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w1200`,
        }
      })
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
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=30' }, body: JSON.stringify({ albums: albums.filter((album) => album.media.length) }) }
  } catch (error) {
    return { statusCode: 502, body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to read Google Drive' }) }
  }
}
