import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config.js';
import fs from 'fs';
import path from 'path';

let bedrockClient: BedrockRuntimeClient | null = null;

if (!config.demoMode) {
  try {
    const credentials: any = {
      accessKeyId: config.awsAccessKeyId,
      secretAccessKey: config.awsSecretAccessKey,
    };
    if (config.awsSessionToken) {
      credentials.sessionToken = config.awsSessionToken;
    }
    bedrockClient = new BedrockRuntimeClient({
      region: config.awsRegion,
      credentials,
    });
  } catch (err) {
    console.error('Failed to initialize AWS Bedrock Image client. Falling back to Demo Mode.', err);
    config.demoMode = true;
  }
}

// -------------------------------------------------------------
// DEMO MODE - CURATED DENTAL PUBLIC IMAGE STOCK
// -------------------------------------------------------------
interface StockImage {
  url: string;
  tags: string[];
}

const dentalStockImages: StockImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=80',
    tags: ['general', 'limpieza', 'adultos', 'dentista', 'consultorio']
  },
  {
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80',
    tags: ['premium', 'estética', 'blanqueamiento', 'tecnología', 'consultorio']
  },
  {
    url: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&auto=format&fit=crop&q=80',
    tags: ['ortodoncia', 'alineadores', 'invisibles', 'jóvenes', 'sonrisa']
  },
  {
    url: 'https://images.unsplash.com/photo-1484665754804-74b091211472?w=800&auto=format&fit=crop&q=80',
    tags: ['general', 'familiar', 'familia', 'limpieza', 'sonrisa']
  },
  {
    url: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=800&auto=format&fit=crop&q=80',
    tags: ['odontopediatría', 'niños', 'prevención', 'niño', 'divertido']
  },
  {
    url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=80',
    tags: ['odontopediatría', 'niños', 'padres', 'sonrisa']
  },
  {
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80',
    tags: ['general', 'corporativo', 'dentista', 'profesional', 'mujer']
  },
  {
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80',
    tags: ['general', 'corporativo', 'dentista', 'profesional', 'hombre']
  },
  {
    url: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=800&auto=format&fit=crop&q=80',
    tags: ['implantes', 'implantología', 'cirugía', 'tecnología']
  },
  {
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    tags: ['corporativo', 'turismo', 'adultez', 'premium']
  }
];

function getSimulatedImageUrl(specialty: string, audience: string, style: string): string {
  const spec = specialty.toLowerCase();
  const aud = audience.toLowerCase();
  const st = style.toLowerCase();

  // Find matching stock images by tags
  let matches = dentalStockImages.filter(img => {
    return img.tags.some(tag => spec.includes(tag) || aud.includes(tag) || st.includes(tag));
  });

  if (matches.length === 0) {
    matches = dentalStockImages; // Default to all if no matches
  }

  // Choose a random match
  const randomIndex = Math.floor(Math.random() * matches.length);
  return matches[randomIndex].url;
}

// -------------------------------------------------------------
// EXPORTS
// -------------------------------------------------------------
export const bedrockImageService = {
  /**
   * Generates base64 / URL of image using Stable Diffusion or local simulated images
   */
  async generateImage(params: {
    prompt: string;
    negativePrompt?: string;
    specialty: string;
    audience: string;
    style: string;
    format: string;
  }): Promise<string> {
    if (config.demoMode || !bedrockClient) {
      // Simulate rendering latency
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getSimulatedImageUrl(params.specialty, params.audience, params.style);
    }

    try {
      console.log(`[Bedrock Image] Invoking image model: "${config.bedrockImageModel}" with prompt: "${params.prompt}"`);
      // Convert standard format options to aspect ratios / resolution divisible by 16
      let width = 512;
      let height = 512;
      
      const fmt = params.format.toLowerCase();
      if (fmt.includes('1:1')) {
        width = 512; height = 512;
      } else if (fmt.includes('4:5') || fmt.includes('vertical')) {
        width = 512; height = 640;
      } else if (fmt.includes('9:16') || fmt.includes('historia')) {
        width = 384; height = 672; // 672 is divisible by 16 (42 * 16)
      } else if (fmt.includes('banner') || fmt.includes('16:9') || fmt.includes('pantalla')) {
        width = 768; height = 432;
      }

      const isNova = config.bedrockImageModel.includes('nova-canvas');
      const isSD3 = config.bedrockImageModel.includes('sd3');
      let payload;

      if (isNova) {
        payload = {
          taskType: 'TEXT_IMAGE',
          textToImageParams: {
            text: params.prompt,
            negativeText: params.negativePrompt || 'disfigured, clinics graphics, blood, surgical tools, decay, ugly teeth'
          },
          imageGenerationConfig: {
            numberOfImages: 1,
            quality: 'standard',
            height: height,
            width: width,
            cfgScale: 8.0
          }
        };
      } else if (isSD3) {
        let aspect = '1:1';
        if (fmt.includes('1:1')) aspect = '1:1';
        else if (fmt.includes('4:5') || fmt.includes('vertical')) aspect = '4:5';
        else if (fmt.includes('9:16') || fmt.includes('historia')) aspect = '9:16';
        else if (fmt.includes('banner') || fmt.includes('16:9') || fmt.includes('pantalla')) aspect = '16:9';

        payload = {
          prompt: params.prompt,
          negative_prompt: params.negativePrompt || 'disfigured, clinics graphics, blood, surgical tools, decay, ugly teeth',
          mode: 'text-to-image',
          aspect_ratio: aspect,
          output_format: 'jpeg'
        };
      } else {
        // Build payload for Stable Diffusion XL v1
        payload = {
          text_prompts: [
            { text: params.prompt, weight: 1.0 },
            { text: params.negativePrompt || 'disfigured, clinics graphics, blood, surgical tools, decay, ugly teeth', weight: -1.0 }
          ],
          cfg_scale: 7.5,
          steps: 40,
          width: width,
          height: height,
          style_preset: 'photographic'
        };
      }

      const command = new InvokeModelCommand({
        modelId: config.bedrockImageModel,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      if (isNova) {
        if (responseBody.images?.[0]) {
          return `data:image/png;base64,${responseBody.images[0]}`;
        }
      } else if (isSD3) {
        if (responseBody.images?.[0]) {
          return `data:image/jpeg;base64,${responseBody.images[0]}`;
        }
      } else {
        if (responseBody.result === 'success' && responseBody.artifacts?.[0]?.base64) {
          const base64Data = responseBody.artifacts[0].base64;
          return `data:image/png;base64,${base64Data}`;
        } else if (responseBody.artifacts?.[0]?.base64) {
          // SDXL direct return
          return `data:image/png;base64,${responseBody.artifacts[0].base64}`;
        }
      }

      throw new Error('Invalid format returned from Bedrock Image Model');
    } catch (err) {
      console.error('Error in Bedrock Image Generation, falling back to stock mock.', err);
      return getSimulatedImageUrl(params.specialty, params.audience, params.style);
    }
  }
};
