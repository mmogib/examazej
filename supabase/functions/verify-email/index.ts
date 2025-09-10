import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Verifying email:', email);

    // Get Airtable credentials from environment
    const airtableApiKey = Deno.env.get('AIRTABLE_API_KEY');
    const airtableBaseId = Deno.env.get('AIRTABLE_BASE_ID');
    const airtableTableName = Deno.env.get('AIRTABLE_TABLE_NAME');

    console.log('Airtable config check:', {
      hasApiKey: !!airtableApiKey,
      hasBaseId: !!airtableBaseId,
      hasTableName: !!airtableTableName,
      apiKeyLength: airtableApiKey?.length || 0
    });

    if (!airtableApiKey || !airtableBaseId || !airtableTableName) {
      console.error('Missing Airtable configuration:', {
        hasApiKey: !!airtableApiKey,
        hasBaseId: !!airtableBaseId,
        hasTableName: !!airtableTableName
      });
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Airtable credentials' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if email exists in Airtable with required conditions
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(airtableTableName)}?filterByFormula={Email}="${email}"`;
    
    console.log('Making Airtable request to:', airtableUrl);
    
    const response = await fetch(airtableUrl, {
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Airtable API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: airtableUrl
      });
      return new Response(
        JSON.stringify({ 
          error: `Failed to verify email: ${response.status} ${response.statusText}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    const userRecord = data.records && data.records.length > 0 ? data.records[0] : null;
    
    // If no user record found
    if (!userRecord) {
      return new Response(
        JSON.stringify({ 
          error: `Email not found in authorized users database. Please contact an administrator.`
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Found user record:', userRecord.fields);

    // Check Status field
    const status = userRecord.fields.Status;
    if (!status || status.toLowerCase() !== 'active') {
      console.log('User status check failed:', { status });
      return new Response(
        JSON.stringify({ 
          error: `Access denied. Account status: ${status || 'inactive'}`
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check ExpirationDate
    const expirationDate = userRecord.fields.ExpirationDate;
    if (expirationDate) {
      const expDate = new Date(expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      
      if (expDate < today) {
        console.log('User expiration check failed:', { expirationDate, today: today.toISOString() });
        return new Response(
          JSON.stringify({ 
            error: `Access expired on ${expDate.toLocaleDateString()}. Please contact an administrator.`
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    console.log('All checks passed for user:', email);

    // All checks passed - create user session directly
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Try to get existing user first
    const { data: existingUsers, error: getUserError } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    let user;
    if (existingUser) {
      console.log('Found existing user:', existingUser.id);
      user = existingUser;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
      });

      if (createError) {
        console.error('Failed to create user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      user = newUser.user;
      console.log('Created new user:', user?.id);
    }

    // Generate session token for the client
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: req.headers.get('origin') || req.headers.get('referer') || 'https://fd004b8b-7165-467a-a9d1-1f1e593e64c0.sandbox.lovable.dev'
      }
    });

    if (sessionError) {
      console.error('Failed to generate session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract access and refresh tokens from the generated link
    const actionLink = sessionData.properties.action_link;
    const urlParams = new URL(actionLink).hash.substring(1);
    const params = new URLSearchParams(urlParams);
    
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) {
      console.error('Failed to extract tokens from action link');
      return new Response(
        JSON.stringify({ error: 'Authentication failed - could not create session' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        session: {
          access_token: accessToken,
          refresh_token: refreshToken,
          user: user
        },
        message: 'Authentication successful' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in verify-email function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});