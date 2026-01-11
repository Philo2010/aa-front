<script lang="ts">
  import { forgiveScoutwarn, getScoutwarn } from "./schema/sdk.gen";

  const secondsPerWarning = 5;
  const checkInterval = 30000; // Check for new warnings every 30 seconds
  let index = $state(0);
  let secondsLeft = $state(secondsPerWarning);
  let canContinue = $state(false);
  let countdownInterval: number;
  let pollInterval: number;
  let warnings = $state<string[]>([]);
  let forgive_id = $state<number[]>([]);
  let isVisible = $state(false);

  async function fetchWarnings() {
    let res = await getScoutwarn();
    if (res.error) {
      return;
    } else {
      if (res.data.status === 'Error') {
        return;
      } else {
        let data = res.data.message;
        let tempWarnings: string[] = [];
        let tempIds: number[] = [];
        
        for (const message of data) {
          let final_message: string = "FROM " + message.sender + "\nMESSAGE: " + message.message;
          tempWarnings.push(final_message);
          tempIds.push(message.unsent_id);
        }
        
        // Only update if we have new warnings
        if (tempWarnings.length > 0) {
          warnings = tempWarnings;
          forgive_id = tempIds;
          
          // If modal wasn't visible, show it and start countdown
          if (!isVisible) {
            isVisible = true;
            index = 0;
            document.body.style.overflow = "hidden";
            startCountdown();
          }
        } else {
          // No warnings, hide modal if it's visible
          if (isVisible) {
            close();
          }
        }
      }
    }
  }

  function startCountdown() {
    secondsLeft = secondsPerWarning;
    canContinue = false;
    clearInterval(countdownInterval);
    countdownInterval = window.setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        clearInterval(countdownInterval);
        canContinue = true;
      }
    }, 1000);
  }

  async function next() {
    if (!canContinue) return;
    
    // Send forgiveness to server
    await forgiveScoutwarn({
      body: {
        id: forgive_id[index]
      }
    });

    if (index < warnings.length - 1) {
      index += 1;
      startCountdown();
    } else {
      close();
    }
  }

  function close() {
    clearInterval(countdownInterval);
    document.body.style.overflow = "";
    isVisible = false;
  }

  // Initial fetch and set up polling
  $effect(() => {
    // Fetch immediately
    fetchWarnings();
    
    // Set up polling interval
    pollInterval = window.setInterval(() => {
      fetchWarnings();
    }, checkInterval);

    // Cleanup on unmount
    return () => {
      clearInterval(countdownInterval);
      clearInterval(pollInterval);
      document.body.style.overflow = "";
    };
  });
</script>

{#if isVisible && warnings.length > 0}
  <div class="overlay">
    <div class="modal" role="alertdialog" aria-modal="true">
      <h2>⚠️ Warning {index + 1} of {warnings.length}</h2>
      <p class="message">
        {warnings[index]}
      </p>
      <p class="countdown">
        {#if canContinue}
          You may continue.
        {:else}
          Continue available in {secondsLeft}s…
        {/if}
      </p>
      <button
        class="continue"
        disabled={!canContinue}
        onclick={next}
      >
        {index < warnings.length - 1 ? "Next warning" : "I Understand"}
      </button>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal {
    background: red;
    padding: 2rem;
    max-width: 460px;
    width: 90%;
    border-radius: 14px;
    text-align: center;
  }
  .message {
    white-space: pre-line;
    color: white;
  }
  .countdown {
    margin: 1rem 0;
    color: white;
  }
  button.continue {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>