<!-- components/ui/ResourceBar.svelte -->
<script lang="ts">
  import Image from "../Image.svelte";

  export let resources: {
    key: string;
    amount: string;
    onAdd?: () => void;
  }[] = [];
</script>

<div class="resourceBar">
  {#each resources as resource}
    <div class="resourceItem">
      <div class="resourceBackground"></div>
      <Image className="icon" key={resource.key} />
      <div class="amount">{resource.amount}</div>
      {#if resource.onAdd}
        <button class="add" on:click={resource.onAdd}>+</button>
      {/if}
    </div>
  {/each}
</div>

<style>
  .resourceBar {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
  }

  .resourceItem {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    background: rgba(0, 0, 0, 0.4);
    padding: 0.1rem 0rem 0.1rem 0rem;
    max-height: 1rem;
    overflow-y: visible;
  }

  .resourceItem :global(.icon) {
    width: 1.3rem;
    height: 1.3rem;
  }

  .amount {
    color: white;
    font-weight: bold;
    font-size: 0.9rem;
    padding-right: 1rem;
  }

  .add {
    all: unset;
    cursor: pointer;
    color: white;
    background-color: rgba(255, 255, 255, 0.2);
    font-weight: bold;
    font-size: 1.2rem;
    line-height: 1;
    padding-left: 0.2rem;
    padding-right: 0.2rem;
    display: flex;
  }

  .add:hover {
    color: #aaf;
  }
</style>