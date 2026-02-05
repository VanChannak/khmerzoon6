 import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
 import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 interface UploadRequest {
   fileName: string;
   fileData: string;
   bucket: string;
   contentType?: string;
 }
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const { fileName, fileData, bucket, contentType }: UploadRequest = await req.json();
 
     const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
     const accessKeyId = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY');
     const secretAccessKey = Deno.env.get('CLOUDFLARE_R2_SECRET_KEY');
     const customPublicUrl = Deno.env.get('CLOUDFLARE_R2_PUBLIC_URL');
 
     console.log('R2 Upload request:', { bucket, fileName, hasAccountId: !!accountId });
 
     if (!accountId || !accessKeyId || !secretAccessKey) {
       return new Response(
         JSON.stringify({
           success: false,
           error: 'Cloudflare R2 credentials not configured. Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY, and CLOUDFLARE_R2_SECRET_KEY.',
         }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
       );
     }
 
     const s3Client = new S3Client({
       endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
       region: 'auto',
       credentials: { accessKeyId, secretAccessKey },
     });
 
     const binaryData = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));
 
     await s3Client.send(new PutObjectCommand({
       Bucket: bucket,
       Key: fileName,
       Body: binaryData,
       ContentType: contentType || 'application/octet-stream',
     }));
 
     const publicUrl = customPublicUrl 
       ? `${customPublicUrl}/${fileName}`
       : `https://${bucket}.${accountId}.r2.dev/${fileName}`;
     
     console.log('R2 Upload successful:', { publicUrl });
 
     return new Response(
       JSON.stringify({ success: true, url: publicUrl, key: fileName }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
     );
   } catch (error) {
     const errorMessage = error instanceof Error ? error.message : String(error);
     console.error('R2 Upload error:', errorMessage);
     
     return new Response(
       JSON.stringify({ success: false, error: errorMessage }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
     );
   }
 });