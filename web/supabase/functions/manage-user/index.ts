import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ManageUserRequest {
  action: 'ban' | 'unban' | 'soft_delete' | 'restore';
  user_id: string;
  banned_until?: string; // ISO date string for temporary ban
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with anon key for auth validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate the JWT and get claims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('JWT validation error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requesterId = claimsData.claims.sub;
    console.log('Request from user:', requesterId);

    // Check if requester is Admin or Staff
    const { data: requesterProfile, error: profileError } = await supabaseAuth
      .from('profiles')
      .select('role')
      .eq('id', requesterId)
      .single();

    if (profileError || !requesterProfile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Profile not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['Admin', 'Staff'].includes(requesterProfile.role)) {
      console.error('Permission denied for role:', requesterProfile.role);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin or Staff role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { action, user_id, banned_until }: ManageUserRequest = await req.json();

    if (!action || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action and user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Action: ${action}, Target User: ${user_id}`);

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    let result;

    switch (action) {
      case 'ban': {
        // Set banned_until to far future if not specified (permanent ban)
        const banDate = banned_until || new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
        
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          ban_duration: 'none', // We'll use user_metadata instead
          user_metadata: { banned_until: banDate }
        });

        if (error) throw error;

        // Also update is_active in profiles
        await supabaseAdmin
          .from('profiles')
          .update({ is_active: false })
          .eq('id', user_id);

        result = { success: true, message: 'User banned successfully', banned_until: banDate };
        break;
      }

      case 'unban': {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          user_metadata: { banned_until: null }
        });

        if (error) throw error;

        // Update is_active in profiles
        await supabaseAdmin
          .from('profiles')
          .update({ is_active: true })
          .eq('id', user_id);

        result = { success: true, message: 'User unbanned successfully' };
        break;
      }

      case 'soft_delete': {
        // Set deleted_at in user_metadata
        const deletedAt = new Date().toISOString();
        
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          user_metadata: { deleted_at: deletedAt }
        });

        if (error) throw error;

        // Update is_active in profiles
        await supabaseAdmin
          .from('profiles')
          .update({ is_active: false })
          .eq('id', user_id);

        result = { success: true, message: 'User soft deleted successfully', deleted_at: deletedAt };
        break;
      }

      case 'restore': {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          user_metadata: { deleted_at: null, banned_until: null }
        });

        if (error) throw error;

        // Update is_active in profiles
        await supabaseAdmin
          .from('profiles')
          .update({ is_active: true })
          .eq('id', user_id);

        result = { success: true, message: 'User restored successfully' };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: ban, unban, soft_delete, or restore' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('Operation result:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in manage-user function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
