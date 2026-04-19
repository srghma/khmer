<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { ChevronLeft, Star, Volume2, Share2 } from 'lucide-svelte';
  import * as m from '$paraglide/messages';

  let { word, mode, backButton_goBack, isFav, toggleFav } = $props();

  const langNames = {
    en: m.ANKI_LANGUAGES_ENGLISH(),
    ru: m.ANKI_LANGUAGES_RUSSIAN(),
    km: m.ANKI_LANGUAGES_KHMER()
  };
</script>

<header class="flex items-center gap-4 p-4 border-b border-divider bg-background/80 backdrop-blur-md sticky top-0 z-20 pt-[calc(1rem+env(safe-area-inset-top))]">
  <Button variant="ghost" size="icon" onclick={backButton_goBack} class="md:hidden -ml-2">
    <ChevronLeft class="h-6 w-6" />
  </Button>

  <div class="flex flex-col min-w-0 flex-1">
    <h1 class="text-xl font-bold truncate">{word}</h1>
    <span class="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
      {langNames[mode] || mode}
    </span>
  </div>

  <div class="flex items-center gap-1">
    <Button variant="ghost" size="icon" class="h-9 w-9 text-muted-foreground">
      <Volume2 class="h-5 w-5" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      class="h-9 w-9 {isFav ? 'text-yellow-500' : 'text-muted-foreground'}"
      onclick={toggleFav}
    >
      <Star class="h-5 w-5" fill={isFav ? "currentColor" : "none"} />
    </Button>
    <Button variant="ghost" size="icon" class="h-9 w-9 text-muted-foreground">
      <Share2 class="h-5 w-5" />
    </Button>
  </div>
</header>
