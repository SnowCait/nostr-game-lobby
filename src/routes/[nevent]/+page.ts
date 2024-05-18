import { error } from '@sveltejs/kit';
import { nip19 } from 'nostr-tools';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	try {
		const { type, data } = nip19.decode(params.nevent);
		if (type !== 'nevent') {
			throw new Error(`Type[${type}] is not nevent.`);
		}
		return data;
	} catch (e) {
		error(404);
	}
};
