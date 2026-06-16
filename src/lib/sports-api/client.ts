const BASE_URL = process.env.FOOTBALL_API_BASE_URL ?? 'https://api.football-data.org/v4'

async function fetchOnce(path: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY! },
      next: { revalidate: 0 },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Sports API error: ${res.status} ${path}`)
    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchFromSportsApi(path: string) {
  try {
    return await fetchOnce(path)
  } catch {
    // retry once after 2s
    await new Promise(r => setTimeout(r, 2000))
    return fetchOnce(path)
  }
}
