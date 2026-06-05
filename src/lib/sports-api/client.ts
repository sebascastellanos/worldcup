const BASE_URL = process.env.FOOTBALL_API_BASE_URL ?? 'https://api.football-data.org/v4'

export async function fetchFromSportsApi(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY! },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`Sports API error: ${res.status} ${path}`)
  return res.json()
}
