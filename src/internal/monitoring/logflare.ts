import { defaultPreparePayload } from 'pino-logflare'
import { PayloadMeta } from 'pino-logflare/dist/httpStream'

let logCount = 0
let errorCount = 0
let lastSuccessTime: Date | null = null
let lastErrorTime: Date | null = null

export function onPreparePayload(payload: Record<string, object>, meta: PayloadMeta) {
  const item = defaultPreparePayload(payload, meta)
  item.project = payload.project
  
  // Log every 10th successful batch to avoid spam
  logCount++
  if (logCount % 10 === 0) {
    lastSuccessTime = new Date()
    console.log(`[Logflare][Success] Sent batch #${logCount} to Logflare (${meta.batch?.length || 0} logs)`)
    console.log(`[Logflare][Stats] Total batches: ${logCount}, Errors: ${errorCount}, Last success: ${lastSuccessTime.toISOString()}`)
  }
  
  return item
}

export function onError(_payload: Record<string, object>, err: Error) {
  errorCount++
  lastErrorTime = new Date()
  console.error(`[Logflare][Error] Failed to send logs to Logflare`)
  console.error(`[Logflare][Error] Message: ${err.message}`)
  console.error(`[Logflare][Error] Stack: ${err.stack}`)
  console.error(`[Logflare][Stats] Total batches: ${logCount}, Errors: ${errorCount}, Last error: ${lastErrorTime.toISOString()}`)
  
  // Log configuration for debugging (without sensitive tokens)
  const config = {
    apiBaseUrl: process.env.LOGFLARE_URL || 'not set',
    sourceToken: process.env.LOGFLARE_SOURCE_TOKEN ? `${process.env.LOGFLARE_SOURCE_TOKEN.substring(0, 8)}...` : 'not set',
    apiKey: process.env.LOGFLARE_API_KEY ? `${process.env.LOGFLARE_API_KEY.substring(0, 8)}...` : 'not set',
    batchSize: process.env.LOGFLARE_BATCH_SIZE || 'default',
    enabled: process.env.LOGFLARE_ENABLED || 'not set',
  }
  console.error(`[Logflare][Config]`, JSON.stringify(config, null, 2))
}

