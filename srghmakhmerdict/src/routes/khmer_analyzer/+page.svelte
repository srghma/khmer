<script lang="ts">
  import * as m from '$paraglide/messages';
  import { Button } from '$lib/components/ui/button';
  import { ArrowLeft, Send } from 'lucide-svelte';
  import { settings } from '$lib/state/settings.svelte';

  let text = $state('');
  let isAnalyzing = $state(false);

  function handleAnalyze() {
    if (!text.trim()) return;
    isAnalyzing = true;
    // Logic will be ported from useKhmerAnalysis.ts
    setTimeout(() => { isAnalyzing = false; }, 1000);
  }
</script>

<div class="flex flex-col h-full bg-background">
  <div class="flex shrink-0 items-center p-6 pb-4 border-b border-divider pt-[calc(1rem+env(safe-area-inset-top))]">
    <Button variant="ghost" size="icon" class="mr-3 -ml-2" onclick={() => window.history.back()}>
      <ArrowLeft class="h-6 w-6" />
    </Button>
    <h1 class="text-xl font-bold">{m.ANALYZER_TITLE()}</h1>
  </div>

  <div class="flex-1 p-6 space-y-6 overflow-y-auto">
    <div class="space-y-4">
      <textarea
        bind:value={text}
        class="w-full h-40 p-4 rounded-xl border border-divider bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary resize-none font-khmer text-lg"
        placeholder={m.ANALYZER_PLACEHOLDER()}
      ></textarea>

      <Button class="w-full h-12 font-bold" onclick={handleAnalyze} disabled={!text.trim() || isAnalyzing}>
        {#if isAnalyzing}
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
        {:else}
          <Send class="mr-2 h-5 w-5" />
        {/if}
        {m.ANALYZER_SEGMENTATION()}
      </Button>
    </div>

    {#if text && !isAnalyzing}
      <div class="p-6 bg-muted/20 rounded-2xl border border-divider space-y-4">
         <h2 class="text-sm font-bold uppercase tracking-widest text-muted-foreground">
           {m.ANALYZER_SEGMENTATION_LABEL()}
         </h2>
         <div class="flex flex-wrap gap-2 text-2xl font-khmer">
           {text}
         </div>
      </div>
    {/if}
  </div>
</div>
