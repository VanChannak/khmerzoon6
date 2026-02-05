import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';

// Force redeploy to pick up latest secrets - v3

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface UploadRequest {
  fileName: string;
  fileData: string; // base64 encoded
  bucket: string;
  contentType?: string;
  storage?: 'storage1' | 'storage2';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileName, fileData, bucket, contentType, storage = 'storage1' }: UploadRequest = await req.json();

    // Get credentials from environment
    const rawEndpoint = storage === 'storage1'
      ? Deno.env.get('IDRIVE_E2_STORAGE1_ENDPOINT')
      : Deno.env.get('IDRIVE_E2_STORAGE2_ENDPOINT');

    // Debug: Log what we received
    console.log('Storage config:', {
      storage,
      rawEndpoint: rawEndpoint ? `${rawEndpoint.substring(0, 10)}...` : 'undefined',
      hasEndpoint: !!rawEndpoint,
      endpointLength: rawEndpoint?.length || 0,
    });

    // Check if endpoint is a placeholder or invalid - case insensitive check
    const lowerEndpoint = rawEndpoint?.toLowerCase() || '';
    if (!rawEndpoint || lowerEndpoint.includes('placeholder') || rawEndpoint.length < 10 || !rawEndpoint.includes('.')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `IDRIVE_E2_STORAGE1_ENDPOINT is invalid. Current value starts with: "${rawEndpoint?.substring(0, 20) || 'EMPTY'}". Please set a valid iDrive E2 endpoint like: s6k7.la12.idrivee2-32.com`,
          debug: {
            hasValue: !!rawEndpoint,
            valueLength: rawEndpoint?.length || 0,
            startsWithPlaceholder: lowerEndpoint.includes('placeholder'),
            firstChars: rawEndpoint?.substring(0, 20) || 'EMPTY',
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const endpoint = rawEndpoint?.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');

    const accessKeyId = storage === 'storage1'
      ? Deno.env.get('IDRIVE_E2_STORAGE1_ACCESS_KEY')
      : Deno.env.get('IDRIVE_E2_STORAGE2_ACCESS_KEY');

    const secretAccessKey = storage === 'storage1'
      ? Deno.env.get('IDRIVE_E2_STORAGE1_SECRET_KEY')
      : Deno.env.get('IDRIVE_E2_STORAGE2_SECRET_KEY');

    // IMPORTANT: hardcode region for storage2 to avoid placeholder/invalid secret values.
    const region = storage === 'storage2' ? 'ap-southeast-1' : 'us-east-1';

    const debug = {
      storage,
      envEndpoint: rawEndpoint ?? null,
      envRegion: Deno.env.get('IDRIVE_E2_STORAGE2_REGION') ?? null,
      usedRegion: region,
    };

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(`Storage credentials not configured. Debug: ${JSON.stringify(debug)}`);
    }

    // Create S3 client
    const s3Client = new S3Client({
      endpoint: `https://${endpoint}`,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });

    // Decode base64 file data
    const binaryData = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));

    // Upload to iDrive E2
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: binaryData,
      ContentType: contentType || 'application/octet-stream',
    });

    await s3Client.send(command);

    const publicUrl = `https://${endpoint}/${bucket}/${fileName}`;
    
    console.log('Upload successful:', { bucket, fileName, publicUrl });

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrl,
        key: fileName,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Upload error:', errorMessage, error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
