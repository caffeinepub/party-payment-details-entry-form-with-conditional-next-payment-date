/**
 * Utility to enforce light mode by removing the 'dark' class from the document.
 * This prevents any dark mode styling from being applied.
 */
export function forceLightMode(): void {
  // Remove dark class from both documentElement and body
  document.documentElement.classList.remove('dark');
  document.body.classList.remove('dark');
  
  // Set up a MutationObserver to prevent dark class from being re-added
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target as HTMLElement;
        if (target.classList.contains('dark')) {
          target.classList.remove('dark');
        }
      }
    });
  });

  // Observe both documentElement and body for class changes
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
  });
}
