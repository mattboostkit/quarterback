'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function SimpleTest() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      console.log('Testing supabase client:', supabase)
      
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('project_id', '22222222-2222-2222-2222-222222222222')
        .order('created_at', { ascending: false })

      console.log('Frontend query result:', { data, error })
      
      if (error) {
        setResult(`❌ Error: ${error.message} (Code: ${error.code})`)
      } else {
        setResult(`✅ Success: Found ${data.length} personas`)
      }
    } catch (err) {
      console.error('Catch error:', err)
      setResult(`❌ Catch Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const testStorage = async () => {
    setLoading(true)
    try {
      const testFile = new File(['test'], 'test.csv', { type: 'text/csv' })
      const fileName = `test-${Date.now()}.csv`
      
      const { data, error } = await supabase.storage
        .from('csv-uploads')
        .upload(fileName, testFile)

      console.log('Storage test result:', { data, error })
      
      if (error) {
        setResult(`❌ Storage Error: ${error.message}`)
      } else {
        setResult(`✅ Storage Success: ${data.path}`)
        
        // Clean up
        await supabase.storage.from('csv-uploads').remove([fileName])
      }
    } catch (err) {
      console.error('Storage catch error:', err)
      setResult(`❌ Storage Catch Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-32 right-4 bg-yellow-100 border-2 border-yellow-500 rounded p-4 text-sm max-w-sm shadow-lg z-50">
      <div className="font-bold mb-2 text-black">🧪 Connection Test:</div>
      <div className="space-y-2">
        <button 
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Database'}
        </button>
        <button 
          onClick={testStorage}
          disabled={loading}
          className="bg-green-500 text-white px-3 py-1 rounded text-xs disabled:opacity-50 ml-2"
        >
          {loading ? 'Testing...' : 'Test Storage'}
        </button>
      </div>
      <div className="mt-2 text-xs">{result}</div>
    </div>
  )
}