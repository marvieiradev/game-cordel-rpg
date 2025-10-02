// =================================================================
// MÓDULO DE UI
// Responsabilidade: Gerenciar a interface do usuário, incluindo
// cache de elementos DOM, listeners, renderização e gerenciamento de telas
// =================================================================

import {
  startNewGame,
  continueGame,
  deleteAllData,
  startGameFromStory,
  moveToNextRoom,
  playerAttack,
  playerRoar,
  usePotion,
  openChest,
  ignoreChest,
  liftAction,
  observeAction,
  showStrengthenModal,
  saveAndContinue,
  continueAfterSaving,
  upgradeAttribute,
  hideStrengthenModal,
  showExitModal,
  initializeGame,
  gameState,
} from "./game.js";
import { ROOM_TYPES, SOUNDS, PLAYER_ACTIONS, ANIM_DELAY } from "./data.js";

// Função auxiliar para carregar os áudios
const createAudio = (src, loop = false) => {
  const a = new Audio(src);
  a.loop = loop;
  return a;
};
const gameMusic = createAudio(SOUNDS.gameMusic, true);
const menuMusic = createAudio(SOUNDS.menuMusic, true);
// Reproduzir efeitos sonoros
export const playSound = (src) => {
  try {
    new Audio(src).play();
  } catch (e) {}
};
// Reproduzir musica do jogo
export const playMusicGame = () => {
  try {
    menuMusic.pause();
    gameMusic.play();
  } catch (e) {}
};
// Reproduzir musica do menu
export const playMusicMenu = () => {
  try {
    gameMusic.pause();
    menuMusic.play();
  } catch (e) {}
};

/* --- Cache de elementos DOM (otimizado) ---*/
export let DOM = {};

export const selectors = {
  // Telas
  "splash-screen": "splashScreen",
  "menu-screen": "menuScreen",
  "story-screen": "storyScreen",
  "game-screen": "gameScreen",
  "game-over-screen": "gameOverScreen",
  "credits-screen": "creditsScreen",
  "about-screen": "aboutScreen",
  "instructions-screen": "instructionsScreen",
  "strengthen-modal": "strengthenModal",
  "erase-modal": "eraseModal",
  "exit-modal": "exitModal",
  // Botões (apenas os que precisam de acesso direto)
  "btn-start": "startButton",
  "btn-continue": "continueButton",
  "btn-about": "aboutButton",
  "btn-instructions": "instructionsButton",
  "btn-delete-data": "deleteDataButton",
  "btn-start-game": "startGameButton",
  "btn-attack": "attackButton",
  "btn-esp-atk": "specialAtkButton",
  "btn-roar": "roarButton",
  "btn-left": "leftButton",
  "btn-right": "rightButton",
  "open-action-button": "openChestButton",
  "ignore-action-button": "ignoreChestButton",
  "lift-action-button": "liftActionButton",
  "observe-action-button": "observeActionButton",
  "btn-potion": "potionButton",
  "btn-restart": "restartButton",
  "btn-credits-menu": "creditsMenuButton",
  "btn-about-menu": "aboutMenuButton",
  "btn-instructions-menu": "instructionsMenuButton",
  "btn-strengthen": "strengthenButton",
  "btn-save-continue": "saveContinueButton",
  "btn-continue-saved": "continueSavedButton",
  "btn-upgrade-attack": "upgradeAttackButton",
  "btn-upgrade-defense": "upgradeDefenseButton",
  "btn-upgrade-hp": "upgradeHpButton",
  "btn-close-modal": "closeModalButton",
  "exit-game": "btnExitGame",
  // UI do jogo
  room: "bgRoom",
  "player-hp": "playerHpEl",
  "player-max-hp": "playerMaxHpEl",
  "player-ac": "playerAcEl",
  "player-damage": "playerDamageEl",
  "player-gold": "playerGoldEl",
  "potion-count": "potionCountEl",
  "monster-name": "monsterNameEl",
  "room-number": "roomNumberEl",
  "room-element": "roomElementEl",
  "image-element": "imageElementEl",
  "log-area": "logAreaEl",
  orientation: "orientationText",
  "action-buttons": "actionButtons",
  "explore-buttons": "exploreButtons",
  "trap-buttons": "trapButtons",
  "chest-buttons": "chestButtons",
  "safe-room-buttons": "safeRoomButtons",
  "continue-buttons": "continueButtons",
  "damage-bonus": "bonusDamageEl",
  "status-monster": "monsterStatus",
  "action-layer": "actionsLayer",
  "confirm-options": "confirmOptions",
  "ok-buttons": "okOptions",
  "erase-options": "eraseOptions",
  stars: "starsEl",
  "btn-yes": "btnYes",
  "btn-no": "btn-no",
  "btn-erase-yes": "btnEraseYes",
  "btn-erase-no": "btnEraseNo",
  "btn-ok": "btnOk",
  "btn-exit-yes": "btnExitYes",
  "btn-exit-no": "btnExitNo",
};

