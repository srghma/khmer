<script lang="ts">
  import { page } from '$app/stores';
  import DetailView from '$lib/components/DetailView/DetailView.svelte';
  import { goto } from '$app/navigation';

  function handleBack() {
    goto(`/${$page.params.lang}`);
  }
</script>

<DetailView
  word={$page.params.word}
  mode={$page.params.lang}
  backButton_goBack={handleBack}
/>
