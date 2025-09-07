// --- Game Constants and State ---
const ROOM_TYPES = {
  EMPTY: "empty",
  MONSTER: "monster",
  BOSS: "boss",
  CHEST: "chest",
  TRAP: "trap",
  SAFE: "safe",
};

const ROOM_PROBABILITIES = [
  { type: ROOM_TYPES.MONSTER, weight: 60 },
  { type: ROOM_TYPES.CHEST, weight: 20 },
  { type: ROOM_TYPES.TRAP, weight: 15 },
  { type: ROOM_TYPES.EMPTY, weight: 5 },
];

const BOSS_ROOM = 50;
const SAFE_ROOMS = [15, 30, 45];
const MESSAGE_DELAY = 2000; // 2 segundos entre mensagens
const UPGRADE_COST = 20; // Custo em gold para melhorar um atributo
const TURNS = 0;
/*
// Estado inicial do jogador
const playerInitialState = {
  hp: 20,
  maxHp: 20,
  ac: 15,
  attackBonus: 5,
  damageBonus: 2,
  potions: 2,
  gold: 0,
  currentRoom: 0,
  lastRoomTypes: [],
};
*/

//Definições para testes
const playerInitialState = {
  hp: 200,
  maxHp: 200,
  ac: 55,
  attackBonus: 50,
  damageBonus: 20,
  potions: 2,
  gold: 0,
  currentRoom: 0,
  lastRoomTypes: [],
};

// Estado global do jogo
let player = { ...playerInitialState };
let currentMonster = null;
let playerDodging = false;
let monsterDodging = false;
let gameRooms = {};
let messageQueue = [];
let processingMessages = false;
let waitingForAction = false;
let currentRoomData = { number: 0, type: ROOM_TYPES.EMPTY };
let tempMessage = "";

