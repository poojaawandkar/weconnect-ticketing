/*
 * Converts a FileList into the attachment shape TicketDetails.jsx
 * already knows how to render (conversation message attachments
 * and, now, resolution attachments): { id, name, size, type,
 * preview, file }.
 */

export function filesToAttachments(fileList) {
  const files = Array.from(fileList || [])

  return files.map((file, index) => ({
    id: `${Date.now()}-${index}`,

    name: file.name,

    size:
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`,

    type: file.type.startsWith('image/') ? 'image' : 'file',

    preview: file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : null,

    file,
  }))
}
