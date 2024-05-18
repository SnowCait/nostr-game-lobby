import { nip19 } from 'nostr-tools';
import type { Event } from 'nostr-typedef';

type MetadataContent = { name?: string; display_name?: string; picture?: string };

export class Metadata {
	readonly #content?: MetadataContent;

	constructor(public readonly event: Event) {
		try {
			this.#content = JSON.parse(event.content);
		} catch (error) {
			console.warn('[metadata parse error]', event);
		}
	}

	get picture(): string {
		return this.#content?.picture ? this.#content.picture : robohash(this.event.pubkey);
	}

	get name(): string {
		return this.#content?.display_name
			? this.#content.display_name
			: this.#content?.name
				? this.#content.name
				: alternativeName(this.event.pubkey);
	}
}

export function alternativeName(pubkey: string): string {
    return nip19.npubEncode(pubkey).substring(0, 'npub1'.length + 7)
}

export function robohash(pubkey: string): string {
	return `https://robohash.org/${nip19.npubEncode(pubkey)}?set=set4`;
}
