import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('Verify shuffler user function invoked:', new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Debug endpoint to check configuration
    if (url.pathname.includes('debug')) {
      const airtableApiKey = Deno.env.get('AIRTABLE_API_KEY');
      const airtableBaseId = Deno.env.get('AIRTABLE_BASE_ID');
      const airtableTableName = 'Users';
      
      return new Response(JSON.stringify({
        debug: true,
        config: {
          hasApiKey: !!airtableApiKey,
          apiKeyPrefix: airtableApiKey?.substring(0, 10) || 'MISSING',
          baseId: airtableBaseId || 'MISSING',
          tableName: airtableTableName || 'MISSING',
          testUrl: `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(airtableTableName || 'MISSING')}?maxRecords=1`
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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
    
    // Use the correct table name from the API docs
    const airtableTableName = 'users'; // From the API docs URL: table:users

    console.log('=== AIRTABLE CONNECTION CHECK ===');
    console.log('Airtable config check:', {
      hasApiKey: !!airtableApiKey,
      hasBaseId: !!airtableBaseId,
      hasTableName: !!airtableTableName,
      apiKeyLength: airtableApiKey?.length || 0,
      baseId: airtableBaseId,
      tableName: airtableTableName,
      email: email
    });

    if (!airtableApiKey || !airtableBaseId) {
      console.error('Missing Airtable configuration:', {
        hasApiKey: !!airtableApiKey,
        hasBaseId: !!airtableBaseId
      });
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Airtable credentials' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // First, test basic connection to Airtable base
    const testUrl = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(airtableTableName)}?maxRecords=1`;
    console.log('Testing connection with URL:', testUrl);
    console.log('Request headers:', {
      'Authorization': `Bearer ${airtableApiKey?.substring(0, 10)}...`,
      'Content-Type': 'application/json',
    });
    
    const testResponse = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response details:', {
      ok: testResponse.ok,
      status: testResponse.status,
      statusText: testResponse.statusText,
      headers: Object.fromEntries(testResponse.headers.entries()),
      url: testResponse.url
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('=== CONNECTION TEST FAILED ===');
      console.error('Full error response:', errorText);
      
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
        console.error('Parsed error:', parsedError);
      } catch {
        console.error('Could not parse error as JSON');
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Connection test failed: ${testResponse.status} ${testResponse.statusText}`,
          debug: {
            tableName: airtableTableName,
            baseId: airtableBaseId,
            status: testResponse.status,
            errorBody: errorText,
            actualUrl: testResponse.url
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const testData = await testResponse.json();
    console.log('=== CONNECTION TEST SUCCESS ===');
    console.log('Available fields in table:', testData.records?.[0]?.fields ? Object.keys(testData.records[0].fields) : 'No records found');
    console.log('Record count:', testData.records?.length || 0);

    // Check if email exists in Airtable with required conditions
    // First, let's see all records to understand the structure
    const debugUrl = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(airtableTableName)}?maxRecords=3`;
    console.log('Fetching sample records to see field structure:', debugUrl);
    
    const debugResponse = await fetch(debugUrl, {
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('Sample records from Airtable:', JSON.stringify(debugData, null, 2));
      console.log('Available fields:', debugData.records?.[0]?.fields ? Object.keys(debugData.records[0].fields) : 'No records');
    }
    
    // Try simple filter without complex encoding
    const simpleFilterUrl = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(airtableTableName)}`;
    console.log('Fetching all records to find user manually:', simpleFilterUrl);
    
    const response = await fetch(simpleFilterUrl, {
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
        url: simpleFilterUrl
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
    console.log('All records from Airtable:', JSON.stringify(data, null, 2));
    
    // Find the user record manually in the response
    const userRecord = data.records?.find((record: any) => {
      const recordEmail = record.fields?.Email || record.fields?.email || record.fields?.EMAIL;
      console.log('Checking record email:', recordEmail, 'against:', email);
      return recordEmail === email;
    });
    
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
    
    console.log('Creating Supabase admin client...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Try to get existing user first
    console.log('Checking for existing user...');
    const { data: existingUsers, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('Error listing users:', getUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    let user;
    if (existingUser) {
      console.log('Found existing user:', existingUser.id);
      user = existingUser;
    } else {
      // Create new user
      console.log('Creating new user...');
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
    console.log('Generating session for user...');
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

    console.log('Session generated successfully');

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

    console.log('Authentication successful for user:', email);

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
    console.error('Error in verify-shuffler-user function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});