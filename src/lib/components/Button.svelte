<script lang="ts">
  export let label: string = '';
  export let variant: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' = 'primary';
  export let disabled: boolean = false;
  export let className: string = '';
  export let onClick: () => void;
</script>

<button
  class={`baseButton ${variant} ${className}`}
  on:click={onClick}
  disabled={disabled}
>
  <slot>{label}</slot>
</button>

<style>
  .baseButton {
    padding: 0.5rem 1.25rem;
    font-size: 1rem;
    border-radius: 0.5rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-family: inherit;
  }

  .baseButton.primary {
    background-color: #2563eb;
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

  .baseButton:hover:not(:disabled) {
    filter: brightness(1.05);
  }
</style>