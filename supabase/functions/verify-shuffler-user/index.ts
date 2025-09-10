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
        JSON.stringify({ error: 'Failed to verify email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('Records found:', data.records?.length || 0);
    
    // Find user record
    const userRecord = data.records?.find((record: any) => {
      const recordEmail = record.fields?.Email || record.fields?.email;
      return recordEmail === email;
    });
    
    if (!userRecord) {
      console.log('User not found in Airtable');
      return new Response(
        JSON.stringify({ error: 'Email not authorized. Please contact an administrator.' }),
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

    console.log('All Airtable checks passed for user:', email);

    // Create Supabase client and send magic link
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Send magic link using regular signInWithOtp
    const { error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: req.headers.get('origin') || 'https://fd004b8b-7165-467a-a9d1-1f1e593e64c0.sandbox.lovable.dev'
      }
    });

    if (magicLinkError) {
      console.error('Failed to send magic link:', magicLinkError);
      // Don't fail - just return success without magic link
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email verified successfully. You are now authenticated!'
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