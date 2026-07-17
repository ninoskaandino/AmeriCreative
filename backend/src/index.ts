import app from './app.js';
import { config } from './config.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log('==================================================');
  console.log(` Ameri Creative Studio Server is online!`);
  console.log(` Port: ${PORT}`);
  console.log(` Demo Mode: ${config.demoMode ? 'ENABLED 🟢 (AWS calls simulated)' : 'DISABLED 🔴 (Calls AWS Bedrock directly)'}`);
  console.log(` Region: ${config.awsRegion}`);
  console.log('==================================================');
});
