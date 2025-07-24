<script lang="ts">
  import Page from '$lib/components/Page.svelte';
  import { goto } from '$app/navigation';

  // 模擬資源初始化完成後跳轉
  setTimeout(() => {
    goto('/main'); // 導向正式主選單頁面
  }, 2000);
</script>

<Page>
  <h1>🛡️ KnightBase</h1>
  <p>Loading...</p>
</Page>