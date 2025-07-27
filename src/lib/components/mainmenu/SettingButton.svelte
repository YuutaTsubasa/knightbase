<script>
  const openSettings = () => {
    console.log("開啟設定！");
    // 可以之後觸發 Popup 或切頁
  };
</script>

<button class="settingsButton" aria-label="設定" on:click={openSettings}>
  &#9776;
</button>

<style>
  .settingsButton {
    font-size: 1.5rem;
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    z-index: 10;
  }
</style>