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
    const { code } = await req.json();
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Access code is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Verifying access code:', code);

    // Get Airtable credentials from environment
    const airtableApiKey = Deno.env.get('AIRTABLE_API_KEY');
    const airtableBaseId = Deno.env.get('AIRTABLE_BASE_ID');
    const airtableTableName = 'users';

    if (!airtableApiKey || !airtableBaseId) {
      console.error('Missing Airtable configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get all records and find user manually (no complex filtering)
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(airtableTableName)}`;
    console.log('Fetching from Airtable:', airtableUrl);
    
    const response = await fetch(airtableUrl, {
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Airtable API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to verify access code' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('Records found:', data.records?.length || 0);
    
    // Find user record by Code field
    const userRecord = data.records?.find((record: any) => {
      const recordCode = record.fields?.Code || record.fields?.code;
      return recordCode === code;
    });
    
    if (!userRecord) {
      console.log('Access code not found in Airtable');
      return new Response(
        JSON.stringify({ error: 'Access code not authorized. Please contact an administrator.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Found user record with fields:', Object.keys(userRecord.fields));

    // Check Status field
    const status = userRecord.fields.Status;
    if (!status || status.toLowerCase() !== 'active') {
      console.log('User status check failed:', status);
      return new Response(
        JSON.stringify({ error: `Access denied. Account status: ${status || 'inactive'}` }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check ExpirationDate if present
    const expirationDate = userRecord.fields.ExpirationDate;
    if (expirationDate) {
      const expDate = new Date(expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expDate < today) {
        console.log('User expiration check failed');
        return new Response(
          JSON.stringify({ error: `Access expired on ${expDate.toLocaleDateString()}` }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    console.log('All Airtable checks passed for code:', code);

    // Get email and full name from user record for Supabase user creation
    const email = userRecord.fields?.Email || userRecord.fields?.email;
    const fullName = userRecord.fields?.FullName || userRecord.fields?.['Full Name'];
    if (!email) {
      console.error('No email field found in user record');
      return new Response(
        JSON.stringify({ error: 'User record missing email information' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get or create user
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let user = existingUsers?.users?.find(u => u.email === email);
    
    if (!user) {
      // Create new user with user ID as password
      const userPassword = 'user-' + Math.random().toString(36).substring(2, 15);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        password: userPassword
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
      
      // Store the password for return
      user.tempPassword = userPassword;
    } else {
      console.log('Found existing user:', user.id);
      // Set a predictable password for existing users
      const userPassword = user.id;
      await supabase.auth.admin.updateUserById(user.id, {
        password: userPassword,
        email_confirm: true
      });
      user.tempPassword = userPassword;
    }

    // Create a regular supabase client (not admin) to sign in
    const regularSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    
    // Sign in as admin, then get the session
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Update user to ensure they can be signed in
    await adminSupabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });

    // Return user info and password for direct sign-in
    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: fullName,
          tempPassword: user.tempPassword // Use the actual temp password
        },
        message: 'Authentication successful - logging you in directly!'
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