export interface Tool {
  name: string
  path: string
  desc: string
  icon: string
  categoryId: string
  isPopular: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
}

export const CATEGORIES: Category[] = [
  { id: 'text', name: 'Text & Content', slug: 'text-tools' },
  { id: 'image', name: 'Image & Media', slug: 'image-tools' },
  { id: 'audio', name: 'Audio Editing', slug: 'audio' },
  { id: 'pdf', name: 'PDF Tools', slug: 'pdf-tools' },
  { id: 'generators', name: 'Identity & Data', slug: 'generators' },
  { id: 'business', name: 'Business & Finance', slug: 'business' },
];

export const TOOLS: Tool[] = [
  // Text & Content Tools
  { name: 'Word & Character Counter', path: '/word-counter', desc: 'Count words, characters, and sentences instantly.', icon: '123', categoryId: 'text', isPopular: true },
  { name: 'Case Converter Tool', path: '/case-converter', desc: 'Convert text to UPPERCASE, lowercase, CamelCase.', icon: 'Aa', categoryId: 'text', isPopular: false },
  { name: 'Turn Idea to Social Post', path: '/turn-into-content', desc: 'AI rewrites your random thoughts into TikToks/Tweets.', icon: '✍️', categoryId: 'text', isPopular: true },

  // Image & Media Tools
  { name: 'Image File Compressor', path: '/file-size-reducer', desc: 'Reduce JPG/PNG file sizes in seconds.', icon: '🖼️', categoryId: 'image', isPopular: true },
  { name: 'Image Format Converter', path: '/image-format-converter', desc: 'Convert PNGs, JPGs, or WebP images offline.', icon: '🔄', categoryId: 'image', isPopular: true },
  { name: 'Image to Text (OCR Recognizer)', path: '/image-to-text', desc: 'Extract words and copy text from any picture.', icon: '🔎', categoryId: 'image', isPopular: true },
  { name: 'QR Code Creator', path: '/qr-code-creator', desc: 'Generate and downlaod custom QR codes.', icon: '📱', categoryId: 'image', isPopular: false },
  
  // Audio Editors
  { name: 'AI Auto-Caption Generator', path: '/auto-caption', desc: 'AI adds captions to your video. Edit styles, preview on TikTok/Instagram/YouTube, and download.', icon: '✨', categoryId: 'audio', isPopular: true },
  { name: 'Video to Audio Converter', path: '/video-to-audio', desc: 'Extract MP3 sound from MP4/MOV videos.', icon: '📻', categoryId: 'audio', isPopular: false },
  { name: 'Audio Joiner & Combiner', path: '/audio-joiner', desc: 'Merge multiple songs into one track.', icon: '🔀', categoryId: 'audio', isPopular: true },
  { name: 'Audio Cutter & Splitter', path: '/audio-splitter', desc: 'Trim and cut apart sound files easily.', icon: '✂️', categoryId: 'audio', isPopular: false },

  // PDF
  { name: 'Compress PDF Size', path: '/compress-pdf', desc: 'Shrink large PDF documents.', icon: '📉', categoryId: 'pdf', isPopular: true },
  { name: 'Merge PDFs Together', path: '/merge-pdf', desc: 'Combine multiple PDF files into one.', icon: '📚', categoryId: 'pdf', isPopular: false },
  { name: 'Split PDF Pages', path: '/split-pdf', desc: 'Extract specific pages from a PDF document.', icon: '📄', categoryId: 'pdf', isPopular: false },
  
  // Generators & Identity
  { name: 'Social Username Generator', path: '/username-generator', desc: 'AI creates catchy handles for TikTok, IG, etc.', icon: '@', categoryId: 'generators', isPopular: true },
  { name: 'Check Username Availability', path: '/username-checker', desc: 'Check if a handle is taken across 15+ networks.', icon: '✅', categoryId: 'generators', isPopular: true },
  { name: 'Fake US Identity Generator', path: '/us-profile-generator', desc: 'Create full names, addresses, and demographics.', icon: '👤', categoryId: 'generators', isPopular: false },

  // Business Tools
  { name: 'Professional Invoice Generator', path: '/invoice-generator', desc: 'Create and save beautiful PDF invoices.', icon: '🏢', categoryId: 'business', isPopular: true },
  { name: 'Custom Receipt Generator', path: '/receipt-generator', desc: 'Create professional multi-currency invoice receipts.', icon: '🧾', categoryId: 'business', isPopular: false },
]
