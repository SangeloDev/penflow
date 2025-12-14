<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";
  import Preview from "$lib/components/Preview.svelte";
  import { ArrowLeft, ArrowRight, Check, X } from "lucide-svelte";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { getWelcomeTourData, type TourStep } from "$lib/data/welcome-tour";
  import { m } from "$paraglide/messages.js";
  import { onMount } from "svelte";

  let {
    show = $bindable(),
    onclose,
    ...props
  } = $props<{
    show: boolean;
    onclose: () => void;
  }>();

  let modalComponent: Modal;

  let currentStep = $state(0);
  let direction = $state(1);

  let height = $state(0);

  // Reactive tour steps and translations - initialize with empty array for SSR
  let tourSteps = $state<TourStep[]>([]);
  let buttonBack = $state(m.welcome_tour_button_back());
  let buttonCloseTour = $state(m.welcome_tour_button_closeTour());
  let buttonNext = $state(m.welcome_tour_button_next());
  let buttonFinish = $state(m.welcome_tour_button_finish());
  let isLoading = $state(true);

  // Load tour data on mount and when language changes
  async function loadTourData() {
    isLoading = true;
    try {
      tourSteps = await getWelcomeTourData();
      buttonBack = m.welcome_tour_button_back();
      buttonCloseTour = m.welcome_tour_button_closeTour();
      buttonNext = m.welcome_tour_button_next();
      buttonFinish = m.welcome_tour_button_finish();
    } catch (error) {
      console.error("Failed to load welcome tour data:", error);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadTourData();
  });

  // Update translations reactively when language changes
  $effect(() => {
    // Trigger reload when language changes
    loadTourData();
  });

  function measureHeight(node: HTMLElement) {
    const resizeObserver = new ResizeObserver(() => {
      height = node.offsetHeight;
    });

    resizeObserver.observe(node);

    return {
      destroy() {
        resizeObserver.disconnect();
      },
    };
  }

  function go(step: number) {
    direction = step > currentStep ? 1 : -1;
    currentStep = step;
  }

  function nextStep() {
    if (currentStep < tourSteps.length - 1) {
      go(currentStep + 1);
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      go(currentStep - 1);
    }
  }

  function finish() {
    modalComponent.close();
  }
</script>

<Modal
  bind:this={modalComponent}
  bind:show
  {onclose}
  closeButton={false}
  closable={false}
  className="w-full max-w-xl"
  {...props}
>
  {#snippet header()}
    {#if !isLoading && tourSteps.length > 0}
      {tourSteps[currentStep].title}
    {:else}
      Loading...
    {/if}
  {/snippet}

  <div class="relative overflow-hidden transition-[height] duration-300" style="height: {height}px">
    {#if !isLoading && tourSteps.length > 0}
      {#key currentStep}
        <div
          use:measureHeight
          class="absolute"
          in:fly={{ x: direction * 800, duration: 400, easing: cubicOut }}
          out:fly={{ x: -direction * 800, duration: 400, easing: cubicOut }}
        >
          <Preview content={tourSteps[currentStep].content} onContentChange={() => {}} />
        </div>
      {/key}
    {:else}
      <div use:measureHeight class="text-base-content/60 p-4 text-center">Loading tour content...</div>
    {/if}
  </div>

  {#snippet footer()}
    {#if !isLoading && tourSteps.length > 0}
      <div class="flex w-full items-center justify-between">
        <div>
          {#if currentStep > 0}
            <button onclick={prevStep} class="btn"><ArrowLeft size={16} /> {buttonBack}</button>
          {:else}
            <button onclick={finish} class="btn"><X size={16} /> {buttonCloseTour}</button>
          {/if}
        </div>
        <div class="flex items-center gap-4">
          <!-- Dots for steps -->
          <div class="flex gap-2">
            {#each tourSteps as _, i (i)}
              <button
                class="h-2 w-2 rounded-full transition-colors {currentStep === i
                  ? 'bg-primary'
                  : 'bg-base-300 hover:bg-base-400'}"
                onclick={() => go(i)}
                aria-label={m.welcome_tour_aria_goToStep({ step: (i + 1).toString() })}
              ></button>
            {/each}
          </div>

          {#if currentStep < tourSteps.length - 1}
            <button onclick={nextStep} class="btn btn-primary">{buttonNext} <ArrowRight size={16} /></button>
          {:else}
            <button onclick={finish} class="btn btn-primary">{buttonFinish} <Check size={16} /></button>
          {/if}
        </div>
      </div>
    {/if}
  {/snippet}
</Modal>
