<!-- components/ui/ResourceBar.svelte -->
<script lang="ts">
  import { PlusIcon } from "lucide-svelte";
  import Image from "../Image.svelte";
 
  export let resources: {
    key: any;
    amount: string;
    color?: string;
    onAdd?: () => void;
  }[] = [];
</script>

<div class="resourceBar">
  {#each resources as resource}
    <div class="resourceItem">
      <div class="resourceBackground"></div>
      {#if typeof(resource.key) === "string"}
        <Image key={resource.key} alt="Resource Icon" className="icon" style={`color: ${resource.color ? resource.color : 'inherit'}`} />
      {:else}
        <svelte:component this={resource.key} class="icon" color={resource.color ? resource.color : 'white'} />
      {/if}
      <div class="amount">{resource.amount}</div>
      {#if resource.onAdd}
        <button class="add" on:click={resource.onAdd}><PlusIcon class="icon"/></button>
      {/if}
    </div>
  {/each}
</div>

<style>
  .resourceBar {
    display: flex;
    flex-direction: column;
    gap: 1.5vh;
  }

  @media (aspect-ratio > 1.4) {
    .resourceBar {
      flex-direction: row;
      gap: 2vh
    }
  }

  .resourceItem {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    background: rgba(0, 0, 0, 0.4);
    padding: 0.1rem 0rem 0.1rem 0rem;
    overflow-y: visible;
    width: 23vh;
    max-height: 2.5vh;
  }

  .resourceItem :global(.icon) {
    width: 3.5vh;
    height: 3.5vh;
    margin-right: 0.1rem;
  }

  .amount {
    color: white;
    font-weight: bold;
    font-size: 2vh;
    letter-spacing: 0.02rem;
    padding-right: 1rem;
  }

  .add {
    all: unset;
    position: absolute;
    right: 0;
    cursor: pointer;
    color: white;
    background-color: rgba(255, 255, 255, 0.2);
    font-weight: bold;
    line-height: 1;
    padding-left: 0.2rem;
    padding-right: 0.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .add:hover {
    color: #aaf;
  }
</style>