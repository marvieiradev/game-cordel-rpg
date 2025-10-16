// =================================================================================
// MÓDULO INICIAL
// Responsabilidade: Iniciar o jogo, conectar módulos e gerenciar o fluxo principal
// =================================================================================
import { initializeGame } from "./game.js";
import { cacheDOMAndInit, connectListeners, DOM, showScreen } from "./ui.js";
/* --- Inicialização --- */
document.addEventListener("DOMContentLoaded", () => {
  cacheDOMAndInit(); // Novo: Cache DOM
  connectListeners();
  // Foi necerssário utilizar esse código para garantir que a musica do menu seja executada.
  // Os navegadores não permitem que uma mídia seja executada automaticamente ao carregar uma página
  showScreen(DOM.splashScreen);
  DOM.splashScreen.addEventListener(
    "click",
    () => {
      initializeGame();
    },
    { once: true }
  ); // Usar once para evitar múltiplos listeners
});