// Funçao para cachear todos os elementos DOM
export function cacheDOMAndInit() {
  for (const [id, prop] of Object.entries(selectors)) {
    DOM[prop] = document.getElementById(id);
  }
}

/* --- Listeners: conectar botões do jogo com suas funções correspondentes ---*/
export const connectListeners = () => {
  if (DOM.splashScreen)
    DOM.splashScreen.addEventListener("click", () => {
      showScreen(DOM.menuScreen);
      playMusicMenu();
    });
  // Menu
  if (DOM.startButton) DOM.startButton.addEventListener("click", startNewGame);
  if (DOM.continueButton)
    DOM.continueButton.addEventListener("click", continueGame);
  if (DOM.aboutButton)
    DOM.aboutButton.addEventListener("click", () =>
      showScreen(DOM.aboutScreen)
    );
  if (DOM.instructionsButton)
    DOM.instructionsButton.addEventListener("click", () =>
      showScreen(DOM.instructionsScreen)
    );
  if (DOM.deleteDataButton)
    DOM.deleteDataButton.addEventListener("click", deleteAllData);

  // História
  if (DOM.startGameButton)
    DOM.startGameButton.addEventListener("click", startGameFromStory);

  // Jogo
  if (DOM.leftButton)
    DOM.leftButton.addEventListener("click", () => moveToNextRoom("left"));
  if (DOM.rightButton)
    DOM.rightButton.addEventListener("click", () => moveToNextRoom("right"));
  if (DOM.attackButton)
    DOM.attackButton.addEventListener("click", () => playerAttack(false));
  if (DOM.specialAtkButton)
    DOM.specialAtkButton.addEventListener("click", () => playerAttack(true));
  if (DOM.roarButton) DOM.roarButton.addEventListener("click", playerRoar);
  if (DOM.potionButton) DOM.potionButton.addEventListener("click", usePotion);
  if (DOM.openChestButton)
    DOM.openChestButton.addEventListener("click", openChest);
  if (DOM.ignoreChestButton)
    DOM.ignoreChestButton.addEventListener("click", ignoreChest);
  if (DOM.liftActionButton)
    DOM.liftActionButton.addEventListener("click", liftAction);
  if (DOM.observeActionButton)
    DOM.observeActionButton.addEventListener("click", observeAction);

  // Sala segura
  if (DOM.strengthenButton)
    DOM.strengthenButton.addEventListener("click", showStrengthenModal);
  if (DOM.saveContinueButton)
    DOM.saveContinueButton.addEventListener("click", saveAndContinue);
  if (DOM.continueSavedButton)
    DOM.continueSavedButton.addEventListener("click", continueAfterSaving);

  // Modal de fortalecimento
  if (DOM.upgradeAttackButton)
    DOM.upgradeAttackButton.addEventListener("click", () =>
      upgradeAttribute("attack")
    );
  if (DOM.upgradeDefenseButton)
    DOM.upgradeDefenseButton.addEventListener("click", () =>
      upgradeAttribute("defense")
    );
  if (DOM.upgradeHpButton)
    DOM.upgradeHpButton.addEventListener("click", () => upgradeAttribute("hp"));
  if (DOM.closeModalButton)
    DOM.closeModalButton.addEventListener("click", hideStrengthenModal);

  // Modal sair do jogo
  if (DOM.btnExitGame) DOM.btnExitGame.addEventListener("click", showExitModal);

  // Fim de Jogo e Créditos
  if (DOM.restartButton)
    DOM.restartButton.addEventListener("click", () => initializeGame());
  if (DOM.creditsMenuButton)
    DOM.creditsMenuButton.addEventListener("click", () => initializeGame());
  if (DOM.aboutMenuButton)
    DOM.aboutMenuButton.addEventListener("click", () =>
      showScreen(DOM.menuScreen)
    );
  if (DOM.instructionsMenuButton)
    DOM.instructionsMenuButton.addEventListener("click", () =>
      showScreen(DOM.menuScreen)
    );
};