// --- DOM Elements ---
// Screens
const menuScreen = document.getElementById("menu-screen");
const storyScreen = document.getElementById("story-screen");
const gameScreen = document.getElementById("game-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const creditsScreen = document.getElementById("credits-screen");
const aboutScreen = document.getElementById("about-screen");
const instructionsScreen = document.getElementById("instructions-screen");
const strengthenModal = document.getElementById("strengthen-modal");

// Buttons
const startButton = document.getElementById("btn-start");
const continueButton = document.getElementById("btn-continue");
const aboutButton = document.getElementById("btn-about");
const instructionsButton = document.getElementById("btn-instructions");
const deleteDataButton = document.getElementById("btn-delete-data");
const startGameButton = document.getElementById("btn-start-game");
const attackButton = document.getElementById("btn-attack");
const specialAtkButton = document.getElementById("btn-esp-atk");
const dodgeButton = document.getElementById("btn-dodge");
const leftButton = document.getElementById("btn-left");
const rightButton = document.getElementById("btn-right");
const openChestButton = document.getElementById("open-action-button");
const ignoreChestButton = document.getElementById("ignore-action-button");
const liftActionButton = document.getElementById("lift-action-button");
const observeActionButton = document.getElementById("observe-action-button");
const potionButton = document.getElementById("btn-potion");
const restartButton = document.getElementById("btn-restart");
const creditsMenuButton = document.getElementById("btn-credits-menu");
const aboutMenuButton = document.getElementById("btn-about-menu");
const instructionsMenuButton = document.getElementById("btn-instructions-menu");
const strengthenButton = document.getElementById("btn-strengthen");
const saveContinueButton = document.getElementById("btn-save-continue");
const upgradeAttackButton = document.getElementById("btn-upgrade-attack");
const upgradeDefenseButton = document.getElementById("btn-upgrade-defense");
const upgradeHpButton = document.getElementById("btn-upgrade-hp");
const closeModalButton = document.getElementById("btn-close-modal");
const btnPotion = document.getElementById("btn-potion");

// Game UI
const playerHpEl = document.getElementById("player-hp");
const playerMaxHpEl = document.getElementById("player-max-hp");
const playerAcEl = document.getElementById("player-ac");
const playerDamageEl = document.getElementById("player-damage");
const playerGoldEl = document.getElementById("player-gold");
const potionCountEl = document.getElementById("potion-count");
const monsterNameEl = document.getElementById("monster-name");
const roomNumberEl = document.getElementById("room-number");
const roomElementEl = document.getElementById("room-element");
const imageMonster = document.getElementById("image-monster");
const logAreaEl = document.getElementById("log-area");
const orientationText = document.getElementById("orientation");
const actionButtons = document.getElementById("action-buttons");
const exploreButtons = document.getElementById("explore-buttons");
const trapButtons = document.getElementById("trap-buttons");
const chestButtons = document.getElementById("chest-buttons");
const safeRoomButtons = document.getElementById("safe-room-buttons");
const bonusDamageEl = document.getElementById("damage-bonus");

// --- Event Listeners ---
// Menu
startButton.addEventListener("click", startNewGame);
continueButton.addEventListener("click", continueGame);
aboutButton.addEventListener("click", () => showScreen(aboutScreen));
instructionsButton.addEventListener("click", () =>
  showScreen(instructionsScreen)
);
deleteDataButton.addEventListener("click", deleteAllData);

// Story
startGameButton.addEventListener("click", startGameFromStory);

// Game
attackButton.addEventListener("click", playerAttack);
specialAtkButton.addEventListener("click", playerSpecialAtk);
dodgeButton.addEventListener("click", playerDodge);
leftButton.addEventListener("click", () => moveToNextRoom("left"));
rightButton.addEventListener("click", () => moveToNextRoom("right"));
potionButton.addEventListener("click", usePotion);
openChestButton.addEventListener("click", openChest);
ignoreChestButton.addEventListener("click", ignoreChest);

liftActionButton.addEventListener("click", liftAction);
observeActionButton.addEventListener("click", observeAction);

// Game Over and Credits
restartButton.addEventListener("click", () => showScreen(menuScreen));
creditsMenuButton.addEventListener("click", () => showScreen(menuScreen));
aboutMenuButton.addEventListener("click", () => showScreen(menuScreen));
instructionsMenuButton.addEventListener("click", () => showScreen(menuScreen));

// Safe Room
strengthenButton.addEventListener("click", showStrengthenModal);
saveContinueButton.addEventListener("click", saveAndContinue);

// Strengthen Modal
upgradeAttackButton.addEventListener("click", () => upgradeAttribute("attack"));
upgradeDefenseButton.addEventListener("click", () =>
  upgradeAttribute("defense")
);
upgradeHpButton.addEventListener("click", () => upgradeAttribute("hp"));
closeModalButton.addEventListener("click", hideStrengthenModal);

//Modal Erase
const eraseModal = document.getElementById("erase-modal");
const confirmOptions = document.getElementById("confirm-options");
const okOptions = document.getElementById("ok-buttons");
const eraseOptions = document.getElementById("erase-options");

// --- Helper Functions ---
function addMessage(message) {
  messageQueue.push(message);
  tempMessage = message;
  if (!processingMessages) {
    processMessageQueue();
  }
}

function hideAllActions() {
  actionButtons.style.display = "none";
  exploreButtons.style.display = "none";
  trapButtons.style.display = "none";
  chestButtons.style.display = "none";
  safeRoomButtons.style.display = "none";
  btnPotion.disabled = true;
  orientationText.textContent = "";
}

function processMessageQueue() {
  if (messageQueue.length === 0) {
    processingMessages = false;

    if (waitingForAction) {
      showAppropriateActions();
      btnPotion.disabled = false;
    }

    return;
  }

  processingMessages = true;
  const message = messageQueue.shift();
  logAreaEl.textContent = message;

  // Esconder todos os botões enquanto as mensagens estão sendo exibidas
  hideAllActions();

  setTimeout(() => {
    processMessageQueue();
  }, MESSAGE_DELAY);
}

// --- Gerenciamento de Telas ---
function showScreen(screen) {
  // Esconder todas as telas
  menuScreen.style.display = "none";
  storyScreen.style.display = "none";
  gameScreen.style.display = "none";
  gameOverScreen.style.display = "none";
  creditsScreen.style.display = "none";
  aboutScreen.style.display = "none";
  instructionsScreen.style.display = "none";

  // Mostrar a tela solicitada
  screen.style.display = "block";
}

// --- Inicialização do Jogo ---
function initializeGame() {
  // Carregar ou gerar salas
  const roomsData = localStorage.getItem("saveGameRooms");
  if (roomsData) {
    gameRooms = JSON.parse(roomsData);
  } else {
    generateAllRooms();
    localStorage.setItem("saveGameRooms", JSON.stringify(gameRooms));
  }

  // Verificar se existe jogo salvo em sala segura
  const savedGame = localStorage.getItem("gameSafeSave");
  if (savedGame) {
    continueButton.disabled = false;
    continueButton.style.display = "block";
  } else {
    continueButton.disabled = true;
    continueButton.style.display = "none";
  }
  // Iniciar com a tela de menu
  showScreen(menuScreen);
}

function startNewGame() {
  player = { ...playerInitialState };
  currentMonster = null;
  playerDodging = false;
  monsterDodging = false;
  messageQueue = [];
  processingMessages = false;
  waitingForAction = false;

  // Mostrar a tela de história
  showScreen(storyScreen);
}

function continueGame() {
  const savedGame = localStorage.getItem("gameSafeSave");
  if (savedGame) {
    player = JSON.parse(savedGame);

    // Converter a sala segura em sala vazia para evitar salvar novamente
    if (SAFE_ROOMS.includes(player.currentRoom)) {
      gameRooms[player.currentRoom] = ROOM_TYPES.EMPTY;
      localStorage.setItem("saveGameRooms", JSON.stringify(gameRooms));
    }

    showScreen(gameScreen);
    updateUI();

    // Definir o tipo da sala atual como vazia para garantir que apenas as opções de direção apareçam
    currentRoomData = {
      number: player.currentRoom,
      type: ROOM_TYPES.EMPTY,
    };

    addMessage("Você acorda em um local seguro.");
    waitingForAction = true;
  }
}

function startGameFromStory() {
  showScreen(gameScreen);
  updateUI();
  enterRoom(0);
}

function deleteAllData() {
  eraseModal.style.display = "flex";
  document.getElementById("btn-yes").addEventListener("click", () => {
    confirmOptions.style.display = "none";
    eraseOptions.style.display = "block";
  });

  document.getElementById("btn-erase-yes").addEventListener("click", () => {
    localStorage.removeItem("saveGameRooms");
    localStorage.removeItem("gameSafeSave");
    generateAllRooms();
    localStorage.setItem("saveGameRooms", JSON.stringify(gameRooms));
    continueButton.disabled = true;
    continueButton.style.display = "none";
    eraseOptions.style.display = "none";
    okOptions.style.display = "flex";
    document.getElementById("btn-ok").addEventListener("click", () => {
      resetEraseModal();
    });
  });

  document.getElementById("btn-erase-no").addEventListener("click", () => {
    resetEraseModal();
  });
  document.getElementById("btn-no").addEventListener("click", () => {
    resetEraseModal();
  });
}
function resetEraseModal() {
  eraseModal.style.display = "none";
  confirmOptions.style.display = "block";
  eraseOptions.style.display = "none";
  okOptions.style.display = "none";
}

// --- Atualização da UI ---
function updateUI() {
  playerHpEl.textContent = player.hp;
  playerMaxHpEl.textContent = player.maxHp;
  playerAcEl.textContent = player.ac;
  playerDamageEl.textContent = player.attackBonus;
  playerGoldEl.textContent = player.gold;
  potionCountEl.textContent = player.potions;

  if (currentMonster) {
    monsterNameEl.style.opacity = 1;
    monsterNameEl.textContent = currentMonster.name;
  } else {
    monsterNameEl.textContent = "";
    monsterNameEl.style.opacity = 0;
  }

  // Atualizar classe do elemento da sala
  roomElementEl.className = "room-element";
  if (currentRoomData.type) {
    roomElementEl.classList.add(currentRoomData.type);
  }

  //bonusDamageEl.textContent = player.damageBonus;
}

function showCombatActions() {
  if (!processingMessages) {
    hideAllActions();
    orientationText.textContent = "O que fazer?";
    actionButtons.style.display = "flex";
  }
}

function showExploreActions() {
  if (!processingMessages) {
    hideAllActions();
    orientationText.textContent = "Pra onde ir?";
    exploreButtons.style.display = "flex";
    roomElementEl.className = "room-element";
  }
}

function showChestActions() {
  if (!processingMessages) {
    hideAllActions();
    orientationText.textContent = "O que fazer?";
    chestButtons.style.display = "flex";
    roomElementEl.className = "room-element";
  }
}

function showTrapActions() {
  if (!processingMessages) {
    hideAllActions();
    orientationText.textContent = "O que fazer?";
    trapButtons.style.display = "flex";
    roomElementEl.className = "room-element";
  }
}

function showAppropriateActions() {
  waitingForAction = false;

  switch (currentRoomData.type) {
    case ROOM_TYPES.EMPTY:
      showExploreActions();
      break;
    case ROOM_TYPES.MONSTER:
    case ROOM_TYPES.BOSS:
      if (currentMonster && currentMonster.hp > 0) {
        showCombatActions();
      } else {
        showExploreActions();
      }
      break;
    case ROOM_TYPES.CHEST:
      showChestActions();
      waitingForAction = true;
      break;
    case ROOM_TYPES.TRAP:
      showTrapActions();
      waitingForAction = true;
      break;
    case ROOM_TYPES.SAFE:
      // Em sala segura, mostrar os botões específicos de sala segura
      actionButtons.style.display = "none";
      exploreButtons.style.display = "none";
      trapButtons.style.display = "none";
      chestButtons.style.display = "none";

      if (!processingMessages) {
        safeRoomButtons.style.display = "flex";
        potionButton.style.display = "flex";
      }
      break;
  }
}

// --- Lógica de Salas ---
function determineRoomType(roomNumber) {
  if (roomNumber === 0) return ROOM_TYPES.EMPTY; // Sala inicial é sempre vazia
  if (roomNumber === BOSS_ROOM) return ROOM_TYPES.BOSS;
  if (SAFE_ROOMS.includes(roomNumber)) return ROOM_TYPES.SAFE;
  if (roomNumber === BOSS_ROOM - 1) return ROOM_TYPES.CHEST; // Sala 49 sempre é baú

  // Verificar as últimas salas visitadas para aplicar as regras de sequência
  const lastTwoRooms = player.lastRoomTypes.slice(-2);

  // Regra: Após 2 monstros ou monstro+armadilha ou armadilha+armadilha, próxima sala é baú
  if (lastTwoRooms.length >= 2) {
    const isMonsterOrTrap = (type) =>
      type === ROOM_TYPES.MONSTER || type === ROOM_TYPES.TRAP;
    if (isMonsterOrTrap(lastTwoRooms[0]) && isMonsterOrTrap(lastTwoRooms[1])) {
      return ROOM_TYPES.CHEST;
    }
  }

  // Regra: Após sala vazia ou baú, próxima sala é monstro ou armadilha
  if (player.lastRoomTypes.length > 0) {
    const lastRoom = player.lastRoomTypes[player.lastRoomTypes.length - 1];
    if (lastRoom === ROOM_TYPES.EMPTY || lastRoom === ROOM_TYPES.CHEST) {
      // 85% monstro, 15% armadilha
      return Math.random() < 0.85 ? ROOM_TYPES.MONSTER : ROOM_TYPES.TRAP;
    }
  }

  // Para outras situações, usar a tabela de probabilidades
  const totalWeight = ROOM_PROBABILITIES.reduce(
    (sum, room) => sum + room.weight,
    0
  );
  let random = Math.random() * totalWeight;

  for (const room of ROOM_PROBABILITIES) {
    if (random < room.weight) {
      return room.type;
    }
    random -= room.weight;
  }
  return ROOM_TYPES.MONSTER;
}

function generateRoomType(roomNumber) {
  // Garantir que as salas 15, 30 e 45 sejam sempre salas seguras
  if (SAFE_ROOMS.includes(roomNumber)) {
    gameRooms[roomNumber] = ROOM_TYPES.SAFE;
    localStorage.setItem("saveGameRooms", JSON.stringify(gameRooms));
    return ROOM_TYPES.SAFE;
  }

  // Se a sala já foi pré-determinada, usar esse valor
  if (gameRooms[roomNumber] !== null) {
    return gameRooms[roomNumber];
  }

  // Caso contrário, determinar o tipo e salvar
  const roomType = determineRoomType(roomNumber);
  gameRooms[roomNumber] = roomType;
  localStorage.setItem("saveGameRooms", JSON.stringify(gameRooms));

  return roomType;
}

function enterRoom(roomNumber) {
  // Esconder todos os botões no início
  hideAllActions();

  player.currentRoom = roomNumber;
  const roomType = generateRoomType(roomNumber);

  // Registrar o tipo da sala para as regras de sequência
  player.lastRoomTypes.push(roomType);
  if (player.lastRoomTypes.length > 5) {
    player.lastRoomTypes.shift(); // Manter apenas as últimas 5 salas
  }

  // Atualizar dados da sala atual
  currentRoomData = {
    number: roomNumber,
    type: roomType,
  };

  // Atualizar UI
  updateUI();

  // Lógica específica para cada tipo de sala
  switch (roomType) {
    case ROOM_TYPES.EMPTY:
      if (roomNumber === 0) {
        logMessage("Vocâ abre os olhos. Na sua frente enxerga dois caminhos.");
      } else {
        logMessage("Não tem nada neste lugar.");
      }
      break;
    case ROOM_TYPES.MONSTER:
      currentMonster = generateMonster(roomNumber);
      logMessage(`${currentMonster.name} apareceu!`);
      break;
    case ROOM_TYPES.BOSS:
      currentMonster = generateBoss();
      logMessage(`${currentMonster.name} apareceu!`);
      break;
    case ROOM_TYPES.CHEST:
      imageMonster.src = "images/objects/butija.webp";
      logMessage("Você encontrou uma butija!");
      break;
    case ROOM_TYPES.TRAP:
      imageMonster.src = "images/objects/arapuca.webp";
      logMessage("Você caiu em uma arapuca!");

      // Aplicar dano da armadilha
      const trapDamage = 5;
      player.hp -= trapDamage;
      logMessage(`Você perdeu ${trapDamage} de vida!`);

      // Verificar se o jogador morreu
      if (player.hp <= 0) {
        player.hp = 0;
        updateUI();
        setTimeout(() => {
          gameOver();
        }, 4000);
        return;
      }
      break;
    case ROOM_TYPES.SAFE:
      imageMonster.src = "images/objects/fogueira.webp";
      logMessage("Você sente que está em um lugar seguro.");
      break;
  }

  // Atualizar UI
  updateUI();

  // Marcar que estamos esperando uma ação do jogador
  waitingForAction = true;
}

function generateAllRooms() {
  gameRooms = {};

  // Pré-definir salas fixas
  gameRooms[0] = ROOM_TYPES.EMPTY; // Sala inicial
  gameRooms[BOSS_ROOM] = ROOM_TYPES.BOSS; // Sala do boss

  // Garantir que as salas seguras sejam sempre do tipo SAFE
  for (const safeRoom of SAFE_ROOMS) {
    gameRooms[safeRoom] = ROOM_TYPES.SAFE;
  }

  // Sala 49 (antes do boss) sempre é baú
  gameRooms[BOSS_ROOM - 1] = ROOM_TYPES.CHEST;

  // Gerar as outras salas aleatoriamente
  for (let i = 1; i < BOSS_ROOM; i++) {
    if (gameRooms[i] === undefined) {
      gameRooms[i] = null;
    }
  }
}

function moveToNextRoom(direction) {
  // Determinar o próximo número de sala
  let nextRoom;

  if (direction === "left") {
    nextRoom = player.currentRoom + 1;
  } else {
    nextRoom = player.currentRoom + 2;
  }

  // Entrar na próxima sala
  enterRoom(nextRoom);
}

// --- Lógica de Combate ---
function rollDice(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function playerAttack() {
  if (processingMessages) return;

  // Roll d20 + attack bonus
  const attackRoll = rollDice(20);
  const attackTotal = attackRoll + player.attackBonus;

  addMessage("Você ataca!");

  // Check if hit
  if (attackTotal >= currentMonster.ac) {
    // Roll damage
    const damageRoll = rollDice(6);
    let damageTotal = damageRoll + player.damageBonus;

    // Nova lógica de dano
    if (attackRoll === 20) {
      // Ataque crítico - dobro do dano
      damageTotal *= 2;
      addMessage(`CRÍTICO! você causa ${damageTotal} de dano ao inimigo!`);
    } else if (attackTotal === currentMonster.ac) {
      // Ataque igual à CA - metade do dano
      damageTotal = Math.floor(damageTotal / 2);
      addMessage(`De raspão! você causa ${damageTotal} de dano ao inimigo.`);
    } else if (
      attackTotal >=
      currentMonster.ac + Math.ceil(currentMonster.ac * 0.5)
    ) {
      // Ataque supera CA+50% - dano aumentado em 50%
      damageTotal = Math.floor(damageTotal * 1.5);
      addMessage(`Golpe forte! você causa ${damageTotal} de dano ao inimigo!`);
    } else {
      // Dano normal
      addMessage(`Você causa ${damageTotal} de dano ao inimigo.`);
    }

    currentMonster.hp -= damageTotal;

    // Check if monster is defeated
    if (currentMonster.hp <= 0) {
      currentMonster.hp = 0;
      addMessage(`${currentMonster.name} foi derrotado!`);
      monsterDefeated();
      return;
    }
  } else {
    addMessage("Você errou!");
  }

  // Monster's turn
  setTimeout(() => {
    monsterTurn();
  }, MESSAGE_DELAY * 2);
}

function playerSpecialAtk() {
  if (processingMessages) return;
  const attackRoll = rollDice(20);
  const attackTotal = attackRoll + player.attackBonus;

  addMessage("Você ataca furiosamente!");

  if (attackTotal >= currentMonster.ac) {
    const damageRoll = rollDice(6);
    let damageTotal = damageRoll + player.damageBonus;

    if (attackRoll === 20) {
      damageTotal *= 2;
      addMessage(`CRÍTICO! você causa ${damageTotal} de dano ao inimigo!`);
    } else if (attackTotal === currentMonster.ac) {
      damageTotal = Math.floor(damageTotal / 2);
      addMessage(`De raspão! você causa ${damageTotal} de dano ao inimigo.`);
    } else if (
      attackTotal >=
      currentMonster.ac + Math.ceil(currentMonster.ac * 0.5)
    ) {
      damageTotal = Math.floor(damageTotal * 1.5);
      addMessage(`Golpe forte! você causa ${damageTotal} de dano ao inimigo!`);
    } else {
      addMessage(`Você causa ${damageTotal} de dano ao inimigo.`);
    }

    currentMonster.hp -= damageTotal + 5;

    if (currentMonster.hp <= 0) {
      currentMonster.hp = 0;
      addMessage(`${currentMonster.name} foi derrotado!`);
      monsterDefeated();
      return;
    }
  } else {
    addMessage("Você errou!");
  }
  setTimeout(() => {
    monsterTurn();
  }, MESSAGE_DELAY * 2);
}

function playerDodge() {
  if (processingMessages) return;

  addMessage("Você se prepara para desviar!");
  playerDodging = true;

  // Monster's turn
  monsterTurn();
}

function monsterTurn() {
  if (currentMonster.hp <= 0) {
    return;
  }

  // Ataque do monstro
  // Calcular CA efetiva do jogador (considerando esquiva)
  const effectivePlayerAC = player.ac + (playerDodging ? 5 : 0);

  // Rolar d20 + bônus de ataque do monstro
  const attackRoll = rollDice(20);
  const attackTotal = attackRoll + currentMonster.attackBonus;

  addMessage(`${currentMonster.name} vai te atacar`);

  // Verifica se o ataque acerta
  if (attackTotal >= effectivePlayerAC) {
    // Calcula o dano
    const damageRoll = rollDice(6);
    let damageTotal = damageRoll + currentMonster.damageBonus;

    // Lógica de dano
    if (attackRoll === 20) {
      // Ataque crítico - dobro do dano
      damageTotal *= 2;
      addMessage(`CRÍTICO! você perde ${damageTotal} de vida!`);
    } else if (attackTotal === effectivePlayerAC) {
      // Ataque igual à CA - metade do dano
      damageTotal = Math.floor(damageTotal / 2);
      addMessage(`De raspão! você perde ${damageTotal} de vida.`);
    } else if (
      attackTotal >=
      effectivePlayerAC + Math.ceil(effectivePlayerAC * 0.5)
    ) {
      // Ataque supera CA+50% - dano aumentado em 50%
      damageTotal = Math.floor(damageTotal * 1.5);
      addMessage(`Golpe forte! você perde ${damageTotal} de vida!`);
    } else {
      // Dano normal
      addMessage(`Acerto! você perde ${damageTotal} de vida.`);
    }

    player.hp -= damageTotal;

    // veirficar se o jogador morreu
    if (player.hp <= 0) {
      player.hp = 0;
      setTimeout(() => {
        updateUI();
      }, MESSAGE_DELAY * 2);
      setTimeout(() => {
        gameOver();
      }, MESSAGE_DELAY * 2);
      return;
    }
  } else {
    if (playerDodging) {
      addMessage("Você desviou do ataque!");
    } else {
      addMessage(`${currentMonster.name} errou!`);
    }
  }

  // Resetar estados de esquiva
  playerDodging = false;
  monsterDodging = false;

  // Atualizar UI após o turno do monstro
  setTimeout(() => {
    updateUI();
  }, MESSAGE_DELAY * 2);

  // Retornar o controle ao jogador
  waitingForAction = true;
}

//Quando o monstro for derrotado gerar loot
function monsterDefeated() {
  setTimeout(() => {
    imageMonster.src = "";
    monsterNameEl.textContent = "";
    monsterNameEl.style.opacity = 0;
  }, MESSAGE_DELAY * 2);
  if (currentMonster.type === "boss") {
    setTimeout(() => {
      victory();
    }, MESSAGE_DELAY * 2);
    return;
  }
  // Determinar loot baseado no tipo do monstro
  let goldAmount = 0;
  let potionChance = 0;

  switch (currentMonster.type) {
    case "fraco":
      goldAmount = Math.floor(Math.random() * 5) + 5; // 5-10 gold
      potionChance = 0.1; // 10% chance
      break;
    case "normal":
      goldAmount = Math.floor(Math.random() * 5) + 10; // 10-15 gold
      potionChance = 0.2; // 20% chance
      break;
    case "elite":
      goldAmount = Math.floor(Math.random() * 10) + 10; // 10-20 gold
      potionChance = 0.3; // 30% chance
      break;
  }

  // Adicionar ouro ao jogador
  player.gold += goldAmount;
  addMessage(`Você achou ${goldAmount} patacas!`);

  //Chance de achar potion
  if (Math.random() < potionChance) {
    player.potions += 1;
    addMessage("Você achou 1 aluá!");
  }
  currentMonster = null;
  waitingForAction = true;
  setTimeout(() => {
    updateUI();
  }, MESSAGE_DELAY * 4);
}

function usePotion() {
  if (player.potions <= 0) {
    addMessage("Você não tem mais aluá!");
    waitingForAction = true;
    return;
  }
  if (player.hp >= player.maxHp) {
    addMessage("Sua vida já está no máximo!");
    waitingForAction = true;
    return;
  }
  player.potions--;
  const healAmount = 10;
  const healedLife =
    player.maxHp - player.hp < healAmount
      ? player.maxHp - player.hp
      : healAmount;
  player.hp = Math.min(player.hp + healAmount, player.maxHp);
  addMessage(`Você bebeu um aluá! curou ${healedLife} de vida.`);
  updateUI();
  waitingForAction = true;
}

function gameOver() {
  logMessage("Você sente um frio na espinha, vê seu sangue escorrer...");

  // Remover o save do jogo
  localStorage.removeItem("gameSafeSave");

  // Mostrar tela de game over
  setTimeout(() => {
    imageMonster.src = "";
    showScreen(gameOverScreen);
  }, MESSAGE_DELAY * 3);
}

function victory() {
  logMessage("Você respira fundo e segue em frente!");
  // Mostrar tela de créditos
  setTimeout(() => {
    showScreen(creditsScreen);
  }, MESSAGE_DELAY * 4);
}

function logMessage(message) {
  addMessage(message);
}

// --- Lógica de Monstros ---
function generateMonster(roomNumber) {
  // Determina o tipo do monstro baseado no número da sala
  let monsterType;

  if (roomNumber < 10) {
    monsterType = "fraco";
  } else if (roomNumber < 30) {
    monsterType = "normal";
  } else {
    monsterType = "elite";
  }

  // Gerar estatísticas do monstro baseado no tipo
  let selectedMonster;
  let monsterStats;
  let monsterName;
  let monsterImage;

  switch (monsterType) {
    case "fraco":
      monsterStats = {
        hp: Math.floor(Math.random() * 3) + 12, // 12-14 HP
        maxHp: 14,
        ac: Math.floor(Math.random() * 3) + 12, // 12-14 AC
        attackBonus: Math.floor(Math.random() * 3) + 2, // 2-4 Attack Bonus
        damageBonus: Math.floor(Math.random() * 2) + 1, // 1-2 Damage Bonus
      };

      // Escolher nome e imagem aleatória do Monstro (tipo fraco)
      const weakMonsters = [
        { name: "Porco do Mato", image: "images/monster/monster.webp" },
        { name: "Cachorro Doido", image: "images/monster/cachorro-doido.webp" },
        { name: "Guabiru", image: "images/monster/guabiru.webp" },
        { name: "Cobra Cascavel", image: "images/monster/cobra-cascavel.webp" },
        { name: "Escorpião", image: "images/monster/escorpiao.webp" },
      ];
      selectedMonster =
        weakMonsters[Math.floor(Math.random() * weakMonsters.length)];
      monsterName = selectedMonster.name;
      imageMonster.src = `${selectedMonster.image}`;
      break;

    case "normal":
      monsterStats = {
        hp: Math.floor(Math.random() * 10) + 15, // 15-24 HP
        maxHp: 24,
        ac: Math.floor(Math.random() * 3) + 14, // 14-16 AC
        attackBonus: Math.floor(Math.random() * 2) + 5, // 5-6 Attack Bonus
        damageBonus: Math.floor(Math.random() * 2) + 2, // 2-3 Damage Bonus
      };

      // Escolher nome e imagem aleatória do Monstro (tipo normal)
      const normalMonsters = [
        { name: "Jaguatitica", image: "images/monster/jaguatirica.webp" },
        { name: "Gato Maracajá", image: "images/monster/gato-maracaja.webp" },
        { name: "Cabeça de Cuia", image: "images/monster/cabeca-de-cuia.webp" },
        { name: "Visage", image: "images/monster/visage.webp" },
        { name: "Saci Pererê", image: "images/monster/saci-perere.webp" },
      ];
      selectedMonster =
        normalMonsters[Math.floor(Math.random() * normalMonsters.length)];

      monsterName = selectedMonster.name;
      imageMonster.src = `${selectedMonster.image}`;
      break;

    case "elite":
      monsterStats = {
        hp: Math.floor(Math.random() * 15) + 26, // 26-40 HP
        maxHp: 40,
        ac: Math.floor(Math.random() * 3) + 16, // 16-18 AC
        attackBonus: Math.floor(Math.random() * 2) + 7, // 7-8 Attack Bonus
        damageBonus: Math.floor(Math.random() * 2) + 3, // 3-4 Damage Bonus
      };

      // Escolher nome e imagem aleatória do Monstro (tipo elite)
      const eliteMonsters = [
        { name: "Caipora", image: "images/monster/caipora.webp" },
        { name: "Corpo Seco", image: "images/monster/corpo-seco.webp" },
        { name: "Cabra Cabriola", image: "images/monster/cabra-cabriola.webp" },
        { name: "Lobisomem", image: "images/monster/lobisomen.webp" },
        { name: "Boitatá", image: "images/monster/boitata.webp" },
      ];
      selectedMonster =
        eliteMonsters[Math.floor(Math.random() * eliteMonsters.length)];
      monsterName = selectedMonster.name;
      imageMonster.src = `${selectedMonster.image}`;
      break;
  }

  return {
    name: monsterName,
    hp: monsterStats.hp,
    maxHp: monsterStats.maxHp,
    ac: monsterStats.ac,
    attackBonus: monsterStats.attackBonus,
    damageBonus: monsterStats.damageBonus,
    type: monsterType,
  };
}

//Gerar o boss da sala
function generateBoss() {
  const bossName = [
    { name: "Curupira", image: "images/monster/curupira.webp" },
    { name: "Cuca", image: "images/monster/cuca.webp" },
    { name: "Mula sem Cabeça", image: "images/monster/mula-sem-cabeca.webp" },
  ];
  selectedMonster = bossName[Math.floor(Math.random() * bossName.length)];
  imageMonster.src = `${selectedMonster.image}`;
  return {
    name: selectedMonster.name,
    hp: Math.floor(Math.random() * 2) + 74, // 74-75 HP
    maxHp: 75,
    ac: 18,
    attackBonus: Math.floor(Math.random() * 3) + 8, // 8-10 Attack Bonus
    damageBonus: Math.floor(Math.random() * 3) + 5, // 5-7 Damage Bonus
    type: "boss",
  };
}

// --- Lógica de Baús ---
function openChest() {
  // Determinar o tipo do baú
  const roll = Math.random() * 100;
  let chestType;

  if (roll < 80) {
    chestType = "normal";
  } else if (roll < 95) {
    chestType = "raro";
  } else {
    chestType = "lendario";
  }

  // Gerar o loot do baú com base no tipo
  const loot = generateChestLoot(chestType);

  // Aplicar o loot ao jogador
  applyLoot(loot);

  // Marcar o tipo da sala como vazia após abrir o baú
  currentRoomData.type = ROOM_TYPES.EMPTY;
  addMessage(tempMessage);
}

function ignoreChest() {
  addMessage("Você decide não mexer na butija.");
  imageMonster.src = "";
  currentRoomData.type = ROOM_TYPES.EMPTY;
  addMessage(tempMessage);
}

function liftAction() {
  addMessage("Você se levanta com cuidado.");
  // Após levantar, a armadilha desaparece e a sala é marcada como vazia
  setTimeout(() => {
    imageMonster.src = "";
  }, MESSAGE_DELAY * 1.5);
  roomElementEl.className = "room-element";
  currentRoomData.type = ROOM_TYPES.EMPTY;
  addMessage("Você está pronto para seguir em frente.");
  addMessage(tempMessage);
}

function observeAction() {
  addMessage("Você não vê nada de incomum neste lugar.");
  addMessage(tempMessage);
}

//Função para gerar loot baseado no tipo do baú
function generateChestLoot(chestType) {
  const roll = Math.random() * 100;
  let loot = {};

  switch (chestType) {
    case "normal":
      if (roll < 30) {
        loot = { type: "potion", amount: 1 };
      } else if (roll < 60) {
        console.log("Problema");
        loot = { type: "gold", amount: 20, gold: 20 };
      } else if (roll < 80) {
        loot = { type: "common_armor" };
      } else if (roll < 90) {
        loot = { type: "common_attack" };
      } else {
        loot = { type: "common_hp" };
      }
      break;
    case "raro":
      if (roll < 30) {
        loot = { type: "potion", amount: 2, gold: 30 };
      } else if (roll < 60) {
        loot = { type: "rare_armor", gold: 10 };
      } else if (roll < 90) {
        loot = { type: "rare_attack", gold: 10 };
      } else {
        loot = { type: "rare_hp", gold: 10 };
      }
      break;
    case "lendario":
      console.log("Lendario");
      if (roll < 30) {
        loot = { type: "potion", amount: 3, gold: 50 };
      } else if (roll < 60) {
        loot = { type: "legendary_armor", gold: 30 };
      } else if (roll < 90) {
        loot = { type: "legendary_attack", gold: 30 };
      } else {
        loot = { type: "legendary_hp", gold: 30 };
      }
      break;
  }

  return loot;
}

//Função para aplicar o loot ao jogador
function applyLoot(loot) {
  setTimeout(() => {
    imageMonster.src = "";
  }, MESSAGE_DELAY);
  // Achar gold
  if (loot.type === "gold") {
    player.gold += loot.gold;
    addMessage(`Você achou ${loot.amount} patacas!`);
    playerGoldEl.textContent = player.gold;
  }

  // Achar potion
  if (loot.type === "potion") {
    player.potions += loot.amount;
    addMessage(
      `Você achou ${loot.amount} ${
        loot.amount == 1 ? "garrafa" : "garrafas"
      } de aluá!`
    );
    potionCountEl.textContent = player.potions;
  }

  // Aumentar defesa
  if (loot.type === "common_armor") {
    player.ac += 1;
    addMessage("Achou um tônico! Sua defesa aumenta +1!");
  } else if (loot.type === "rare_armor") {
    player.ac += 2;
    addMessage("Achou um tônico amargo! Sua defesa aumenta +2!");
  } else if (loot.type === "legendary_armor") {
    player.ac += 3;
    addMessage("Achou um tônico forte! Sua defesa aumenta +3!");
  }

  // Aumentar vida máxima
  if (loot.type === "common_hp") {
    player.maxHp += 5;
    player.hp += 5;
    addMessage("Achou um elixir! Sua vida máxima aumenta +5!");
  } else if (loot.type === "rare_hp") {
    player.maxHp += 10;
    player.hp += 10;
    addMessage("Achou um exlixir forte! Sua vida máxima aumenta +10!");
  } else if (loot.type === "legendary_hp") {
    player.maxHp += 15;
    player.hp += 15;
    addMessage("Achou um exlixir santo! Sua vida máxima aumenta +15!");
  }

  // Aumentar ataque
  if (loot.type === "common_attack") {
    player.attackBonus += 1;
    player.damageBonus = Math.floor(player.attackBonus / 2);
    addMessage("Achou um chá amargo! Seu ataque aumenta +1");
  } else if (loot.type === "rare_attack") {
    player.attackBonus += 2;
    player.damageBonus = Math.floor(player.attackBonus / 2);
    addMessage("Achou um chá forte de raiz! Seu ataque aumenta +2");
  } else if (loot.type === "legendary_attack") {
    player.attackBonus += 3;
    player.damageBonus = Math.floor(player.attackBonus / 2);
    addMessage("Achou um chá encantado! Seu ataque aumenta +3");
  }
  updateUI();
}

// --- Lógica de Sala Segura ---
function saveGameInSafeRoom() {
  localStorage.setItem("gameSafeSave", JSON.stringify(player));
  addMessage("Você cochila ao lado da fogueira. Jogo salvo!");
}

function saveAndContinue() {
  saveGameInSafeRoom();
  setTimeout(() => {
    imageMonster.src = "";
  }, MESSAGE_DELAY);
  // Após salvar, marcar a sala como vazia para mostrar opções de direção
  currentRoomData.type = ROOM_TYPES.EMPTY;
  addMessage("Você se sente revigorado e pronto para continuar sua jornada.");
  waitingForAction = true;
}

// --- Lógica de Fortalecimento ---
function showStrengthenModal() {
  // Verificar se o jogador tem gold suficiente
  const hasEnoughGold = player.gold >= UPGRADE_COST;

  // Atualizar estado dos botões de upgrade
  upgradeAttackButton.disabled = !hasEnoughGold;
  upgradeDefenseButton.disabled = !hasEnoughGold;
  upgradeHpButton.disabled = !hasEnoughGold;
  //Exibir o modal
  strengthenModal.style.display = "flex";
}

function hideStrengthenModal() {
  strengthenModal.style.display = "none";
}

function upgradeAttribute(attribute) {
  // Verificar se o jogador tem gold suficiente
  if (player.gold < UPGRADE_COST) {
    document.getElementById("strengthen-modal").disabled = true;
    addMessage("Patacas insuficientes!");
    hideStrengthenModal();
    return;
  }

  // Gastar o gold
  player.gold -= UPGRADE_COST;

  // Aplicar o upgrade
  switch (attribute) {
    case "attack":
      player.attackBonus += 1;
      player.damageBonus = Math.floor(player.attackBonus / 2);
      addMessage(
        `Ataque aumentado! (${player.attackBonus - 1} -> ${player.attackBonus})`
      );
      break;
    case "defense":
      player.ac += 1;
      addMessage(`Defesa aumentada! (${player.ac - 1} -> ${player.ac})`);
      break;
    case "hp":
      player.maxHp += 1;
      player.hp += 1;
      addMessage(
        `Vida máxima aumentada! (${player.maxHp - 1} -> ${player.maxHp})`
      );
      break;
  }

  // Fechar o modal
  hideStrengthenModal();
  updateUI();

  // Após fortalecer, marcar a sala como vazia para mostrar opções de direção
  addMessage("Você se sente mais forte!");
  waitingForAction = true;
}

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", initializeGame);
