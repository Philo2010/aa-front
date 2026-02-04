import { z } from 'zod';

export type ApiResult<T, E> =
	| { type: 'success'; data: T }
	| { type: 'api_error'; error: E }
	| { type: 'validation_error'; error: z.ZodError }
	| { type: 'network_error'; error: Error };

export async function sendApiRefPost<
	S extends z.ZodTypeAny,
	F extends z.ZodTypeAny,
>(
	successSchema: S,
	failSchema: F,
	send: unknown,
	path: string,
): Promise<ApiResult<z.infer<S>, z.infer<F>>> {
	try {
		const res = await fetch(path, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(send),
		});

		let data: unknown;
		try {
			data = await res.json();
		} catch (err) {
			return { type: 'validation_error', error: err as z.ZodError };
		}

		if (res.ok) {
			const parsed = successSchema.safeParse(data);
			if (!parsed.success) {
				return { type: 'validation_error', error: parsed.error };
			}
			return { type: 'success', data: parsed.data };
		} else {
			const parsed = failSchema.safeParse(data);
			if (!parsed.success) {
				return { type: 'validation_error', error: parsed.error };
			}
			return { type: 'api_error', error: parsed.data };
		}
	} catch (err) {
		return { type: 'network_error', error: err as Error };
	}
}
