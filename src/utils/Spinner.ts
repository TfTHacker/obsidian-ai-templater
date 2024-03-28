// creates and removes a spinner element that is appended to the active workspace leaf's view header
// provides user feedback that the plugin is working on a AI task

class Spinner {
  private spinner: HTMLDivElement | null = null;
  private timerId: NodeJS.Timeout | null = null;

  add(): void {
    // Create the parent div
    this.spinner = document.createElement('div');
    this.spinner.className = 'ait-spinner';

    // Create the child divs
    const bounceDelays = ['-0.42s', '-0.36s', '-0.16s', '0s'];
    bounceDelays.forEach((delay) => {
      const bounce = document.createElement('div');
      bounce.className = 'oil-bounce';
      bounce.style.setProperty('--bounce-delay', delay);
      this.spinner?.appendChild(bounce);
    });

    // Append the spinner to the active workspace leaf's view header
    const activeViewHeader = document.querySelector('.workspace-leaf.mod-active .cm-scroller');
    if (activeViewHeader) activeViewHeader.after(this.spinner);

    // Remove the spinner after a brief period in case the task gets stuck
    this.timerId = setTimeout(() => {
      this.remove();
    }, 120000);
  }

  remove(): void {
    // Clear the timer if it's still running
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    // Remove the spinner
    if (this.spinner) {
      this.spinner.remove();
      this.spinner = null;
    }
  }
}

export default Spinner;
