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

    // Check if email exists in Airtable
    // Try common field names for email
    const emailFields = ['Email', 'email', 'Email Address', 'email_address'];
    let airtableUrl;
    let emailExists = false;
    let foundField = '';
    
    // Try each possible email field name
    for (const fieldName of emailFields) {
      airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(airtableTableName)}?filterByFormula={${fieldName}}="${email}"`;
      
      console.log(`Trying field "${fieldName}" with URL:`, airtableUrl);
      
      const response = await fetch(airtableUrl, {
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Response for field "${fieldName}":`, {
          recordCount: data.records?.length || 0,
          records: data.records?.map(r => Object.keys(r.fields))
        });
        
        if (data.records && data.records.length > 0) {
          emailExists = true;
          foundField = fieldName;
          break;
        }
      } else {
        const errorText = await response.text();
        console.log(`Field "${fieldName}" attempt failed:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        // If it's a 422 error, the field doesn't exist, try next one
        if (response.status === 422) {
          continue;
        }
        
        // For other errors (like 403), log and continue to try other fields
        if (response.status === 403) {
          console.error(`403 error for field "${fieldName}":`, {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
            url: airtableUrl
          });
          continue;
        }
      }
    }
    
    // If none of the field attempts worked, return error with debugging info
    if (!emailExists && !foundField) {
      return new Response(
        JSON.stringify({ 
          error: `Could not verify email. Please check:\n1. Table name is correct (not table ID)\n2. Email field exists\n3. API key has read permissions\n\nTried fields: ${emailFields.join(', ')}\nTable: ${airtableTableName}\nBase: ${airtableBaseId}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Email verification result:', { emailExists, foundField });

    if (emailExists) {
      // Email exists in Airtable, send magic link
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${req.headers.get('origin') || 'http://localhost:5173'}/`,
        },
      });

      if (error) {
        console.error('Supabase auth error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to send magic link' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Magic link sent to your email' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Email not authorized. Please contact an administrator.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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