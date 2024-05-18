<script lang="ts">
	import { goto } from '$app/navigation';

	let nevent = '';

	async function navigate(): Promise<void> {
		await goto(`/${nevent}`);
	}
</script>

<h1>Nostr Game Lobby</h1>

<form on:submit|preventDefault={navigate}>
	<input type="text" bind:value={nevent} placeholder="nevent1..." />
	<input type="submit" value="Goto lobby" />
</form>
