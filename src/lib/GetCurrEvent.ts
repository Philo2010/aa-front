export async function get_event(): Promise<string> {
	const responce = await fetch('/api/get_event');
	if (!responce.ok) {
		throw new Error(
			`Request failed with status ${responce.status}: ${responce.statusText}`,
		);
	}

	const text = await responce.json();
	const event = text.message;

	return event;
}
