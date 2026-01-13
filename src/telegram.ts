// src/telegram.ts
import {
    init,
    viewport,
    swipeBehavior,
    isTMA,
  } from '@telegram-apps/sdk-react';
  
  export async function initTelegram() {
    if (!(await isTMA())) return;
  
    init();
  
    // viewport
    if (viewport.mount.isAvailable()) {
      await viewport.mount();
      viewport.expand();
    }
  
    // fullscreen (Android + Desktop)
    if (viewport.requestFullscreen.isAvailable()) {
      viewport.requestFullscreen();
    }
  
    // ❌ запрет свайпа вниз
    if (swipeBehavior.isSupported()) {
      swipeBehavior.mount();
      swipeBehavior.disableVertical();
    }
  }
  