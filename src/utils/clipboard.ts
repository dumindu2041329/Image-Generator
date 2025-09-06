/**
 * Copies a string to the clipboard using the best available method.
 * This function is designed to work in various environments, including
 * sandboxed iframes where the modern Clipboard API might be restricted.
 *
 * @param text The text to copy.
 * @returns A promise that resolves if successful, and rejects if all methods fail.
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  // 1. Try the modern Clipboard API. It's the most secure and efficient method.
  // We wrap it in a try-catch because it can fail due to permissions policies.
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return; // Success!
    } catch (err) {
      // It's common for this to fail in sandboxed environments.
      // We'll log a warning and proceed to the fallback method.
      console.warn('Clipboard API write failed, trying fallback:', err);
    }
  }

  // 2. Fallback to the legacy `document.execCommand('copy')` method.
  // This method requires the text to be selected in the DOM, so we create a temporary textarea.
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Make the textarea invisible and prevent it from affecting the layout.
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  textArea.style.left = '-9999px';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    // Execute the copy command.
    const successful = document.execCommand('copy');
    if (!successful) {
      // If execCommand returns false, it indicates failure.
      throw new Error('execCommand returned false');
    }
  } catch {
    // If an error occurs during the command, we re-throw it.
    throw new Error('Fallback copy method failed.');
  } finally {
    // Always remove the temporary textarea from the DOM.
    document.body.removeChild(textArea);
  }
};
