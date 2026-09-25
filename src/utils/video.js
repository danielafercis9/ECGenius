export function toYouTubeEmbed(url) {
  try {
    const parsed = new URL(url)
    const id = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v')
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : url
  } catch { return url }
}
