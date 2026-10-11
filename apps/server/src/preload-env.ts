import { config as loadEnv } from 'dotenv';
import { getEnvFilePaths } from './config/env-files';

// ObserveModule.forRoot reads process.env when AppModule is evaluated.
for (const envFilePath of getEnvFilePaths()) {
  loadEnv({ path: envFilePath });
}
