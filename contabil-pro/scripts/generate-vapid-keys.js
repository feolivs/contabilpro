/**
 * Generate VAPID keys for Web Push API
 * Run: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push')
const fs = require('fs')
const path = require('path')

console.log('🔑 Generating VAPID keys for Web Push API...\n')

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys()

console.log('✅ VAPID keys generated successfully!\n')
console.log('📋 Add these to your .env.local file:\n')
console.log('# Web Push API VAPID Keys')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`)
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`)
console.log(`VAPID_SUBJECT="mailto:your-email@example.com"`)
console.log('\n')

// Optionally save to a file
const envPath = path.join(__dirname, '..', '.env.vapid')
const envContent = `# Web Push API VAPID Keys
# Generated on ${new Date().toISOString()}
NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"
VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"
VAPID_SUBJECT="mailto:your-email@example.com"
`

fs.writeFileSync(envPath, envContent)
console.log(`💾 Keys saved to: ${envPath}`)
console.log('⚠️  Remember to add these to your .env.local file and keep the private key secure!')
console.log('⚠️  Do NOT commit .env.local or .env.vapid to version control!')

