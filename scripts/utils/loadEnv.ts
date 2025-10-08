import { config } from 'dotenv';
import { resolve } from 'path';

const envFiles = ['.env.local', '.env'];

for (const file of envFiles) {
  config({
    path: resolve(process.cwd(), file),
    override: false
  });
}

