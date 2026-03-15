import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !['admin', 'developer'].includes(profile.role)) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing env vars for suspend')
      return NextResponse.json(
        { error: '環境変数が設定されていません' },
        { status: 500 }
      )
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey)

    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: '87600h',
    })

    if (authError) {
      console.error('Suspend user error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .update({ is_suspended: true })
      .eq('id', userId)

    if (dbError) {
      console.error('Update profile error:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Suspend user error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'エラーが発生しました' },
      { status: 500 }
    )
  }
}
