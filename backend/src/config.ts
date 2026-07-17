import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the parent or current directory
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config(); // Also load local .env if any

export const config = {
  port: process.env.PORT || '5000',
  jwtSecret: process.env.JWT_SECRET || 'amerident-creative-studio-super-secret-key-12345',
  demoMode: process.env.DEMO_MODE !== 'false', // Defaults to true if not explicitly set to 'false'
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  awsSessionToken: process.env.AWS_SESSION_TOKEN || '',
  bedrockTextModel: process.env.BEDROCK_TEXT_MODEL || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  bedrockImageModel: process.env.BEDROCK_IMAGE_MODEL || 'stability.stable-diffusion-xl-v1',
};
