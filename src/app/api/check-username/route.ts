import { NextRequest, NextResponse } from 'next/server'

interface Platform {
  name: string
  url: string
  availableCodes: number[]
  takenCodes: number[]
  regex?: string
  minLength?: number
  maxLength?: number
  availableStrings?: string[] // If status is 200, check for these to mean AVAILABLE
  takenStrings?: string[]     // If status is 200, check for these to mean TAKEN
}

const PLATFORMS: Record<string, Platform> = {
  instagram: { 
    name: 'Instagram', 
    url: 'https://www.instagram.com/{}/', 
    availableCodes: [404], 
    takenCodes: [200], 
    regex: '^[a-zA-Z0-9._]+$', 
    maxLength: 30,
    availableStrings: ['Page Not Found', 'The link you followed may be broken']
  },
  facebook: { 
    name: 'Facebook', 
    url: 'https://www.facebook.com/{}', 
    availableCodes: [404], 
    takenCodes: [200], 
    regex: '^[a-zA-Z0-9.]+$', 
    minLength: 5,
    availableStrings: ['Content Not Found', 'This page isn\'t available']
  },
  twitter: { 
    name: 'X (Twitter)', 
    url: 'https://twitter.com/{}', 
    availableCodes: [404], 
    takenCodes: [200], 
    regex: '^[a-zA-Z0-9_]+$', 
    minLength: 4, 
    maxLength: 15,
    availableStrings: ['This account doesn\'t exist', 'Something went wrong', 'Page not found']
  },
  github: { 
    name: 'GitHub', 
    url: 'https://github.com/{}', 
    availableCodes: [404], 
    takenCodes: [200], 
    regex: '^[a-zA-Z0-9-]+$', 
    maxLength: 39 
  },
  reddit: { 
    name: 'Reddit', 
    url: 'https://www.reddit.com/user/{}', 
    availableCodes: [404], 
    takenCodes: [200, 302], 
    availableStrings: ['Reddit doesn\'t have a user with that name', 'suspended']
  },
  twitch: { name: 'Twitch', url: 'https://www.twitch.tv/{}', availableCodes: [404], takenCodes: [200] },
  pinterest: { name: 'Pinterest', url: 'https://www.pinterest.com/{}/', availableCodes: [404], takenCodes: [200] },
  youtube: { 
    name: 'YouTube', 
    url: 'https://www.youtube.com/@{}', 
    availableCodes: [404], 
    takenCodes: [200],
    availableStrings: ['This page isn\'t available']
  },
  medium: { name: 'Medium', url: 'https://medium.com/@{}', availableCodes: [404], takenCodes: [200] },
  dribbble: { name: 'Dribbble', url: 'https://dribbble.com/{}', availableCodes: [404], takenCodes: [200] },
  onlyfans: { name: 'OnlyFans', url: 'https://onlyfans.com/{}', availableCodes: [404], takenCodes: [200] }
}

export async function POST(req: NextRequest) {
  try {
    const { username, platformId } = await req.json()

    if (!username || !platformId || !PLATFORMS[platformId]) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const platform = PLATFORMS[platformId]

    // 1. Local Validation
    if (platform.minLength && username.length < platform.minLength) {
      return NextResponse.json({ status: 'invalid', reason: `Too short (min ${platform.minLength})` })
    }
    if (platform.maxLength && username.length > platform.maxLength) {
      return NextResponse.json({ status: 'invalid', reason: `Too long (max ${platform.maxLength})` })
    }
    if (platform.regex && !new RegExp(platform.regex).test(username)) {
      return NextResponse.json({ status: 'invalid', reason: 'Invalid characters' })
    }

    const targetUrl = platform.url.replace('{}', encodeURIComponent(username))

    // 2. Fetch with optimized headers
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000)
    })

    const status = response.status

    // 3. Status Code Analysis
    if (platform.availableCodes.includes(status)) {
      return NextResponse.json({ status: 'available' })
    }

    // 4. Handle "Taken" codes with possible body inspection
    if (platform.takenCodes.includes(status)) {
      if (platform.availableStrings) {
        // Fetch body and check for "available" markers
        const bodyText = await response.text()
        const lowerBody = bodyText.toLowerCase()
        
        for (const str of platform.availableStrings) {
          if (lowerBody.includes(str.toLowerCase())) {
            return NextResponse.json({ status: 'available' })
          }
        }
      }
      return NextResponse.json({ status: 'taken' })
    }

    // 5. Blocked / Not Verified
    return NextResponse.json({ status: 'unverified', code: status, reason: status === 403 || status === 429 ? 'blocked' : 'error' })

  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      return NextResponse.json({ status: 'unverified', reason: 'timeout' })
    }
    return NextResponse.json({ status: 'unverified', reason: 'error', details: error.message })
  }
}

