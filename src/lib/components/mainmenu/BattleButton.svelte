<script lang="ts">
  export let progressText = "目前進度：主線第 3 章";
  export let onBattle = () => {};
  export let onMission = () => {};
  export let onShop = () => {};
  export let onSettings = () => {};
</script>

<div class="battleButtonArea">
  <button class="battleButton" on:click={onBattle}>
    <div class="label">出戰</div>
    <div class="marquee">
        <div class="marqueeInner">
        {progressText}　{progressText}　{progressText}
        </div>
    </div>
  </button>

  <div class="bottomButtons">
    <button class="smallButton" on:click={onMission}>任務</button>
    <button class="smallButton" on:click={onShop}>商店</button>
  </div>

  <div class="bottomButtons">
    <button class="smallButton" on:click={onSettings}>設定</button>
  </div>
</div>

<style>
  .battleButtonArea {
    transform: perspective(800px) rotateY(-25deg);
    position: absolute;
    right: 2rem;
    bottom: 2rem;
    width: 220px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .battleButton {
    all: unset;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    color: white;
    border-radius: 0.75rem;
    border: 1px solid white;
    box-shadow: 0 0.4rem 1rem rgba(0, 0, 0, 0.8);
    box-sizing: border-box;
    padding: 1rem 1.5rem;
    width: 100%;
    transition: transform 0.2s ease;
    cursor: pointer;
  }

  .battleButton:hover {
    transform: translateY(-2px);
    background-color: yellow;
    color: black;
    box-shadow: 0 0.6rem 1.5rem rgba(0, 0, 0, 1);
  }
  
  .label {
    font-size: 1.8rem;
    font-weight: bold;
    text-align: left;
    margin-bottom: 0.5rem;
  }

  .marquee {
    overflow: hidden;
    height: 1.2rem;
    position: relative;
  }

  .marqueeInner {
    white-space: nowrap;
    animation: scrollLeft 5s linear infinite;
    font-size: 0.9rem;
    opacity: 0.8;
  }

  @keyframes scrollLeft {
    0% { transform: translateX(0); }
    100% { transform: translateX(-150%); }
  }

  .bottomButtons {
    display: flex;
    justify-content: space-between;
    width: 100%;
    gap: 10px;
  }

  .smallButton {
    flex: 1;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    color: white;
    font-weight: bold;
    border: 1px solid white;
    border-radius: 0.5rem;
    box-sizing: border-box;
    padding: 0.6rem 0.5rem;
    box-shadow: 0 0.2rem 0.5rem rgba(0, 0, 0, 0.7);
    transition: transform 0.1s ease;
    cursor: pointer;
    text-align: left;
  }

  .smallButton:hover {
    transform: translateY(-2px);
    background: yellow;
    color: black;
  }
</style>