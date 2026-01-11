import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'schima.json', // sign up at app.heyapi.dev
  output: 'src/lib/schema',
  plugins: [{
      name: '@hey-api/client-fetch',
      runtimeConfigPath: './api.ts', 
    },], 
});