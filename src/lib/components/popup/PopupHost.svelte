<script lang="ts">
  import { PopupStore, type PopupData } from '$lib/systems/PopupStore';
  import PopupItem from './PopupItem.svelte';
  import { onDestroy } from 'svelte';

  let popups: PopupData[] = [];
  const unsubscribe = PopupStore.subscribe(value => popups = value);

  onDestroy(() => unsubscribe());
</script>

{#each popups as popup (popup.id)}
  <PopupItem {popup} />
{/each}