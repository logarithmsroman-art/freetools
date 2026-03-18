import { NextRequest, NextResponse } from 'next/server'

interface Platform {
  name: string
  url: string
  availableCodes: number[] // HTTP codes that usually imply "available" (like 404)
  takenCodes: number[]     // HTTP codes that mean "taken" (like 200)
}

const PLATFORMS: Record<string, Platform> = {
  instagram: { name: 'Instagram', url: 'https://www.instagram.com/{}/', availableCodes: [404], takenCodes: [200] },
  facebook: { name: 'Facebook', url: 'https://www.facebook.com/{}', availableCodes: [404], takenCodes: [200] },
  twitter: { name: 'Twitter', url: 'https://twitter.com/{}', availableCodes: [404], takenCodes: [200] },
  github: { name: 'GitHub', url: 'https://github.com/{}', availableCodes: [404], takenCodes: [200] },
  reddit: { name: 'Reddit', url: 'https://www.reddit.com/user/{}', availableCodes: [404], takenCodes: [200] },
  twitch: { name: 'Twitch', url: 'https://www.twitch.tv/{}', availableCodes: [404], takenCodes: [200] },
  pinterest: { name: 'Pinterest', url: 'https://www.pinterest.com/{}/', availableCodes: [404], takenCodes: [200] },
  vimeo: { name: 'Vimeo', url: 'https://vimeo.com/{}', availableCodes: [404], takenCodes: [200] },
  wattpad: { name: 'Wattpad', url: 'https://www.wattpad.com/user/{}', availableCodes: [404], takenCodes: [200] },
  deviantart: { name: 'DeviantArt', url: 'https://www.deviantart.com/{}', availableCodes: [404], takenCodes: [200] },
  steam: { name: 'Steam', url: 'https://steamcommunity.com/id/{}', availableCodes: [404], takenCodes: [200] },
  soundcloud: { name: 'SoundCloud', url: 'https://soundcloud.com/{}', availableCodes: [404], takenCodes: [200] },
  bandcamp: { name: 'Bandcamp', url: 'https://{}.bandcamp.com', availableCodes: [404], takenCodes: [200] },
  medium: { name: 'Medium', url: 'https://medium.com/@{}', availableCodes: [404], takenCodes: [200] },
  dribbble: { name: 'Dribbble', url: 'https://dribbble.com/{}', availableCodes: [404], takenCodes: [200] },
  imgur: { name: 'Imgur', url: 'https://imgur.com/user/{}', availableCodes: [404], takenCodes: [200] },
  youtube: { name: 'YouTube', url: 'https://www.youtube.com/@{}', availableCodes: [404], takenCodes: [200] },
  onlyfans: { name: 'OnlyFans', url: 'https://onlyfans.com/{}', availableCodes: [404], takenCodes: [200] }
}

export async function POST(req: NextRequest) {
  try {
    const { username, platformId } = await req.json()

    if (!username || !platformId || !PLATFORMS[platformId]) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const platform = PLATFORMS[platformId]
    const targetUrl = platform.url.replace('{}', encodeURIComponent(username))

    // Use a browser-like user agent to avoid basic blocks
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      // Short timeout to keep checking fast
      signal: AbortSignal.timeout(6000)
    })

    const status = response.status

    if (platform.availableCodes.includes(status)) {
      return NextResponse.json({ status: 'available' })
    } else if (platform.takenCodes.includes(status)) {
      return NextResponse.json({ status: 'taken' })
    } else {
      // 403, 429, 500 etc mapping to "unverified"
      return NextResponse.json({ status: 'unverified', code: status })
    }

  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      return NextResponse.json({ status: 'unverified', reason: 'timeout' })
    }
    return NextResponse.json({ status: 'unverified', reason: 'error' })
  }
}
