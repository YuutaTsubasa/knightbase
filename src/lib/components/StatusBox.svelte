<script lang="ts">
  import { StatusBoxType } from "$lib/types/StatusBoxType";
  import { CircleCheckBigIcon, CircleXIcon, MessageCircleWarningIcon } from "lucide-svelte";

  export let type: StatusBoxType = StatusBoxType.Default;

  $: color = type === StatusBoxType.Success
    ? '#22c55e' // green-500
    : type === StatusBoxType.Error
    ? '#ef4444' // red-500
    : '#facc15'; // yellow-400
</script>

<div class="statusBox" style="--color: {color}">
  <div class="statusIcon" style="background-color: {color}">
    <div class="pattern"></div>
    <span class="symbol">
      {#if type === StatusBoxType.Default}
        <MessageCircleWarningIcon class="icon" style="color: black; margin: 3px;" size="30"/>
      {/if}
      {#if type === StatusBoxType.Success}
        <CircleCheckBigIcon class="icon" size="30"/>
      {/if}
      {#if type === StatusBoxType.Error}
        <CircleXIcon class="icon" style="margin: 3px" size="30"/>
      {/if}
    </span>
  </div>
  <div class="statusMessage"><slot /></div>
</div>

<style>
  .statusBox {
    display: grid;
    grid-template-columns: 60px 1fr;
    height: 60px;
    background-color: black;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    color: white;
    font-weight: bold;
    width: 100%;
    border: 2px solid var(--color);
  }

  .statusIcon {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pattern {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(0, 0, 0, 0.2) 1px, transparent 1px);
    background-size: 6px 6px;
    opacity: 0.5;
    z-index: 0;
  }

  .symbol {
    font-size: 1.75rem;
    z-index: 1;
  }

  .statusMessage {
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    font-size: 1rem;
    line-height: 1.4;
    position: relative;
    overflow: hidden;
  }

  .statusMessage::before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    inset: 0;
    background-image: linear-gradient(45deg, rgba(255,255,255,0.5) 25%, transparent 25%, transparent 50%, rgba(255,255,255, 0.5) 50%, rgba(255,255,255,0.5) 75%, transparent 75%, transparent);
    background-size: 10px 10px; 
    opacity: 0.15;
    z-index: 0;
  }
</style>