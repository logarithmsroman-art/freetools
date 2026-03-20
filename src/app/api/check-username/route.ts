import { NextRequest, NextResponse } from 'next/server'

interface Platform {
  name: string
  url: string
  availableCodes: number[]
  takenCodes: number[]
  regex?: string
  minLength?: number
  maxLength?: number
  availableStrings?: string[] // If found, the user is AVAILABLE
  blockedStrings?: string[]   // If found, we were BLOCKED (login walls, etc.)
}

const PLATFORMS: Record<string, Platform> = {
  instagram: { 
    name: 'Instagram', 
    url: 'https://www.instagram.com/{}/', 
    availableCodes: [404], 
    takenCodes: [200], 
    regex: '^[a-zA-Z0-9._]+$', 
    maxLength: 30,
    availableStrings: ['Page Not Found', 'The link you followed may be broken'],
    blockedStrings: ['/accounts/login/', 'login to instagram']
  },
  facebook: { 
    name: 'Facebook', 
    url: 'https://www.facebook.com/{}', 
    availableCodes: [404], 
    takenCodes: [200], 
    regex: '^[a-zA-Z0-9.]+$', 
    minLength: 5,
    availableStrings: ['Content Not Found', 'This page isn\'t available', 'The page you requested was not found'],
    blockedStrings: ['login.php', 'facebook.com/login']
  },
  twitter: { 
    name: 'X (Twitter)', 
    url: 'https://twitter.com/{}', 
    availableCodes: [404], 
    takenCodes: [200], 
    regex: '^[a-zA-Z0-9_]+$', 
    minLength: 4, 
    maxLength: 15,
    availableStrings: ['This account doesn\'t exist', 'Something went wrong', 'Page not found'],
    blockedStrings: ['/login?']
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
    availableStrings: ['Reddit doesn\'t have a user with that name', 'suspended', 'page not found'],
    blockedStrings: ['reddit.com/login']
  },
  twitch: { 
    name: 'Twitch', 
    url: 'https://www.twitch.tv/{}', 
    availableCodes: [404], 
    takenCodes: [200],
    availableStrings: ['content is unavailable', 'not found', 'Something went wrong']
  },
  pinterest: { 
    name: 'Pinterest', 
    url: 'https://www.pinterest.com/{}/', 
    availableCodes: [404], 
    takenCodes: [200],
    availableStrings: ['couldn\'t find that page', 'not found', 'find another idea']
  },
  youtube: { 
    name: 'YouTube', 
    url: 'https://www.youtube.com/@{}', 
    availableCodes: [404], 
    takenCodes: [200],
    availableStrings: ['This page isn\'t available', 'not found']
  },
  medium: { 
    name: 'Medium', 
    url: 'https://medium.com/@{}', 
    availableCodes: [404], 
    takenCodes: [200],
    availableStrings: ['not found', '404', 'Out of nothing']
  },
  dribbble: { name: 'Dribbble', url: 'https://dribbble.com/{}', availableCodes: [404], takenCodes: [200] },
  onlyfans: { 
    name: 'OnlyFans', 
    url: 'https://onlyfans.com/{}', 
    availableCodes: [404], 
    takenCodes: [200],
    availableStrings: ['not found', 'no post'],
    blockedStrings: ['security check', 'login']
  }
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      signal: AbortSignal.timeout(8000)
    })

    const status = response.status

    // 3. Status Code Analysis - Immediate 404 is always Available
    if (platform.availableCodes.includes(status)) {
      return NextResponse.json({ status: 'available' })
    }

    // 4. Handle "Taken" codes with body inspection
    if (platform.takenCodes.includes(status)) {
      const bodyText = await response.text()
      const lowerBody = bodyText.toLowerCase()

      // Check for Blocked indicators first
      if (platform.blockedStrings) {
        for (const str of platform.blockedStrings) {
          if (lowerBody.includes(str.toLowerCase())) {
            return NextResponse.json({ status: 'unverified', reason: 'blocked', details: 'Redirected to login' })
          }
        }
      }
      
      // Generic block detection if lots of "Sign Up" or "Login" text but it's a profile URL
      if (lowerBody.includes('confirm you\'re human') || lowerBody.includes('check your browser')) {
        return NextResponse.json({ status: 'unverified', reason: 'blocked', details: 'Bot challenge protected' })
      }

      // Check for Available markers in the 200 response
      if (platform.availableStrings) {
        for (const str of platform.availableStrings) {
          if (lowerBody.includes(str.toLowerCase())) {
            return NextResponse.json({ status: 'available' })
          }
        }
      }
      
      // No "available" or "blocked" markers found? Default to Taken
      return NextResponse.json({ status: 'taken' })
    }

    // 5. Explicitly Blocked Statuses
    return NextResponse.json({ status: 'unverified', reason: status === 403 || status === 429 ? 'blocked' : 'error', code: status })

  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      return NextResponse.json({ status: 'unverified', reason: 'timeout' })
    }
    return NextResponse.json({ status: 'unverified', reason: 'error', details: error.message })
  }
}

