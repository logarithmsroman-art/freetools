import { NextRequest, NextResponse } from 'next/server'

interface Platform {
  name: string
  url: string
  availableCodes: number[]
  takenCodes: number[]
  regex?: string
  minLength?: number
  maxLength?: number
  availableStrings?: string[]
  blockedStrings?: string[] // If these appear in the body, we are blocked
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
    availableStrings: ['Page Not Found', 'The link you followed may be broken', 'content isn\'t available'],
    blockedStrings: ['Log In', 'Instagram from Meta', 'Login • Instagram', 'Sign Up'],
    takenStrings: ['Followers', 'Following', 'Posts', 'Follow', 'Profile']
  },
  facebook: { 
    name: 'Facebook', 
    url: 'https://www.facebook.com/{}', 
    availableCodes: [404], 
    takenCodes: [200], 
    regex: '^[a-zA-Z0-9.]+$', 
    minLength: 5,
    availableStrings: ['Content Not Found', 'This page isn\'t available', 'The link you followed may be broken'],
    blockedStrings: ['Log In', 'Sign Up', 'security check'],
    takenStrings: ['Profile', 'Timeline', 'About', 'Friends']
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
    blockedStrings: ['Log in to X', 'Sign in to X', 'Sign up'],
    takenStrings: ['Joined', 'Followers', 'Following', '@']
  },
  github: { 
    name: 'GitHub', 
    url: 'https://github.com/{}', 
    availableCodes: [404], 
    takenCodes: [200], 
    regex: '^[a-zA-Z0-9-]+$', 
    maxLength: 39,
    takenStrings: ['Repositories', 'Projects', 'Followers']
  },
  reddit: { 
    name: 'Reddit', 
    url: 'https://www.reddit.com/user/{}', 
    availableCodes: [404], 
    takenCodes: [200, 302], 
    availableStrings: ['Reddit doesn\'t have a user with that name', 'suspended', 'page not found'],
    blockedStrings: ['verify you are human', 'whoa there'],
    takenStrings: ['Karma', 'Cake day', 'Chat']
  },
  twitch: { 
    name: 'Twitch', 
    url: 'https://www.twitch.tv/{}', 
    availableCodes: [404], 
    takenCodes: [200],
    availableStrings: ['content is unavailable', 'unless you\'ve got a time machine'],
    blockedStrings: ['passport.twitch.tv', 'Log In', 'Sign Up'],
    takenStrings: ['Followers', 'Bio', 'Schedule']
  },
  pinterest: { 
    name: 'Pinterest', 
    url: 'https://www.pinterest.com/{}/', 
    availableCodes: [404], 
    takenCodes: [200],
    availableStrings: ['User not found', 'Plus de résultats pour', 'Nessun résultat per'],
    blockedStrings: ['Log in', 'Sign up'],
    takenStrings: ['Pins', 'Followers', 'Following']
  },
  youtube: { 
    name: 'YouTube', 
    url: 'https://www.youtube.com/@{}', 
    availableCodes: [404], 
    takenCodes: [200],
    availableStrings: ['This page isn\'t available', '404 Not Found'],
    takenStrings: ['Subscribers', 'Videos', 'Join']
  },
  medium: { 
    name: 'Medium', 
    url: 'https://medium.com/@{}', 
    availableCodes: [404], 
    takenCodes: [200],
    availableStrings: ['Out of nothing, something', '404', 'User not found'],
    takenStrings: ['Following', 'Followers', 'Medium profile']
  },
  dribbble: { 
    name: 'Dribbble', 
    url: 'https://dribbble.com/{}', 
    availableCodes: [404], 
    takenCodes: [200],
    availableStrings: ['Whoops, that page is gone'],
    takenStrings: ['Dribbble profile', 'Shots', 'Followers']
  },
  onlyfans: { 
    name: 'OnlyFans', 
    url: 'https://onlyfans.com/{}', 
    availableCodes: [404], 
    takenCodes: [200],
    availableStrings: ['page is not available', 'this account is private'],
    blockedStrings: ['Cloudflare', 'Access denied'],
    takenStrings: ['Media', 'Likes']
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

    // 2. Fetch with optimized headers to mimic real browser better
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Referer': 'https://www.google.com/',
        'Cache-Control': 'max-age=0'
      },
      signal: AbortSignal.timeout(10000)
    })

    const status = response.status

    // 3. Status Code Analysis
    if (platform.availableCodes.includes(status)) {
      return NextResponse.json({ status: 'available' })
    }

    // 4. Handle Case by Case (200 OK often means blocked/wall)
    if (platform.takenCodes.includes(status) || status === 200) {
      const bodyText = await response.text()
      const lowerBody = bodyText.toLowerCase()

      // Title extraction for specific platform detection
      const titleMatch = bodyText.match(/<title>(.*?)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : ''

      // Instagram: If title is exactly "Instagram", it's a login wall
      if (platformId === 'instagram' && title === 'Instagram') {
        return NextResponse.json({ status: 'unverified', reason: 'blocked', details: 'Login wall (Instagram title)' })
      }
      
      // Pinterest: Generic "Pinterest" title usually means redirected to landing/login
      if (platformId === 'pinterest' && title === 'Pinterest') {
        return NextResponse.json({ status: 'unverified', reason: 'blocked', details: 'Login wall (Pinterest title)' })
      }

      // Check for BLOCKED markers in body
      if (platform.blockedStrings) {
        for (const str of platform.blockedStrings) {
          if (lowerBody.includes(str.toLowerCase())) {
            return NextResponse.json({ status: 'unverified', reason: 'blocked', details: 'Login wall detected' })
          }
        }
      }

      // Check for AVAILABLE markers in body
      if (platform.availableStrings) {
        for (const str of platform.availableStrings) {
          if (lowerBody.includes(str.toLowerCase())) {
            return NextResponse.json({ status: 'available' })
          }
        }
      }

      // Check for TAKEN markers (if we have any)
      if (platform.takenStrings) {
        for (const str of platform.takenStrings) {
          if (lowerBody.includes(str.toLowerCase())) {
            return NextResponse.json({ status: 'taken' })
          }
        }
      }

      // DEFAULT to unverified if nothing matches (avoid false positives for nonsense)
      // Only assume taken if we have basically no configuration for this platform
      if (!platform.availableStrings && !platform.takenStrings && !platform.blockedStrings) {
        return NextResponse.json({ status: 'taken' })
      }

      return NextResponse.json({ status: 'unverified', reason: 'unclear response', details: 'No profile markers found' })
    }

    // 5. Explicitly Blocked/Error Codes
    return NextResponse.json({ 
      status: 'unverified', 
      code: status, 
      reason: status === 403 || status === 429 ? 'blocked' : 'error' 
    })

  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      return NextResponse.json({ status: 'unverified', reason: 'timeout' })
    }
    return NextResponse.json({ status: 'unverified', reason: 'error', details: error.message })
  }
}



