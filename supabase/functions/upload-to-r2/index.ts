 import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
 import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 interface UploadRequest {
   fileName: string;
   fileData: string; // base64 encoded
   bucket: string;
   contentType?: string;
 }
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const { fileName, fileData, bucket, contentType }: UploadRequest = await req.json();
 
     // Get R2 credentials from environment
     const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
     const accessKeyId = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY');
     const secretAccessKey = Deno.env.get('CLOUDFLARE_R2_SECRET_KEY');
     const publicUrl = Deno.env.get('CLOUDFLARE_R2_PUBLIC_URL'); // Your R2 public bucket URL
 
     // Validate credentials
     if (!accountId || !accessKeyId || !secretAccessKey) {
       return new Response(
         JSON.stringify({
           success: false,
           error: 'Cloudflare R2 credentials not configured. Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY, and CLOUDFLARE_R2_SECRET_KEY in your secrets.',
         }),
         {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           status: 400,
         }
       );
     }
 
     // R2 endpoint format
     const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
 
     // Create S3-compatible client for R2
     const s3Client = new S3Client({
       endpoint,
       region: 'auto',
       credentials: {
         accessKeyId,
         secretAccessKey,
       },
     });
 
     // Decode base64 file data
     const binaryData = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));
 
     // Upload to R2
     const command = new PutObjectCommand({
       Bucket: bucket,
       Key: fileName,
       Body: binaryData,
       ContentType: contentType || 'application/octet-stream',
     });
 
     await s3Client.send(command);
 
     // Construct public URL
     const fileUrl = publicUrl 
       ? `${publicUrl}/${fileName}`
       : `https://${bucket}.${accountId}.r2.dev/${fileName}`;
     
     console.log('R2 Upload successful:', { bucket, fileName, fileUrl });
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         url: fileUrl,
         key: fileName,
       }),
       { 
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 200,
       }
     );
   } catch (error) {
     const errorMessage = error instanceof Error ? error.message : String(error);
     console.error('R2 Upload error:', errorMessage, error);
     
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