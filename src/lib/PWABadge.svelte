<script lang="ts">
  import { X } from "lucide-svelte";
  import { useRegisterSW } from "virtual:pwa-register/svelte";
  import { m } from "$paraglide/messages";

  // check for updates every hour
  const period = 60 * 60 * 1000;

  /**
   * This function will register a periodic sync check every hour, you can modify the interval as needed.
   */
  function registerPeriodicSync(swUrl: string, r: ServiceWorkerRegistration) {
    if (period <= 0) return;

    setInterval(async () => {
      if ("onLine" in navigator && !navigator.onLine) return;

      const resp = await fetch(swUrl, {
        cache: "no-store",
        headers: {
          cache: "no-store",
          "cache-control": "no-cache",
        },
      });

      if (resp?.status === 200) await r.update();
    }, period);
  }

  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return;
      if (r?.active?.state === "activated") {
        registerPeriodicSync(swUrl, r);
      } else if (r?.installing) {
        r.installing.addEventListener("statechange", (e) => {
          const sw = e.target as ServiceWorker;
          if (sw.state === "activated") registerPeriodicSync(swUrl, r);
        });
      }
    },
  });

  function close() {
    offlineReady.set(false);
    needRefresh.set(false);
  }

  let toast = $derived($offlineReady || $needRefresh);
  let message = $derived($offlineReady ? m.pwa_readyOffline() : $needRefresh ? m.pwa_updateAvailable() : "");

  // test alerts in dev mode
  // if (import.meta.env.DEV) {
  // offlineReady.set(true);
  // needRefresh.set(true);
  // }
</script>

{#if toast}
  <div
    class="bg-base-100 dark:bg-base-200 border-base-400/30 fixed right-0 bottom-0 z-[999] m-4 rounded-md border text-left shadow-md"
    role="alert"
    aria-labelledby="toast-message"
  >
    <div class="m-3 mr-10">
      <span id="toast-message">
        {message}
      </span>
    </div>
    {#if $needRefresh}
      <div class="m-3 flex gap-2">
        <button class="btn btn-primary" type="button" onclick={() => updateServiceWorker(true)}>
          {m.pwa_reloadBtn()}
        </button>
      </div>
    {/if}
    <button class="btn btn-square absolute top-0 right-0" type="button" onclick={close}><X size={16} /></button>
  </div>
{/if}
