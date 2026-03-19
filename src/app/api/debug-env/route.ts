import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  const replicateKey = process.env.REPLICATE_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY

  return NextResponse.json({
    replicate: replicateKey
      ? `✅ Found (starts with: ${replicateKey.slice(0, 6)}...)`
      : '❌ MISSING or EMPTY',
    gemini: geminiKey
      ? `✅ Found (starts with: ${geminiKey.slice(0, 6)}...)`
      : '❌ MISSING or EMPTY',
  })
}
