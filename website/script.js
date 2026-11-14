/**
 * OmniExtract - Landing Page Interactive Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mockup Tab Switcher
  const tabs = document.querySelectorAll('.m-tab');
  const views = document.querySelectorAll('.m-view');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.dataset.target;
      const targetView = document.getElementById(targetId);
      if (targetView) targetView.classList.add('active');
    });
  });

  // 2. Copy chrome://extensions button
  const copyBtn = document.getElementById('btnCopyUrl');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('chrome://extensions').then(() => {
        showToast('Copied "chrome://extensions" to clipboard! Paste it in your address bar.');
      }).catch(() => {
        showToast('Type chrome://extensions into your browser bar.');
      });
    });
  }

  // 3. Download tracking toast
  document.querySelectorAll('a[download]').forEach(link => {
    link.addEventListener('click', () => {
      setTimeout(() => {
        showToast('🎉 Download started! Follow Step 1-3 below to install in 20 seconds.');
      }, 500);
    });
  });

  // Toast notification helper
  const toast = document.getElementById('siteToast');
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }
});

