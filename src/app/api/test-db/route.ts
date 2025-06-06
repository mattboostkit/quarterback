import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const results: any = {}
  
  try {
    // Test each table
    const tables = ['clients', 'projects', 'personas', 'conversations', 'messages']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      results[table] = {
        exists: !error,
        error: error?.message || null,
        count: data?.length || 0
      }
    }
    
    return NextResponse.json({
      success: true,
      tables: results,
      instructions: {
        ifTablesNotExist: "Run the SQL scripts in Supabase dashboard:",
        step1: "Go to your Supabase project SQL Editor",
        step2: "Run supabase/schema.sql first",
        step3: "Then run supabase/setup-anon.sql",
        dashboardUrl: "https://supabase.com/dashboard/project/igthouwddtjftxaxuhqf/sql"
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      instructions: "Check your Supabase connection"
    })
  }
}