<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";
  import Preview from "$lib/components/Preview.svelte";
  import { ArrowLeft, ArrowRight, Check, X } from "lucide-svelte";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { welcomeTourData as tourSteps } from "$lib/data/welcome-tour";

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
    {tourSteps[currentStep].title}
  {/snippet}

  <div class="relative overflow-hidden transition-[height] duration-300" style="height: {height}px">
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
  </div>

  {#snippet footer()}
    <div class="flex w-full items-center justify-between">
      <div>
        {#if currentStep > 0}
          <button onclick={prevStep} class="btn"><ArrowLeft size={16} /> Back</button>
        {:else}
          <button onclick={finish} class="btn"><X size={16} /> Close Tour</button>
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
              aria-label="Go to step {i + 1}"
            ></button>
          {/each}
        </div>

        {#if currentStep < tourSteps.length - 1}
          <button onclick={nextStep} class="btn btn-primary">Next <ArrowRight size={16} /></button>
        {:else}
          <button onclick={finish} class="btn btn-primary">Finish <Check size={16} /></button>
        {/if}
      </div>
    </div>
  {/snippet}
</Modal>
