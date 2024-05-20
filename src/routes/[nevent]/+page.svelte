<script lang="ts">
	import { onMount } from 'svelte';
	import {
		createRxNostr,
		createRxForwardReq,
		createRxBackwardReq,
		latestEach,
		uniq
	} from 'rx-nostr';
	import { filter, tap } from 'rxjs';
	import type { Event } from 'nostr-typedef';
	import type { PageData } from './$types';
	import { chunk, random } from '$lib/array';
	import { defaultRelays } from '$lib/config';
	import { Metadata, alternativeName, robohash } from '$lib/metadata';

	export let data: PageData;

	let room: Event | undefined;
	let capacity = 4;
	let pubkeys = new Set<string>();
	let metadataMap = new Map<string, Metadata>();

	const r = Math.random();

	const rxNostr = createRxNostr();
	const rxReq = createRxForwardReq();
	const roomReq = createRxBackwardReq();
	const metadataReq = createRxBackwardReq();

	rxNostr.setDefaultRelays(
		data.relays !== undefined && data.relays.length > 0 ? data.relays : defaultRelays
	);
	rxNostr
		.use(roomReq)
		.pipe(uniq())
		.subscribe(({ event }) => {
			console.debug('[room]', event);
			room = event;
			join(event.pubkey);
		});
	rxNostr
		.use(metadataReq)
		.pipe(
			uniq(),
			latestEach(({ event }) => event.pubkey)
		)
		.subscribe(({ event }) => {
			console.debug('[metadata]', event);
			const cache = metadataMap.get(event.pubkey);
			if (cache === undefined || cache.event.created_at < event.created_at) {
				metadataMap.set(event.pubkey, new Metadata(event));
				metadataMap = metadataMap;
			}
		});
	rxNostr
		.use(rxReq)
		.pipe(
			uniq(),
			filter(({ event }) => !event.content.includes('https://'))
		)
		.subscribe(({ event }) => {
			console.debug('[join]', r, event);
			join(event.pubkey);
		});

	onMount(() => {
		roomReq.emit([{ ids: [data.id] }]);
		rxReq.emit([{ kinds: [1], '#e': [data.id] }]);
	});

	function join(pubkey: string): void {
		fetchMetadata(pubkey);
		pubkeys.add(pubkey);
		pubkeys = pubkeys;
	}

	function fetchMetadata(pubkey: string): void {
		if (metadataMap.has(pubkey)) {
			return;
		}
		metadataReq.emit([{ kinds: [0], authors: [pubkey], limit: 1 }]);
	}
</script>

<p>{room?.content ?? 'room'}</p>

<input type="number" bind:value={capacity} />人

{#each chunk(random([...pubkeys]), capacity) as groupedPubkeys}
	<ul>
		{#each groupedPubkeys as pubkey}
			{@const metadata = metadataMap.get(pubkey)}
			<li>
				{#if metadata}
					<img src={metadata.picture} alt={metadata.name} title={metadata.name} />
				{:else}
					<img
						src={robohash(pubkey)}
						alt={alternativeName(pubkey)}
						title={alternativeName(pubkey)}
					/>
				{/if}
			</li>
		{/each}
	</ul>
{/each}

<style>
	input {
		width: 3rem;
	}

	ul {
		list-style: none;
		padding: 0;
		display: flex;
		justify-content: center;
	}

	img {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
	}
</style>
