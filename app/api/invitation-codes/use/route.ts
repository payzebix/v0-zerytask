import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  try {
    const { code, user_id } = await request.json()

    if (!code || !user_id) {
      return Response.json({ error: 'Missing code or user_id' }, { status: 400 })
    }

    // First, get the code to check its limits
    const { data: codeData, error: codeError } = await supabase
      .from('invitation_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (codeError || !codeData) {
      return Response.json({ error: 'Invalid invitation code' }, { status: 400 })
    }

    // Check if code has reached its max uses
    if (codeData.code_type === 'user' && codeData.current_uses >= codeData.max_uses) {
      // Check if we should reset the week (7 days have passed)
      const createdDate = new Date(codeData.week_reset_date)
      const now = new Date()
      const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysDiff >= 7) {
        // Reset the weekly count
        await supabase
          .from('invitation_codes')
          .update({
            current_uses: 0,
            week_reset_date: now.toISOString(),
          })
          .eq('code', code.toUpperCase())
      } else {
        return Response.json({ 
          error: `This code has reached its weekly limit of ${codeData.max_uses} invitations. Try again next week.` 
        }, { status: 400 })
      }
    }

    // Track which code was used in the users table
    await supabase
      .from('users')
      .update({ used_invitation_code: code.toUpperCase() })
      .eq('id', user_id)

    // Increment the code usage count
    const newCurrentUses = (codeData.current_uses || 0) + 1
    
    // Update the code to mark as used
    const { data, error } = await supabase
      .from('invitation_codes')
      .update({
        is_used: newCurrentUses >= codeData.max_uses ? true : false,
        used_by: user_id,
        status: newCurrentUses >= codeData.max_uses ? 'exhausted' : 'active',
        current_uses: newCurrentUses,
        used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('code', code.toUpperCase())
      .select()
      .single()

    if (error) {
      console.error('[v0] Error marking code as used:', error)
      return Response.json({ error: 'Failed to mark code as used' }, { status: 500 })
    }

    return Response.json({ message: 'Code used successfully', code: data }, { status: 200 })
  } catch (error) {
    console.error('[v0] Error using invitation code:', error)
    return Response.json({ error: 'Failed to use code' }, { status: 500 })
  }
}
