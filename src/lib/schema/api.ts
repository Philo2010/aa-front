import type { CreateClientConfig } from './client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
	...config,
	baseUrl: '/',
});
