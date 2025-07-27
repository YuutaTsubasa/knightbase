<script lang="ts">
  export let level = 10;
  export let expPercent = 0.65;
  export let name = "悠太翼";
  export let title = "迷途旅人";
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
    position: absolute;
    top: 1rem;
    left: -0.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 2.5rem;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 0.75rem;
    backdrop-filter: blur(6px);
    color: white;
  }

  .expRing {
    width: 60px;
    height: 60px;
  }

  svg {
    width: 150%;
    height: 150%;
    margin-top: -25%;
    margin-left: -25%;
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
    font-size: 1.1rem;
  }

  .title {
    font-size: 0.9rem;
    opacity: 0.8;
  }
</style>
