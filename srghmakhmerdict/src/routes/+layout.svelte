<script lang="ts">
  import '../App.css';
  import { settings } from '$lib/state/settings.svelte';
  import { dictionary } from '$lib/state/dictionary.svelte';
  import * as m from '$paraglide/messages';
  import { browser } from '$app/environment';

  let { children } = $props();

  $effect(() => {
    if (browser) {
      document.documentElement.classList.toggle('dark', settings.maybeColorMode.value === 'dark');
      document.documentElement.style.setProperty('--app-ui-scale', (settings.scaling_ui.value / 100).toFixed(3));
      document.documentElement.style.setProperty('--app-details-scale', (settings.scaling_details.value / 100).toFixed(3));
    }
  });
</script>

{#if dictionary.loading}
  <div class="flex flex-col items-center justify-center h-screen bg-content1 text-foreground">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
    <h2 class="text-xl font-semibold">{m.SIDEBAR_LOADING_DICT()}</h2>
  </div>
{:else if dictionary.error}
  <div class="flex flex-col items-center justify-center h-screen p-5 text-center font-sans">
    <h1 class="text-red-500 mb-4 text-2xl font-bold">❌ Failed to Initialize</h1>
    <p class="text-gray-500 max-w-lg mb-6">{dictionary.error}</p>
    <button
      class="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      onclick={() => window.location.reload()}
    >
      Retry
    </button>
  </div>
{:else}
  <div class="h-screen w-screen overflow-hidden bg-background">
    {@render children()}
  </div>
{/if}
