/**
 * create-designer-account — 원장이 디자이너 계정을 생성할 때 호출
 *
 * Supabase admin.createUser() 는 서비스 키가 필요해 브라우저에서 직접 호출 불가.
 * 원장 JWT → Edge Function 검증 → admin.createUser() 서버에서 실행.
 *
 * 호출 방법:
 *   supabase.functions.invoke('create-designer-account', {
 *     body: { email, password, shopId, name, designerName, designerId }
 *   })
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RequestBody {
  email:        string;
  password:     string;
  shopId:       string;
  name:         string;
  designerName: string;
  designerId:   string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
    });
  }

  try {
    // 요청자 JWT 검증 (원장만 허용)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return new Response('Unauthorized', { status: 401 });

    // 원장(owner) 역할 확인
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: designerRow } = await supabaseAdmin
      .from('designers')
      .select('role, shop_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!designerRow || !['owner', 'manager'].includes(designerRow.role)) {
      return new Response('Forbidden', { status: 403 });
    }

    const body: RequestBody = await req.json();

    // 디자이너 계정 생성
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email:          body.email.toLowerCase().trim(),
      password:       body.password,
      email_confirm:  true,
      user_metadata: {
        shopId:       body.shopId,
        name:         body.name,
        role:         'designer',
        designerName: body.designerName,
        designerId:   body.designerId,
      },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // designers 테이블에 auth_user_id 연결
    await supabaseAdmin
      .from('designers')
      .update({ auth_user_id: newUser.user.id })
      .eq('id', body.designerId);

    return new Response(
      JSON.stringify({ userId: newUser.user.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    console.error('[create-designer-account]', err);
    return new Response('Internal Server Error', { status: 500 });
  }
});
