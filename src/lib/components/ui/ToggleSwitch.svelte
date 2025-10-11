<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { Spring } from "svelte/motion";

  type Props = {
    id: string;
  } & HTMLInputAttributes;

  let { id, checked = $bindable(), ...props }: Props = $props();

  // create springs
  const translateX = new Spring(0, { stiffness: 0.3, damping: 0.6 });
  const width = new Spring(20, { stiffness: 0.3, damping: 0.6 });
  const ringSize = new Spring(5, { stiffness: 0.3, damping: 0.6 });

  // update spring targets when checked changes
  $effect(() => {
    translateX.target = checked ? 28 : 0;
    width.target = checked ? 8 : 20;
    ringSize.target = checked ? 0 : 5;
  });
</script>

<label
  class="relative inline-block h-7 w-[48px] cursor-pointer rounded-md [-webkit-tap-highlight-color:_transparent]"
  class:bg-primary={checked}
  class:bg-base-400={!checked}
>
  <input class="peer sr-only" type="checkbox" {id} bind:checked {...props} />
  <span
    class="absolute inset-y-0 m-1 rounded-md ring-white ring-inset"
    class:bg-white={checked}
    class:bg-base-400={!checked}
    style="
      transform: translateX({translateX.current}px);
      width: {width.current}px;
      height: 20px;
      ring-width: {ringSize.current}px;
      --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
      --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc({ringSize.current}px + var(--tw-ring-offset-width)) var(--tw-ring-color);
      box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
    "
  ></span>
</label>
