import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Persona ID is required' },
        { status: 400 }
      )
    }

    // Delete the persona (this will cascade delete conversations and messages)
    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting persona:', error)
      throw error
    }

    return NextResponse.json({ 
      success: true,
      message: 'Persona deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete persona error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete persona' },
      { status: 500 }
    )
  }
}