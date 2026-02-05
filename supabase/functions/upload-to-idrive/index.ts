import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';

// Supports iDrive E2 and Cloudflare R2 - v5

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface UploadRequest {
  fileName: string;
  fileData: string; // base64 encoded
  bucket: string;
  contentType?: string;
  storage?: 'storage1' | 'storage2' | 'r2';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileName, fileData, bucket, contentType, storage = 'storage1' }: UploadRequest = await req.json();

    let endpoint: string;
    let accessKeyId: string | undefined;
    let secretAccessKey: string | undefined;
    let region: string;
    let publicUrlBase: string;

    console.log('Upload request received:', { storage, bucket, fileName });

    if (storage === 'r2') {
      // Cloudflare R2 configuration
      const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
      accessKeyId = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY');
      secretAccessKey = Deno.env.get('CLOUDFLARE_R2_SECRET_KEY');
      const customPublicUrl = Deno.env.get('CLOUDFLARE_R2_PUBLIC_URL');

      if (!accountId || !accessKeyId || !secretAccessKey) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Cloudflare R2 credentials not configured. Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY, and CLOUDFLARE_R2_SECRET_KEY.',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
      region = 'auto';
      publicUrlBase = customPublicUrl || `https://${bucket}.${accountId}.r2.dev`;
    } else {
      // iDrive E2 configuration
      const rawEndpoint = storage === 'storage1'
        ? Deno.env.get('IDRIVE_E2_STORAGE1_ENDPOINT')
        : Deno.env.get('IDRIVE_E2_STORAGE2_ENDPOINT');

      accessKeyId = storage === 'storage1'
        ? Deno.env.get('IDRIVE_E2_STORAGE1_ACCESS_KEY')
        : Deno.env.get('IDRIVE_E2_STORAGE2_ACCESS_KEY');

      secretAccessKey = storage === 'storage1'
        ? Deno.env.get('IDRIVE_E2_STORAGE1_SECRET_KEY')
        : Deno.env.get('IDRIVE_E2_STORAGE2_SECRET_KEY');

      if (!rawEndpoint || rawEndpoint.toLowerCase().includes('placeholder') || rawEndpoint.length < 10) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'iDrive E2 endpoint not configured correctly.',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      const cleanEndpoint = rawEndpoint.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
      endpoint = `https://${cleanEndpoint}`;
      region = storage === 'storage2' ? 'ap-southeast-1' : 'us-east-1';
      publicUrlBase = `https://${cleanEndpoint}/${bucket}`;
    }

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('Storage credentials not configured.');
    }

    // Create S3 client
    const s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: storage !== 'r2',
    });

    // Decode base64 file data
    const binaryData = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));

    // Upload to storage
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: binaryData,
      ContentType: contentType || 'application/octet-stream',
    });

    await s3Client.send(command);

    const publicUrl = storage === 'r2' 
      ? `${publicUrlBase}/${fileName}`
      : `${publicUrlBase}/${fileName}`;
    
    console.log('Upload successful:', { storage, bucket, fileName, publicUrl });

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
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
