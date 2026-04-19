<script lang="ts">
  import { page } from '$app/stores';
  import SidebarHeader from '$lib/components/Sidebar/SidebarHeader.svelte';
  import SidebarContent from '$lib/components/Sidebar/SidebarContent.svelte';
  import { search } from '$lib/state/search.svelte';
  import { onMount } from 'svelte';

  let { children } = $props();

  $effect(() => {
    if ($page.params.lang) {
      search.activeTab = $page.params.lang as any;
    }
  });
</script>

<div class="flex h-screen w-screen bg-content1 overflow-hidden font-inter text-foreground">
  <!-- Sidebar -->
  <div class="flex flex-col bg-background border-r border-divider z-10 shadow-medium shrink-0 transition-all md:w-[25rem] lg:w-[28rem] max-md:max-w-full md:max-w-[40vw] pt-[env(safe-area-inset-top)] text-base {$page.params.word ? 'hidden md:flex' : 'w-full'}">
    <SidebarHeader activeTab={$page.params.lang} />
    <div class="flex-1 flex overflow-hidden relative bg-content1">
       <SidebarContent />
    </div>
  </div>

  <!-- Detail Area -->
  <div class="flex-1 overflow-hidden h-[100dvh] bg-background">
    {@render children()}
  </div>
</div>