//* --- Sistema de fila e proecessamento de mensagens ---*/
const MESSAGE_DELAY = 2000; // 2 segundos entre mensagens
// Função de delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Enfileira mensagem(s)
export const addMessage = (message) => {
  gameState.messageQueue.push(message);
  if (!gameState.processingMessages) processMessageQueue();
};

// Processa fila sequencialmente
async function processMessageQueue() {
  gameState.processingMessages = true;
  while (gameState.messageQueue.length > 0) {
    const message = gameState.messageQueue.shift();
    if (DOM.logAreaEl) DOM.logAreaEl.innerText = message;
    render("hide_actions"); // <--- Ação de renderização
    await delay(MESSAGE_DELAY);
  }

  gameState.processingMessages = false;
  if (gameState.waitingForAction) {
    render("show_actions"); // <--- Ação de renderização
  }
}

/* --- Função única de renderização (separação de lógica/ui) ---*/
const RENDER_ELEMENTS = [
  "playerHpEl",
  "playerMaxHpEl",
  "playerAcEl",
  "playerDamageEl",
  "playerGoldEl",
  "potionCountEl",
  "roomNumberEl",
];
const ACTION_BUTTONS = [
  "actionButtons",
  "exploreButtons",
  "trapButtons",
  "chestButtons",
  "safeRoomButtons",
  "continueButtons",
];

function render(type) {
  const {
    player,
    currentMonster,
    currentRoomData,
    turnsToSpecial,
    turnsToRoar,
    isMonsterScared,
    processingMessages,
    waitingForAction,
  } = gameState;

  // Atualiza Stats do Jogador
  if (type === "stats" || type === "all") {
    DOM.playerHpEl.textContent = player.hp > 0 ? player.hp : 0;
    DOM.playerMaxHpEl.textContent = player.maxHp;
    DOM.playerAcEl.textContent = player.ac;
    DOM.playerDamageEl.textContent = player.attackBonus;
    DOM.playerGoldEl.textContent = player.gold;
    DOM.potionCountEl.textContent = player.potions;
  }

  // Atualiza Elementos de Sala / Monstro
  if (type === "room" || type === "all" || !processingMessages) {
    // Monstro
    if (currentMonster) {
      DOM.monsterNameEl.style.opacity = 1;
      DOM.monsterNameEl.textContent = currentMonster.name;
    } else {
      DOM.monsterNameEl.textContent = "";
      DOM.monsterNameEl.style.opacity = 0;
    }
    // Elemento da Sala (Imagem)
    DOM.roomElementEl.className = "room-element";
    if (currentRoomData.type)
      DOM.roomElementEl.classList.add(currentRoomData.type);
  }

  // Gerencia Botões de Ação
  if (
    type === "actions" ||
    type === "all" ||
    type === "hide_actions" ||
    type === "show_actions"
  ) {
    // Esconde todos
    ACTION_BUTTONS.forEach((key) => {
      if (DOM[key]) DOM[key].style.display = "none";
    });

    if (processingMessages || type === "hide_actions" || player.hp <= 0) {
      if (DOM.orientationText) DOM.orientationText.textContent = "";
      return;
    }

    // Mostra elementos apropriados
    let buttonsEl, text;
    switch (currentRoomData.type) {
      case ROOM_TYPES.EMPTY:
      case ROOM_TYPES.SEEN:
        buttonsEl = DOM.exploreButtons;
        text = "Pra onde ir?";
        break;
      case ROOM_TYPES.MONSTER:
      case ROOM_TYPES.BOSS:
        buttonsEl =
          currentMonster && currentMonster.hp > 0
            ? DOM.actionButtons
            : DOM.exploreButtons;
        text =
          currentMonster && currentMonster.hp > 0
            ? "O que fazer?"
            : "Pra onde ir?";
        break;
      case ROOM_TYPES.CHEST:
        buttonsEl = DOM.chestButtons;
        text = "O que fazer?";
        break;
      case ROOM_TYPES.TRAP:
        buttonsEl = DOM.trapButtons;
        text = "O que fazer?";
        break;
      case ROOM_TYPES.SAFE:
        buttonsEl = DOM.safeRoomButtons;
        text = "O que fazer?";
        break;
      case ROOM_TYPES.PROTECTED:
        buttonsEl = DOM.continueButtons;
        text = "O que fazer?";
        break;
    }

    if (DOM.orientationText) DOM.orientationText.textContent = text || "";
    if (buttonsEl) buttonsEl.style.display = "flex";

    /* --- Habilita e desabilita botões de acordo com o botão clicado --- */
    // Toggle botões especiais (dentro da actionButtons)
    const toggleButton = (button, enable, { img, text }) => {
      if (!button) return;
      button.style.pointerEvents = enable ? "auto" : "none";
      button.style.opacity = enable ? 1 : 0.5;
      button.innerHTML = `<img class="btn-image" src="${img}" alt=""/> ${text}`;
    };

    const isCombat =
      currentRoomData.type === ROOM_TYPES.MONSTER ||
      currentRoomData.type === ROOM_TYPES.BOSS;

    if (isCombat && player.hp > 0) {
      if (turnsToSpecial > 0)
        toggleButton(DOM.specialAtkButton, false, {
          img: "images/ui/timer.webp",
          text: `ESPERE ( ${turnsToSpecial} )`,
        });
      else
        toggleButton(DOM.specialAtkButton, true, {
          img: "images/ui/special-attack.webp",
          text: "DILACERAR",
        });

      if (turnsToRoar > 0)
        toggleButton(DOM.roarButton, false, {
          img: "images/ui/timer.webp",
          text: `ESPERE ( ${turnsToRoar} )`,
        });
      else
        toggleButton(DOM.roarButton, true, {
          img: "images/ui/roar.webp",
          text: "ROSNAR",
        });
    }
  }
}

