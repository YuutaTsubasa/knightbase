<script lang="ts">
  export let level;
  export let expPercent;
  export let name;
  export let title;
</script>

<div class="playerInfoBox">
  <div class="expRing">
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" class="bg" />
      <circle
        cx="50"
        cy="50"
        r="45"
        class="fg"
        stroke-dasharray="{Math.PI * 2 * 45}"
        stroke-dashoffset="{(1 - expPercent) * Math.PI * 2 * 45}"
      />
      <text x="50" y="55" text-anchor="middle" class="level">{level}</text>
    </svg>
  </div>

  <div class="infoText">
    <div class="name">{name}</div>
    <div class="title">{title}</div>
  </div>
</div>

<style>
  .playerInfoBox {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 2.5rem;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 0.75rem;
    backdrop-filter: blur(6px);
    color: white;
    height: 8vh;
  }

  .expRing {
    aspect-ratio: 1 / 1;
    min-height: 130%;
  }

  svg {
    aspect-ratio: 1 / 1;
    height: 130%;
    margin-left: -15%;
    margin-top: -15%;
  }

  circle.bg {
    fill: none;
    stroke: #444;
    stroke-width: 8;
  }

  circle.fg {
    fill: none;
    stroke: #6c95ff;
    stroke-width: 8;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
    transition: stroke-dashoffset 0.5s ease;
  }

  text.level {
    fill: white;
    font-size: 2.5rem;
    font-weight: bold;
    dominant-baseline: middle;
  }

  .infoText {
    display: flex;
    flex-direction: column;
    margin-left: 1rem;
  }

  .name {
    font-weight: bold;
    font-size: min(6vw, 5vh, 1.3rem);
  }

  .title {
    font-size: min(3.6vw, 3vh, 0.78rem);
    opacity: 0.8;
  }
</style>
