<script lang="ts">
  import { page } from '$app/stores';
  import * as m from '$paraglide/messages';
  import { favorites } from '$lib/state/favorites.svelte';
  import { Button } from '$lib/components/ui/button';

  let langFavorites = $derived(favorites.items.filter(f => f.language === $page.params.lang));
</script>

<div class="flex flex-col items-center justify-center h-full p-8 text-center">
  {#if langFavorites.length > 0}
    <h2 class="text-2xl font-bold mb-4">{m.ANKI_MODES_GUESSING()}</h2>
    <p class="text-muted-foreground mb-8">{langFavorites.length} {m.ANKI_DUE()}</p>
    <Button size="lg" class="w-full max-w-xs font-bold h-14 text-lg">
       {m.ANKI_BUTTONS_SHOW_ANSWER()}
    </Button>
  {:else}
    <div class="text-6xl mb-4">📭</div>
    <h2 class="text-xl font-semibold mb-2">{m.ANKI_NO_FAVORITES()}</h2>
    <p class="text-muted-foreground max-w-xs">{m.ANKI_NO_FAVORITES()}</p>
  {/if}
</div>