// Funções de UI chamam render
export const hideAllActions = () => render("hide_actions");
export const showAppropriateActions = () => render("show_actions");
export const updateUI = () => render("all");

/* --- Gerenciamento de Telas ---*/
export const showScreen = (screen) => {
  [
    DOM.splashScreen,
    DOM.menuScreen,
    DOM.storyScreen,
    DOM.gameScreen,
    DOM.gameOverScreen,
    DOM.creditsScreen,
    DOM.aboutScreen,
    DOM.instructionsScreen,
  ].forEach((scr) => {
    if (scr) scr.style.display = "none";
  });
  if (screen) screen.style.display = "block";
};

/* --- Mostrar animações --- */
export function showAnimation(kind) {
  // Remove classes (garantia)
  DOM.imageElementEl.classList.remove("zoomIn", "zoomOut", "gone", "disappear");

  const actions = {
    "player-attack": () => {
      DOM.imageElementEl.classList.add("zoomOut");
      if (gameState.isSpecialAtk) {
        playSound(SOUNDS.playerSpecialAtk);
        showActionPlayer("special");
      } else {
        playSound(SOUNDS.playerAtk);
        showActionPlayer("attack");
      }
    },
    "player-damage": () => playSound(SOUNDS.playerDamage),
    "player-roar": () => {
      showActionPlayer("roar");
      DOM.imageElementEl.classList.add("zoomOut");
      playSound(SOUNDS.roar);
    },
    "player-blink": () => {
      showActionPlayer("blink");
      setTimeout(() => (DOM.imageElementEl.src = ""), ANIM_DELAY / 4);
    },
    "player-death": () => {
      playSound(SOUNDS.playerDeath);
      showActionPlayer("death");
    },
    "player-wakeup": () => {
      showActionPlayer("wakeup");
      setTimeout(() => {
        DOM.bgRoom.style.backgroundImage = "url('images/ui/forest.webp')";
      }, 100);
    },
    "monster-attack": () => {
      DOM.imageElementEl.classList.add("zoomIn");
      playSound(
        gameState.isPlayerDamage ? SOUNDS.playerDamage : SOUNDS.monsterAtk
      );
    },
    "monster-death": () =>
      (DOM.imageElementEl.src = "images/objects/cadaver.webp"),
    chest: () => {
      showActionPlayer("interact");
      DOM.imageElementEl.src = "images/objects/butija-alt.webp";
    },
    trap: () => {
      playSound(SOUNDS.trap);
      showActionPlayer("interact");
      DOM.imageElementEl.classList.add("gone");
      setTimeout(() => (DOM.imageElementEl.src = ""), ANIM_DELAY / 2);
    },
    fire: () => playSound(SOUNDS.fire),
    potion: () => {
      playSound(SOUNDS.potion);
      showActionPlayer("potion");
    },
    ignore: () => {
      DOM.imageElementEl.classList.add("gone");
      setTimeout(() => (DOM.imageElementEl.src = ""), ANIM_DELAY / 2);
    },
  };
  // Executa a ação se existir
  actions[kind]?.();
}

function showActionPlayer(anim) {
  DOM.actionsLayer.src = "";
  PLAYER_ACTIONS.forEach((action) => {
    if (action.type === anim) DOM.actionsLayer.src = action.image;
  });
}
