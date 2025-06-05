'use client'

export function DebugPanel() {
  const envVars = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 rounded p-4 text-xs max-w-sm">
      <div className="font-bold mb-2">Debug Info:</div>
      <div>URL: {envVars.supabaseUrl || '❌ Missing'}</div>
      <div>Anon Key: {envVars.hasAnonKey ? `✅ ${envVars.anonKeyLength} chars` : '❌ Missing'}</div>
      <div>Environment: {process.env.NODE_ENV}</div>
    </div>
  )
}