<script lang="ts">
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { AudioManager } from "$lib/systems/AudioManager";
  import { ButtonVariant } from "$lib/utils/Constant";
  import { match } from "$lib/utils/Ｍatcher";

  export let label: string = '';
  export let variant: ButtonVariant = ButtonVariant.Default;
  export let disabled: boolean = false;
  export let className: string = '';
  export let onClick: () => void;
</script>

<button
  class={`baseButton ${ButtonVariant[variant].toLowerCase()} ${className}`}
  style="background-image: url({imageAssets["backgroundWhiteButton"]});"
  on:click={() => {
    AudioManager.play(match<ButtonVariant, string>(variant)
      .whenEquals(ButtonVariant.Default, () => "sfx_confirm")
      .otherwise(() => "sfx_confirm"));
    onClick?.();
  }}
  disabled={disabled}
>
  <span><slot>{label}</slot></span>
</button>

<style>
  .baseButton {
    position: relative;
    padding: 0.2rem 2.5rem;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-family: inherit;
    background-size: cover;
    background-position: 50% 15%;
    overflow: hidden;
    z-index: 0;
  }

  .baseButton span {
    position: relative;
    z-index: 2;
  }

  .baseButton::before {
    content: "";
    position: absolute;
    inset: 0;
    background-color: var(--btn-color, white);
    mix-blend-mode: multiply;
    opacity: 1;
    z-index: 1;
  }

  .baseButton.default {
    --btn-color: #0000ff;
    color: white;
  }

  .baseButton.secondary {
    background-color: #e2e8f0;
    color: #1e293b;
  }

  .baseButton.danger {
    background-color: #ef4444;
    color: white;
  }

  .baseButton.outline {
    background-color: transparent;
    border: 2px solid #94a3b8;
    color: #1e293b;
  }

  .baseButton.ghost {
    background-color: transparent;
    color: #64748b;
  }

  .baseButton:disabled {
    background-color: #cbd5e1;
    color: #64748b;
    cursor: not-allowed;
  }

  .baseButton:hover:not(:disabled),
  .baseButton:active:not(:disabled) {
    filter: invert(1) brightness(1.5);
  }
</style>