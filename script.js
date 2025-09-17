/*--- Constantes e estados do jogo ---*/
const ROOM_TYPES = {
  EMPTY: "empty",
  MONSTER: "monster",
  BOSS: "boss",
  CHEST: "chest",
  TRAP: "trap",
  SAFE: "safe",
  PROTECTED: "protected",
};

// Probabilidade de qual sala pode aparecer para o jogador
const ROOM_PROBABILITIES = [
  { type: ROOM_TYPES.MONSTER, weight: 60 }, //Chance 60% Monstro
  { type: ROOM_TYPES.CHEST, weight: 20 }, //Chance 20% Butija
  { type: ROOM_TYPES.TRAP, weight: 15 }, //Chance 15% Arapuca
  { type: ROOM_TYPES.EMPTY, weight: 5 }, //Chance 5% Sala vazia
];

//Constantes do jogo
const BOSS_ROOM = 50; // Sala do chefe sempre será a ultima (50)
const SAFE_ROOMS = [15, 30, 45]; // Salas seguras serão as 15,30 e 45
const MESSAGE_DELAY = 2000; // 2 segundos entre mensagens
const UPGRADE_COST = 25; // Custo em dinheiro para melhorar um atributo
const TRAP_DAMAGE = 5; // Dano a cair na armadilha

// Sons do jogo
const SOUNDS = {
  playerAtk: "sounds/player_atk.mp3",
  playerDamage: "sounds/player_damage.mp3",
  playerDeath: "sounds/player_death.mp3",
  playerSpecialAtk: "sounds/player_special_atk.mp3",
  monsterAtk: "sounds/monster_atk.mp3",
  monsterDeath: "sounds/monster_death.mp3",
  chest: "sounds/chest.mp3",
  trap: "sounds/trap.mp3",
  walk: "sounds/walk.mp3",
  potion: "sounds/potion.mp3",
  gameMusic: "sounds/game_music.mp3",
  menuMusic: "sounds/menu_music.mp3",
};

// Função auxiliar para carregar os áudios
const createAudio = (src, loop = false) => {
  const a = new Audio(src);
  a.loop = loop;
  return a;
};
const gameMusic = createAudio(SOUNDS.gameMusic, true);
const menuMusic = createAudio(SOUNDS.menuMusic, true);
// Reproduzir efeitos sonoros
const playSound = (src) => {
  try {
    new Audio(src).play();
  } catch (e) {}
};
// Reproduzir musica do jogo
const playMusicGame = () => {
  try {
    menuMusic.pause();
    gameMusic.play();
  } catch (e) {}
};
// Reproduzir musica do menu
const playMusicMenu = () => {
  try {
    gameMusic.pause();
    menuMusic.play();
  } catch (e) {}
};

// Estado inicial jogador
const PLAYER_INITIAL = {
  hp: 20,
  maxHp: 20,
  ac: 5,
  attackBonus: 5,
  deaths: 0,
  potions: 3,
  gold: 0,
  currentRoom: 0,
  lastRoomTypes: [],
};

/* --- Tipos de Monstros ---*/
const MONSTER = {
  fraco: [
    { name: "Porco do Mato", image: "images/monster/porco-do-mato.webp" },
    { name: "Cachorro Doido", image: "images/monster/cachorro-doido.webp" },
    { name: "Guabiru", image: "images/monster/guabiru.webp" },
    { name: "Cobra Cascavel", image: "images/monster/cobra-cascavel.webp" },
    { name: "Escorpião", image: "images/monster/escorpiao.webp" },
  ],
  normal: [
    { name: "Jaguatitica", image: "images/monster/jaguatirica.webp" },
    { name: "Gato Maracajá", image: "images/monster/gato-maracaja.webp" },
    { name: "Cabeça de Cuia", image: "images/monster/cabeca-de-cuia.webp" },
    { name: "Visage", image: "images/monster/visage.webp" },
    { name: "Saci Pererê", image: "images/monster/saci-perere.webp" },
  ],
  elite: [
    { name: "Caipora", image: "images/monster/caipora.webp" },
    { name: "Corpo Seco", image: "images/monster/corpo-seco.webp" },
    { name: "Cabra Cabriola", image: "images/monster/cabra-cabriola.webp" },
    { name: "Lobisomem", image: "images/monster/lobisomen.webp" },
    { name: "Boitatá", image: "images/monster/boitata.webp" },
  ],
};

const BOSS = [
  { name: "Curupira", image: "images/monster/curupira.webp" },
  { name: "Cuca", image: "images/monster/cuca.webp" },
  { name: "Mula sem Cabeça", image: "images/monster/mula-sem-cabeca.webp" },
];

/* --- Frases diversas quando o jogador encontra ou derrota o inimigo */
const PHRASES = {
  appear: [
    {
      part1: "O silêncio da noite quebrou,",
      part2: "logo se mostrou!",
    },
    {
      part1: "O mato guarda assombro e dor,",
      part2: "traz o terror!",
    },
    {
      part1: "O mato sussurra segredo,",
      part2: "vem sem medo!",
    },
  ],
  defeated: [
    {
      text: "foi derrotado!",
    },
    {
      text: "sucumbiu!",
    },
    {
      text: "está acabado!",
    },
  ],

  death: [
    {
      text: "O homem caiu na noite, e só a fera tomou açoite.",
    },
    {
      text: "O chão abraçou seu corpo, a maldição cumpriu o acordo.",
    },
    {
      text: "Nem a força, nem a reza, só a morte o atravessa.",
    },
  ],
};

// Estado global do jogo
let player = { ...PLAYER_INITIAL };
let currentMonster = null;
let playerDodging = false;
let gameRooms = {};
let messageQueue = [];
let processingMessages = false;
let waitingForAction = false;
let currentRoomData = { number: 0, type: ROOM_TYPES.EMPTY };
let tempMessage = "";
let turnsToSpecial = 0;
let deaths = 0;
let isPlayerDamage = false;
let isSpecialAtk = false;

/* --- Cache de elementos DOM (auxuliar) ---*/
const getEl = (id) => document.getElementById(id);

// Telas
const splashScreen = getEl("splash-screen");
const menuScreen = getEl("menu-screen");
const storyScreen = getEl("story-screen");
const gameScreen = getEl("game-screen");
const gameOverScreen = getEl("game-over-screen");
const creditsScreen = getEl("credits-screen");
const aboutScreen = getEl("about-screen");
const instructionsScreen = getEl("instructions-screen");
const strengthenModal = getEl("strengthen-modal");
const eraseModal = getEl("erase-modal");

// Botões
const startButton = getEl("btn-start");
const continueButton = getEl("btn-continue");
const aboutButton = getEl("btn-about");
const instructionsButton = getEl("btn-instructions");
const deleteDataButton = getEl("btn-delete-data");
const startGameButton = getEl("btn-start-game");
const attackButton = getEl("btn-attack");
const specialAtkButton = getEl("btn-esp-atk");
const dodgeButton = getEl("btn-dodge");
const leftButton = getEl("btn-left");
const rightButton = getEl("btn-right");
const openChestButton = getEl("open-action-button");
const ignoreChestButton = getEl("ignore-action-button");
const liftActionButton = getEl("lift-action-button");
const observeActionButton = getEl("observe-action-button");
const potionButton = getEl("btn-potion");
const restartButton = getEl("btn-restart");
const creditsMenuButton = getEl("btn-credits-menu");
const aboutMenuButton = getEl("btn-about-menu");
const instructionsMenuButton = getEl("btn-instructions-menu");
const strengthenButton = getEl("btn-strengthen");
const saveContinueButton = getEl("btn-save-continue");
const continueSavedButton = getEl("btn-continue-saved");
const upgradeAttackButton = getEl("btn-upgrade-attack");
const upgradeDefenseButton = getEl("btn-upgrade-defense");
const upgradeHpButton = getEl("btn-upgrade-hp");
const closeModalButton = getEl("btn-close-modal");
const btnPotion = getEl("btn-potion");

// UI do jogo
const playerHpEl = getEl("player-hp");
const playerMaxHpEl = getEl("player-max-hp");
const playerAcEl = getEl("player-ac");
const playerDamageEl = getEl("player-damage");
const playerGoldEl = getEl("player-gold");
const potionCountEl = getEl("potion-count");
const monsterNameEl = getEl("monster-name");
const roomNumberEl = getEl("room-number");
const roomElementEl = getEl("room-element");
const imageMonster = getEl("image-monster");
const logAreaEl = getEl("log-area");
const orientationText = getEl("orientation");
const actionButtons = getEl("action-buttons");
const exploreButtons = getEl("explore-buttons");
const trapButtons = getEl("trap-buttons");
const chestButtons = getEl("chest-buttons");
const safeRoomButtons = getEl("safe-room-buttons");
const continueButtons = getEl("continue-buttons");
const bonusDamageEl = getEl("damage-bonus");

// Botões do modal "Apagar dados"
const confirmOptions = getEl("confirm-options");
const okOptions = getEl("ok-buttons");
const eraseOptions = getEl("erase-options");

/* --- Listeners: conectar botões do jogo com suas funções correspondentes ---*/
const connectListeners = () => {
  if (splashScreen)
    splashScreen.addEventListener("click", () => {
      showScreen(menuScreen);
      playMusicMenu();
    });
  // Menu
  if (startButton) startButton.addEventListener("click", startNewGame);
  if (continueButton) continueButton.addEventListener("click", continueGame);
  if (aboutButton)
    aboutButton.addEventListener("click", () => showScreen(aboutScreen));
  if (instructionsButton)
    instructionsButton.addEventListener("click", () =>
      showScreen(instructionsScreen)
    );
  if (deleteDataButton)
    deleteDataButton.addEventListener("click", deleteAllData);

  // História
  if (startGameButton)
    startGameButton.addEventListener("click", startGameFromStory);

  // Jogo
  if (leftButton)
    leftButton.addEventListener("click", () => moveToNextRoom("left"));
  if (rightButton)
    rightButton.addEventListener("click", () => moveToNextRoom("right"));
  if (attackButton)
    attackButton.addEventListener("click", () => playerAttack(false));
  if (specialAtkButton)
    specialAtkButton.addEventListener("click", () => playerAttack(true));
  if (dodgeButton) dodgeButton.addEventListener("click", playerDodge);
  if (potionButton) potionButton.addEventListener("click", usePotion);
  if (openChestButton) openChestButton.addEventListener("click", openChest);
  if (ignoreChestButton)
    ignoreChestButton.addEventListener("click", ignoreChest);
  if (liftActionButton) liftActionButton.addEventListener("click", liftAction);
  if (observeActionButton)
    observeActionButton.addEventListener("click", observeAction);

  // Sala segura
  if (strengthenButton)
    strengthenButton.addEventListener("click", showStrengthenModal);
  if (saveContinueButton)
    saveContinueButton.addEventListener("click", saveAndContinue);
  if (continueSavedButton)
    continueSavedButton.addEventListener("click", continueAfterSaving);

  // Modal de fortalecimento
  if (upgradeAttackButton)
    upgradeAttackButton.addEventListener("click", () =>
      upgradeAttribute("attack")
    );
  if (upgradeDefenseButton)
    upgradeDefenseButton.addEventListener("click", () =>
      upgradeAttribute("defense")
    );
  if (upgradeHpButton)
    upgradeHpButton.addEventListener("click", () => upgradeAttribute("hp"));
  if (closeModalButton)
    closeModalButton.addEventListener("click", hideStrengthenModal);

  // Fim de Jogo e Créditos
  if (restartButton)
    restartButton.addEventListener("click", () => initializeGame());
  if (creditsMenuButton)
    creditsMenuButton.addEventListener("click", () => showScreen(menuScreen));
  if (aboutMenuButton)
    aboutMenuButton.addEventListener("click", () => showScreen(menuScreen));
  if (instructionsMenuButton)
    instructionsMenuButton.addEventListener("click", () =>
      showScreen(menuScreen)
    );
};

/* --- Sistema de fila e proecessamento de mensagens ---*/
const addMessage = (message) => {
  messageQueue.push(message);
  tempMessage = message;
  if (!processingMessages) processMessageQueue();
};

function processMessageQueue() {
  if (messageQueue.length === 0) {
    processingMessages = false;
    if (waitingForAction) {
      showAppropriateActions();
    }
    return;
  }

  processingMessages = true;
  const message = messageQueue.shift();
  if (logAreaEl) logAreaEl.innerText = message;
  hideAllActions(); //Esconde todos os boões quando as mensdagnes estão sendo geradas/exibidas
  setTimeout(processMessageQueue, MESSAGE_DELAY); //Delay entre mensagens para dar tempo do jogador ler
}

/* --- Funções axiliares para a exibição e atualização da UI ---*/
// Esconde e reseta todas as ações
const hideAllActions = () => {
  [
    actionButtons,
    exploreButtons,
    trapButtons,
    chestButtons,
    safeRoomButtons,
    continueButtons,
  ].forEach((el) => {
    if (el) el.style.display = "none";
  });
  //if (btnPotion) btnPotion.disabled = true;
  if (orientationText) orientationText.textContent = "";
};

// Mostra a ação correspondente após o processamento de mensagens
const showActions = (buttonsEl, text) => {
  if (processingMessages) return;
  hideAllActions();
  if (orientationText) orientationText.textContent = text;
  if (buttonsEl) buttonsEl.style.display = "flex";
};

// Desabilita o botão "Ataque Especial" quando estiver aguandado os turnos de espera
const disableSpecialButton = () => {
  if (!specialAtkButton) return;
  specialAtkButton.style.pointerEvents = "none";
  specialAtkButton.style.opacity = 0.5;
  specialAtkButton.innerHTML = `<img class="btn-image" src="images/ui/timer.webp" alt=""/> ESPERE ( ${
    turnsToSpecial + 1
  } )`;
};
// Habilita o botão "Ataque Especial" quando os turnos de espara acabarem
const enableSpecialButton = () => {
  if (!specialAtkButton) return;
  specialAtkButton.style.pointerEvents = "auto";
  specialAtkButton.style.opacity = 1;
  specialAtkButton.innerHTML = `<img class="btn-image" src="images/ui/special-attack.webp" alt=""/> DILACERAR`;
};

/* --- Gerenciamento de Telas ---*/
const showScreen = (screen) => {
  [
    splashScreen,
    menuScreen,
    storyScreen,
    gameScreen,
    gameOverScreen,
    creditsScreen,
    aboutScreen,
    instructionsScreen,
  ].forEach((scr) => {
    // Esconder todas as telas
    if (scr) scr.style.display = "none";
  });
  if (!screen) return;
  // Mostrar a tela solicitada
  screen.style.display = "block";
};

/* --- Gerenciamento do armazenamento de dados salvos do jogo ---*/
// Salvar os dados das salas no armazenamento
const saveRoomsToStorage = () =>
  localStorage.setItem("saveGameRooms", JSON.stringify(gameRooms));
// Carregar os dados das salas no armazenamento
const loadRoomsFromStorage = () => {
  const save = localStorage.getItem("saveGameRooms");
  return save ? JSON.parse(save) : null;
};
// Verificar se existe jogo salvo em sala segura
const saveSafeGame = (data) =>
  localStorage.setItem("gameSafeSave", JSON.stringify(data));
const loadSafeGame = () => {
  const save = localStorage.getItem("gameSafeSave");
  let data;
  // Verifica se os dados salvos são válidos
  try {
    data = save ? JSON.parse(save) : null;
  } catch (error) {
    // Se houver algum erro, define os dados salvos como nulos e impede o jogo de ser carregado
    data = null;
  }
  return data; //Carrega os dados salvos se houver e se forem válidos
};
// Remover todos os dados salvos
const removeSaveGame = () => {
  removeDataGame();
  localStorage.removeItem("gameSafeSave");
};

// Remover apenas os dados salvos da sala, sem remover os save do jogador
const removeDataGame = () => {
  localStorage.removeItem("saveGameRooms");
};

// Resetar as salas salas caso o jogador tenha algum dado de sala salva
const resetGameRooms = () => {
  generateAllRooms();
  saveRoomsToStorage();
};

/* --- Inicialização do jogo ---*/
function initializeGame() {
  // Carregar ou gerar salas
  const rooms = loadRoomsFromStorage();
  if (rooms) gameRooms = rooms;
  else {
    resetGameRooms();
  }

  // Verificar save em sala segura, se hover, o botão continuar será exibido
  const saved = loadSafeGame();
  if (saved) {
    // Verifica a quantidade de mortes
    deaths = saved.deaths || 0;
    if (saved.currentRoom > 0) {
      continueButton.disabled = false;
      continueButton.style.display = "block";
    } else {
      continueButton.disabled = true;
      continueButton.style.display = "none";
    }
  } else {
    continueButton.disabled = true;
    continueButton.style.display = "none";
  }

  // Iniciar com a tela adequada
  playMusicMenu();
  showScreen(menuScreen);
}

/* --- Iniciar novo jogo / continuar jogo ---*/
function startNewGame() {
  // "Meta-progresso" por número de mortes (torna personagem ligeiramente mais forte)
  // Mecanica semelhante a um jogo "Rogue-like"
  player = {
    ...PLAYER_INITIAL,
    ac: PLAYER_INITIAL.ac + deaths,
    attackBonus: PLAYER_INITIAL.attackBonus + deaths,
    hp: PLAYER_INITIAL.hp + deaths,
    maxHp: PLAYER_INITIAL.maxHp + deaths,
    lastRoomTypes: [],
  };
  currentMonster = null;
  playerDodging = false;
  messageQueue = [];
  processingMessages = false;
  waitingForAction = false;

  // Recria e salva as salas, caso o jogador tenha dados salvos para iniciar um novo jogo diferente do anterior
  resetGameRooms();

  // Mostrar a tela de história
  showScreen(storyScreen);
  playMusicGame();
}

function continueGame() {
  const saved = loadSafeGame();
  if (!saved) return;
  player = { ...saved };
  // Converter sala segura em vazia para evitar salvar novamente
  if (SAFE_ROOMS.includes(player.currentRoom)) {
    gameRooms[player.currentRoom] = ROOM_TYPES.EMPTY;
    saveRoomsToStorage();
  }
  showScreen(gameScreen);
  playMusicGame();
  updateUI();

  // Definir o tipo da sala atual como vazia para garantir que apenas as opções de direção apareçam
  currentRoomData = { number: player.currentRoom, type: ROOM_TYPES.EMPTY };
  addMessage(
    "O herói desperta no recanto seguro, na mata calma, sem nenhum apuro."
  );
  waitingForAction = true;
}
// Iniciar o jogo apartir da tela inicial da história
function startGameFromStory() {
  showScreen(gameScreen);
  updateUI();
  enterRoom(0);
}

/* --- Apagar dados salvos e Gerenciar o modal "Apagar dados" ---*/
function deleteAllData() {
  if (!eraseModal) return;
  eraseModal.style.display = "flex";

  // Botões e listeners do modal
  const btnYes = getEl("btn-yes");
  const btnNo = getEl("btn-no");
  const btnEraseYes = getEl("btn-erase-yes");
  const btnEraseNo = getEl("btn-erase-no");
  const btnOk = getEl("btn-ok");

  const onYes = () => {
    if (confirmOptions) confirmOptions.style.display = "none";
    if (eraseOptions) eraseOptions.style.display = "block";
  };
  const onEraseYes = () => {
    removeSaveGame();
    generateAllRooms();
    saveRoomsToStorage();
    if (continueButton) {
      continueButton.disabled = true;
      continueButton.style.display = "none";
    }
    if (eraseOptions) eraseOptions.style.display = "none";
    if (okOptions) okOptions.style.display = "flex";
  };
  const onOk = () => {
    initializeGame();
    resetEraseModal();
  };
  const onNo = () => resetEraseModal();

  if (btnYes) {
    btnYes.onclick = onYes;
  }
  if (btnEraseYes) {
    btnEraseYes.onclick = onEraseYes;
  }
  if (btnEraseNo) {
    btnEraseNo.onclick = onNo;
  }
  if (btnNo) {
    btnNo.onclick = onNo;
  }
  if (btnOk) {
    btnOk.onclick = onOk;
  }
}

// Reseta o modal
function resetEraseModal() {
  if (!eraseModal) return;
  eraseModal.style.display = "none";
  if (confirmOptions) confirmOptions.style.display = "block";
  if (eraseOptions) eraseOptions.style.display = "none";
  if (okOptions) okOptions.style.display = "none";
}

/* --- Atualização da UI do jogo --- */
function updateUI() {
  if (playerHpEl) playerHpEl.textContent = player.hp;
  if (playerMaxHpEl) playerMaxHpEl.textContent = player.maxHp;
  if (playerAcEl) playerAcEl.textContent = player.ac;
  if (playerDamageEl) playerDamageEl.textContent = player.attackBonus;
  if (playerGoldEl) playerGoldEl.textContent = player.gold;
  if (potionCountEl) potionCountEl.textContent = player.potions;
  if (roomNumberEl) roomNumberEl.textContent = player.currentRoom;

  //Exibe a imagem e o nome correto do monstro
  if (currentMonster) {
    monsterNameEl.style.opacity = 1;
    monsterNameEl.textContent = currentMonster.name;
  } else {
    monsterNameEl.textContent = "";
    monsterNameEl.style.opacity = 0;
  }
  // Atualiza a classe do elemento da sala
  if (roomElementEl) {
    roomElementEl.className = "room-element";
    if (currentRoomData.type) roomElementEl.classList.add(currentRoomData.type);
  }
}

// Mostra ações apropriadas baseado no tipo de sala
const showAppropriateActions = () => {
  waitingForAction = false;
  switch (currentRoomData.type) {
    case ROOM_TYPES.EMPTY: // Sala vazia
      return showActions(exploreButtons, "Pra onde ir?");
    case ROOM_TYPES.MONSTER: // Sala com monstro ou boss
    case ROOM_TYPES.BOSS:
      return currentMonster && currentMonster.hp > 0
        ? turnsToSpecial > 0
          ? (turnsToSpecial--,
            disableSpecialButton(),
            showActions(actionButtons, "O que fazer?"))
          : (enableSpecialButton(), showActions(actionButtons, "O que fazer?"))
        : showActions(exploreButtons, "Pra onde ir?");
    case ROOM_TYPES.CHEST: // Sala com butija
      waitingForAction = true;
      return showActions(chestButtons, "O que fazer?");
    case ROOM_TYPES.TRAP: // Sala com armadilha
      waitingForAction = true;
      return showActions(trapButtons, "O que fazer?");
    case ROOM_TYPES.SAFE: // Sala segura
      return showActions(safeRoomButtons, "O que fazer?");
    case ROOM_TYPES.PROTECTED: // Após salvar se torna uma sala do tipo "PROTEGIDA"
      return showActions(continueButtons, "O que fazer?");
    default:
      return showActions(exploreButtons, "Pra onde ir?");
  }
};

/* --- Lógica das Salas --- */
// Gerar as salas
function generateAllRooms() {
  gameRooms = {};
  // Pré-definir salas fixas
  gameRooms[0] = ROOM_TYPES.EMPTY; // Sala inical
  gameRooms[BOSS_ROOM] = ROOM_TYPES.BOSS; // Sala do boss
  // Garantir que as salas seguras sejam sempre do tipo SAFE
  for (const r of SAFE_ROOMS) gameRooms[r] = ROOM_TYPES.SAFE;
  // Sala 49 (antes do boss) sempre é baú
  gameRooms[BOSS_ROOM - 1] = ROOM_TYPES.CHEST;
  // Gerar as outras salas aleatoriamente
  for (let i = 1; i < BOSS_ROOM; i++) {
    if (gameRooms[i] === undefined) gameRooms[i] = null;
  }
}

// --- Determinar tipo da sala ---
function determineRoomType(roomNumber) {
  if (roomNumber === 0) return ROOM_TYPES.EMPTY; // Sala inicial é sempre vazia
  if (roomNumber === BOSS_ROOM) return ROOM_TYPES.BOSS;
  if (SAFE_ROOMS.includes(roomNumber)) return ROOM_TYPES.SAFE;
  if (roomNumber === BOSS_ROOM - 1) return ROOM_TYPES.CHEST; // Sala 49 sempre é baú

  // Verificar as últimas salas visitadas para aplicar as regras de sequência
  const lastTwo = player.lastRoomTypes.slice(-2);

  // Regra: Após 2 monstros ou monstro + armadilha ou armadilha + armadilha, próxima sala é baú
  const isMonsterOrTrap = (t) =>
    t === ROOM_TYPES.MONSTER || t === ROOM_TYPES.TRAP;
  if (
    lastTwo.length >= 2 &&
    isMonsterOrTrap(lastTwo[0]) &&
    isMonsterOrTrap(lastTwo[1])
  ) {
    return ROOM_TYPES.CHEST;
  }

  // Regra: Após sala vazia ou baú, próxima sala é monstro (chance 85%) ou armadilha (chance 15%)
  if (player.lastRoomTypes.length > 0) {
    const last = player.lastRoomTypes[player.lastRoomTypes.length - 1];
    if (last === ROOM_TYPES.EMPTY || last === ROOM_TYPES.CHEST) {
      return Math.random() < 0.85 ? ROOM_TYPES.MONSTER : ROOM_TYPES.TRAP;
    }
  }

  // Para outras situações, usar a tabela de probabilidades padrão
  const total = ROOM_PROBABILITIES.reduce((sum, room) => sum + room.weight, 0);
  let random = Math.random() * total;
  for (const room of ROOM_PROBABILITIES) {
    if (random < room.weight) return room.type;
    random -= room.weight;
  }
  return ROOM_TYPES.MONSTER;
}

// Essa função gera e  salva todas as salas geradas no jogo, garantindo que cada tipo de sala apareça apropriadamente ao jogador
// Evitando que o jogo seja facilitado ou dificultado demais garantindo uma experinecia equlibrada e justa
function generateRoomType(roomNumber) {
  // Garantir que as salas 15, 30 e 45 sejam sempre salas seguras
  if (SAFE_ROOMS.includes(roomNumber)) {
    gameRooms[roomNumber] = ROOM_TYPES.SAFE;
    saveRoomsToStorage();
    return ROOM_TYPES.SAFE;
  }
  // Se a sala já foi pré-definida (as salas seguras e do boss), usar esse valor
  if (gameRooms[roomNumber] != null) return gameRooms[roomNumber];
  // Caso contrário, determinar o tipo e salvar
  const type = determineRoomType(roomNumber);
  gameRooms[roomNumber] = type;
  saveRoomsToStorage();
  return type;
}

/* --- Entrar na sala --- */
function enterRoom(roomNumber) {
  // Esconder todos os botões no início
  hideAllActions();

  player.currentRoom = roomNumber;
  const roomType = generateRoomType(roomNumber);
  const appear =
    PHRASES.appear[Math.floor(Math.random() * PHRASES.appear.length)];

  // Registrar o tipo da sala para as regras de sequência
  player.lastRoomTypes.push(roomType);
  if (player.lastRoomTypes.length > 5) player.lastRoomTypes.shift();

  // Atualizar dados da sala atual
  currentRoomData = { number: roomNumber, type: roomType };
  // Atualizar UI
  updateUI();

  // Lógica específica para cada tipo de sala
  switch (roomType) {
    case ROOM_TYPES.EMPTY: // Sala vazia
      addMessage(
        roomNumber === 0
          ? "Você abre os olhos e vê a estrada, dois caminhos seguem pela encruzilhada."
          : "Olhos atentos sem encontrar, nenhum assombro veio se mostrar."
      );
      break;
    case ROOM_TYPES.MONSTER: // Sala monstro
      currentMonster = generateMonster(roomNumber);
      addMessage(`${appear.part1} ${currentMonster.name} ${appear.part2}`);
      break;
    case ROOM_TYPES.BOSS: // Sala boos
      currentMonster = generateBoss();
      addMessage(`${appear.part1} ${currentMonster.name} ${appear.part2}`);
      break;
    case ROOM_TYPES.CHEST: // Sala butija
      imageMonster.src = "images/objects/butija.webp";
      addMessage("Na mata algo brilhou, uma butija você encontrou!");
      break;
    case ROOM_TYPES.TRAP: // Sala armadilha
      imageMonster.src = "images/objects/arapuca.webp";
      addMessage("Você caiu em uma apauca!");
      setTimeout(() => playSound(SOUNDS.playerDamage), 2000);
      // Aplicar dano da armadilha
      player.hp -= TRAP_DAMAGE;
      addMessage(`Você perdeu ${TRAP_DAMAGE} de vida!`);
      // Verificar se o jogador morreu
      if (player.hp <= 0) {
        player.hp = 0;
        updateUI();
        setTimeout(gameOver, 4000);
        return;
      }
      break;
    case ROOM_TYPES.SAFE: // Sala segura
      imageMonster.src = "images/objects/fogueira.webp";
      addMessage(
        "Neste recanto, seu peito sossegou, um lugar seguro você encontrou."
      );
      break;
  }

  // Atualizar UI
  updateUI();
  // Marcar que estamos esperando uma ação do jogador
  waitingForAction = true;
}

/* --- Movimento do jogador --- */
function moveToNextRoom(direction) {
  //Toca o efeito sonoro
  playSound(SOUNDS.walk);
  // Determinar o próximo número de sala
  let nextRoom = player.currentRoom;
  if (direction === "left")
    nextRoom = Math.min(player.currentRoom + 1, BOSS_ROOM);
  else nextRoom = Math.min(player.currentRoom + 2, BOSS_ROOM);
  // Entrar na próxima sala
  enterRoom(nextRoom);
}

/* --- Lógica de Combate --- */
// Jogar o dado (aleatório)
const rollDice = (sides) => Math.floor(Math.random() * sides) + 1;

// --- Combate: jogador ataca ---
function playerAttack(useSpecial = false) {
  if (processingMessages || !currentMonster) return;
  const specialVal = useSpecial ? 5 : 0;

  if (specialVal > 0) {
    turnsToSpecial += 3; // A cada uso do especial, adicionar 3 turnos para o próximo uso
    isSpecialAtk = true;
    addMessage("Você ataca furiosamente!");
  } else {
    isSpecialAtk = false;
    addMessage("Você ataca!");
  }

  // Rolar um d20 + player.attackBonus
  const attackRoll = rollDice(20);
  const attackTotal = attackRoll + player.attackBonus + specialVal;
  const damageBonus = Math.floor(player.attackBonus / 2);

  //Animação de ataque
  showAnimation("player");

  //Verifica se acertou
  if (attackTotal >= currentMonster.ac) {
    // Rolar o dano
    let damageRoll = rollDice(6);
    let damageTotal = damageRoll + damageBonus;

    if (attackRoll === 20) {
      // Ataque crítico - dobro do dano
      damageTotal *= 2;
      addMessage(`CRÍTICO! você causa ${damageTotal} de dano ao inimigo!`);
    } else if (attackTotal === currentMonster.ac) {
      // Ataque igual à CA do monstro - causa apenas metade do dano (de raspão)
      damageTotal = Math.floor(damageTotal / 2);
      addMessage(`De raspão! você causa ${damageTotal} de dano ao inimigo.`);
    } else if (
      attackTotal >=
      currentMonster.ac + Math.ceil(currentMonster.ac * 0.5)
    ) {
      // Se o ataque supera a CA do monstro + 50% - dano aumentado em 50%
      // Exemplo: Se a CA do monstro é 10 e o ataque total do jogado d20 + player.attackBonus for igual ou maior que 15
      // Então isso é o dano é 50% maior que a CA do monstro, logo o aatque causa 50% a mais de dano
      damageTotal = Math.floor(damageTotal * 1.5);
      addMessage(`Golpe forte! você causa ${damageTotal} de dano ao inimigo!`);
    } else {
      // Dano normal
      addMessage(`Você causa ${damageTotal} de dano ao inimigo.`);
    }

    currentMonster.hp -= damageTotal + specialVal;

    // Verifica se o mostro morreu
    if (currentMonster.hp <= 0) {
      currentMonster.hp = 0;
      const defeat =
        PHRASES.defeated[Math.floor(Math.random() * PHRASES.defeated.length)];
      addMessage(`${currentMonster.name} ${defeat.text}`);
      monsterDefeated();
      return;
    }
  } else {
    addMessage("Você errou!");
  }

  // Turno do monstro após um delay
  setTimeout(() => monsterTurn(), MESSAGE_DELAY * 2);
}

/*--- Jogador esquiva/desvia do ataque ---*/
function playerDodge() {
  if (processingMessages) return;
  addMessage("Você se prepara para desviar!");
  playerDodging = true;
  setTimeout(() => monsterTurn(), 3000);
}

/* --- Turno do monstro --- */
function monsterTurn() {
  if (!currentMonster || currentMonster.hp <= 0) return;
  //Animação de ataque do monstro
  showAnimation("monster");

  // Ataque do monstro
  // Calcular CA efetiva do jogador (considerando esquiva)
  const effectivePlayerAC = player.ac + (playerDodging ? 5 : 0);

  const attackRoll = rollDice(20);
  const attackTotal = attackRoll + currentMonster.attackBonus;

  addMessage(`${currentMonster.name} te ataca!`);

  // Verifica se o ataque acerta
  if (attackTotal >= effectivePlayerAC) {
    // Define que o jogador levou um dano
    isPlayerDamage = true;
    // Calcula o dano
    let damageRoll = rollDice(6);
    let damageTotal = damageRoll + currentMonster.damageBonus;

    //A lógica de dano é exatamente igual ao do jogador
    if (attackRoll === 20) {
      damageTotal *= 2;
      addMessage(`CRÍTICO! você perde ${damageTotal} de vida!`);
    } else if (attackTotal === effectivePlayerAC) {
      damageTotal = Math.floor(damageTotal / 2);
      addMessage(`De raspão! você perde ${damageTotal} de vida.`);
    } else if (
      attackTotal >=
      effectivePlayerAC + Math.ceil(effectivePlayerAC * 0.5)
    ) {
      damageTotal = Math.floor(damageTotal * 1.5);
      addMessage(`Golpe forte! você perde ${damageTotal} de vida!`);
    } else {
      addMessage(`Acerto! você perde ${damageTotal} de vida.`);
    }

    player.hp -= damageTotal;

    // Verifica se o jogador morreu
    if (player.hp <= 0) {
      player.hp = 0;
      setTimeout(() => {
        updateUI();
        // Tocar som de morte do jogador
        playSound(SOUNDS.playerDeath);
      }, MESSAGE_DELAY * 2);
      setTimeout(gameOver, MESSAGE_DELAY * 2);
      return;
    }
  } else {
    isPlayerDamage = false;
    // Verifica se o jogador desvia
    if (playerDodging) addMessage("Você desviou do ataque!");
    else addMessage(`${currentMonster.name} errou!`);
  }

  // Resetar os estado do jogador
  playerDodging = false;

  setTimeout(updateUI, MESSAGE_DELAY * 2);
  // Retornar o controle ao jogador
  waitingForAction = true;
}

/* --- Quando monstro morre: gerar loot e limpar sala --- */
function monsterDefeated() {
  setTimeout(() => {
    showAnimation("object");
    //Toca o som de morte do monstro
    playSound(SOUNDS.monsterDeath);
    monsterNameEl.textContent = "";
    monsterNameEl.style.opacity = 0;
  }, MESSAGE_DELAY * 2);

  if (currentMonster.type === "boss") {
    setTimeout(victory, MESSAGE_DELAY * 3);
    return;
  }

  // Determinar loot baseado no tipo do monstro
  let goldAmount = 0;
  let potionChance = 0;
  switch (currentMonster.type) {
    case "fraco":
      goldAmount = Math.floor(Math.random() * 5) + 5; // 5-10 de grana
      potionChance = 0.1; // 10% chance de vir poção
      break;
    case "normal":
      goldAmount = Math.floor(Math.random() * 5) + 10; // 10-15 de grana
      potionChance = 0.2; // 20% chance de vir poção
      break;
    case "elite":
      goldAmount = Math.floor(Math.random() * 10) + 10; // 10-20 de grana
      potionChance = 0.3; // 30% chance de vir poção
      break;
  }

  // Adicionar dinheiro ao jogador
  player.gold += goldAmount;
  let tempMessage = `Você achou ${goldAmount} patacas!`;

  //Chance de achar um aluá
  if (Math.random() < potionChance) {
    player.potions += 1;
    tempMessage += `\n E uma garrafa cheia de aluá!`;
  }

  addMessage(tempMessage);

  currentMonster = null;
  waitingForAction = true;
  setTimeout(updateUI, MESSAGE_DELAY * 4);
}

/* --- Mostrar animações --- */
function showAnimation(kind) {
  setTimeout(() => {
    switch (kind) {
      case "player":
        imageMonster.classList.add("zoomOut");
        if (isSpecialAtk) playSound(SOUNDS.playerSpecialAtk);
        else playSound(SOUNDS.playerAtk);
        break;
      case "monster":
        imageMonster.classList.add("zoomIn");
        if (isPlayerDamage) playSound(SOUNDS.playerDamage);
        else playSound(SOUNDS.monsterAtk);
        break;
      case "object":
        imageMonster.classList.add("gone");
        setTimeout(() => {
          imageMonster.src = "";
        }, 1000);
        break;
      case "damage":
        playSound(SOUNDS.playerDamage);
        break;
    }
  }, 500);

  // Remove classes (garantia)
  imageMonster.classList.remove("zoomIn", "zoomOut", "gone");
}

/* --- Usar poção (aluá) --- */
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
  const healedLife = Math.min(healAmount, player.maxHp - player.hp);
  player.hp = Math.min(player.hp + healAmount, player.maxHp);
  addMessage(`Você bebeu um aluá! curou ${healedLife} de vida.`);
  playSound(SOUNDS.potion);
  updateUI();
  waitingForAction = true;
}

/* --- Funções Game Over / Vitória ---*/
function gameOver() {
  const death = PHRASES.death[Math.floor(Math.random() * PHRASES.death.length)];
  addMessage(`${death.text}`);
  // Salvar mortes para "meta-progresso" (rogue-like)
  saveSafeGame({ ...PLAYER_INITIAL, deaths: deaths + 1, currentRoom: 0 });
  removeDataGame(); // Remover salas geradas

  // Mostrar tela de game over
  setTimeout(() => {
    imageMonster.src = "";
    showScreen(gameOverScreen);
    playMusicMenu();
  }, MESSAGE_DELAY * 3);
}

function victory() {
  addMessage(
    "Raiou o dia, dissipou a noite escura, o você segue vivo, com força e bravura."
  );
  setTimeout(() => {
    getEl("room").style.backgroundImage = "url('images/ui/forest-color.webp')";
    gameMusic.pause();
  }, MESSAGE_DELAY);

  // Mostrar tela de créditos
  setTimeout(() => {
    showScreen(creditsScreen);
    // Mostra a pontuação final do jogador baseado em suas mortes, quanto menos mortes, mais estrelas
    const stars = Math.max(6 - Math.floor(deaths / 2), 1);
    for (i = 0; i < stars; i++) {
      getEl(
        "stars"
      ).innerHTML += ` <img src="images/ui/star.webp" class="star"/>`;
    }
    //removeSaveGame(); // Remover os dados salvos do jogador
    playMusicMenu(); // Tocar a musica do menu
  }, MESSAGE_DELAY * 4);
}

/* --- Lógica para gerar monstros / boss ---*/
// Randomiza os monstros
function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMonster(roomNumber) {
  // Determina o tipo do monstro baseado no número da sala
  let monsterType = "fraco";
  if (roomNumber >= 30) monsterType = "elite";
  else if (roomNumber >= 10) monsterType = "normal";

  // Gerar estatísticas do monstro baseado no tipo
  let monsterStats;
  if (monsterType === "fraco") {
    monsterStats = {
      hp: Math.floor(Math.random() * 3) + 12, // 12-14 HP
      maxHp: 14,
      ac: Math.floor(Math.random() * 3) + 12, // 12-14 CA (defesa)
      attackBonus: Math.floor(Math.random() * 3) + 2, // 2-4 Bonus de Ataque
      damageBonus: Math.floor(Math.random() * 2) + 1, // 1-2 Bonus de Dano
    };
  } else if (monsterType === "normal") {
    monsterStats = {
      hp: Math.floor(Math.random() * 10) + 15, // 15-24 HP
      maxHp: 24,
      ac: Math.floor(Math.random() * 3) + 14, // 14-16 CA (defesa)
      attackBonus: Math.floor(Math.random() * 2) + 5, // 5-6 Bonus de Ataque
      damageBonus: Math.floor(Math.random() * 2) + 2, // 2-3 Bonus de Dano
    };
  } else {
    monsterStats = {
      hp: Math.floor(Math.random() * 15) + 26, // 26-40 HP
      maxHp: 40,
      ac: Math.floor(Math.random() * 3) + 16, // 16-18 CA (defesa)
      attackBonus: Math.floor(Math.random() * 2) + 7, // 7-8 Bonus de Ataque
      damageBonus: Math.floor(Math.random() * 2) + 3, // 3-4 Bonus de Dano
    };
  }

  // Escolher monstro aleatório e definir seu nome e imagem
  const pick = randFrom(MONSTER[monsterType]);
  if (imageMonster) imageMonster.src = pick.image;

  // Status do mostro definido
  return {
    name: pick.name,
    hp: monsterStats.hp,
    maxHp: monsterStats.maxHp,
    ac: monsterStats.ac,
    attackBonus: monsterStats.attackBonus,
    damageBonus: monsterStats.damageBonus,
    type: monsterType,
  };
}

//Gerar o boss do jogo
function generateBoss() {
  const pick = randFrom(BOSS);
  if (imageMonster) imageMonster.src = pick.image;
  return {
    name: pick.name,
    hp: Math.floor(Math.random() * 2) + 78, // 78-80 HP
    maxHp: 80,
    ac: 20, // 20 CA (defesa)
    attackBonus: Math.floor(Math.random() * 3) + 12, // 12-14 Bonus de Ataque
    damageBonus: Math.floor(Math.random() * 3) + 7, // 7-10 Bonus de Dano
    type: "boss",
  };
}

/* --- Lógica de baús (butija) --- */
// Abrir baú
function openChest() {
  // Determinar o tipo do baú
  const roll = Math.random() * 100;
  let chestType = "normal";
  if (roll >= 95) chestType = "lendario";
  else if (roll >= 85) chestType = "raro";

  // Gerar o loot do baú com base no tipo
  const loot = generateChestLoot(chestType);
  showAnimation("object");
  // Tocar o som do baú
  playSound(SOUNDS.chest);
  // Aplicar o loot ao jogador
  applyLoot(loot);
  // Marcar o tipo da sala como vazia após abrir o baú
  currentRoomData.type = ROOM_TYPES.EMPTY;
  addMessage(tempMessage);
}

// Ignorar baú
function ignoreChest() {
  addMessage("Você decide não mexer na butija.");
  addMessage(tempMessage);
  //Animação de ignorar butija
  showAnimation("object");
  playSound(SOUNDS.walk);
  // Marcar o tipo da sala como vazia após ignorar o baú
  currentRoomData.type = ROOM_TYPES.EMPTY;
}

/* Logica das armadilhas (arapucas) */
// Levantar
function liftAction() {
  addMessage("Você se levanta com cuidado.");
  // Após levantar, a armadilha desaparece e a sala é marcada como vazia
  // Animação de sair da armadilha
  showAnimation("object");
  playSound(SOUNDS.trap);
  setTimeout(() => {
    imageMonster.src = "";
  }, MESSAGE_DELAY * 1.5);
  roomElementEl.className = "room-element";
  currentRoomData.type = ROOM_TYPES.EMPTY;
  addMessage("Firmou o passo, seguiu adiante, na mata escura e constante.");
  addMessage(tempMessage);
}

// Apenas olha ao redor (não gera nenhuma ação)
function observeAction() {
  addMessage("Por aqui nemhum assombro se mostrou, só o vento que soprou.");
  addMessage(tempMessage);
}

/* --- Logica para aplicação dos loots ao jogador --- */
//Função para gerar loot baseado no tipo do baú
function generateChestLoot(type) {
  const roll = Math.random() * 100;
  // Retorna objeto do loot baseado no tipo de baú e numero aleatório sorteado
  switch (type) {
    case "normal":
      if (roll < 30) return { type: "potion", amount: 1 };
      if (roll < 60) return { type: "gold", amount: 20, gold: 20 };
      if (roll < 80) return { type: "common_armor" };
      if (roll < 90) return { type: "common_attack" };
      return { type: "common_hp" };
    case "raro":
      if (roll < 30) return { type: "potion", amount: 2, gold: 30 };
      if (roll < 60) return { type: "rare_armor", gold: 10 };
      if (roll < 90) return { type: "rare_attack", gold: 10 };
      return { type: "rare_hp", gold: 10 };
    case "lendario":
      if (roll < 30) return { type: "potion", amount: 3, gold: 50 };
      if (roll < 60) return { type: "legendary_armor", gold: 30 };
      if (roll < 90) return { type: "legendary_attack", gold: 30 };
      return { type: "legendary_hp", gold: 30 };
    default:
      return {};
  }
}

//Função para aplicar o loot ao jogador
function applyLoot(loot) {
  setTimeout(() => {
    imageMonster.src = "";
  }, MESSAGE_DELAY);

  if (!loot || !loot.type) return;

  switch (loot.type) {
    case "gold": // Achar dinheiro
      player.gold += loot.gold || loot.amount || 0;
      addMessage(`Você achou ${loot.amount || loot.gold} patacas!`);
      break;
    case "potion": // Achar poção
      player.potions += loot.amount || 1;
      addMessage(
        `Você achou ${loot.amount || 1} ${
          (loot.amount || 1) == 1 ? "garrafa" : "garrafas"
        } de aluá!`
      );
      break;
    //Aumenta a defesa baseado no tipo de loot (comum, raro e lendário)
    case "common_armor":
      player.ac += 1;
      addMessage("Você achou um tônico! \nSua defesa aumenta +1!");
      break;
    case "rare_armor":
      player.ac += 2;
      addMessage("Você achou um tônico amargo! \nSua defesa aumenta +2!");
      break;
    case "legendary_armor":
      player.ac += 3;
      addMessage("Você achou um tônico forte! \nSua defesa aumenta +3!");
      break;
    //Aumenta o HP baseado no tipo de loot (comum, raro e lendário)
    case "common_hp":
      player.maxHp += 3;
      player.hp += 3;
      addMessage("Você achou um elixir! \nSua vida máxima aumenta +3!");
      break;
    case "rare_hp":
      player.maxHp += 5;
      player.hp += 5;
      addMessage("Você achou um exlixir forte! \nSua vida máxima aumenta +5!");
      break;
    case "legendary_hp":
      player.maxHp += 10;
      player.hp += 10;
      addMessage("Você achou um exlixir santo! \nSua vida máxima aumenta +10!");
      break;
    //Aumenta o ataque baseado no tipo de loot (comum, raro e lendário)
    case "common_attack":
      player.attackBonus += 1;
      addMessage("Você achou um chá amargo! \nSeu ataque aumenta +1");
      break;
    case "rare_attack":
      player.attackBonus += 2;
      addMessage("Você achou um chá forte de raiz! \nSeu ataque aumenta +2");
      break;
    case "legendary_attack":
      player.attackBonus += 3;
      addMessage("Você achou um chá encantado! \nSeu ataque aumenta +3");
      break;
    default:
      // Nada
      break;
  }

  // Atualizar UI
  updateUI();
}

/* --- Logica da sala segura --- */
// Função salvar
function saveGameInSafeRoom() {
  saveSafeGame(player);
  addMessage("O fogo aquece, o sono vem, o fica jogo salvo também.");
}

// Função que salva o jogo e recupera a vida do jogador
function saveAndContinue() {
  // Recupera a vida do jogador
  player.hp = player.maxHp;
  saveGameInSafeRoom();
  updateUI();
  // Após salvar, marcar a sala como protegida
  currentRoomData.type = ROOM_TYPES.PROTECTED;
  waitingForAction = true;
}

// Função que é executada logo após salavar o jogo, mostrando as ações apropriadas para o jogador
function continueAfterSaving() {
  setTimeout(() => {
    imageMonster.src = "";
  }, MESSAGE_DELAY);
  addMessage(
    "O corpo renovado, o peito a brilhar, você segue pronto pra caminhar."
  );
  // Após salvar, marcar a sala como vazia para mostrar opções de direção
  currentRoomData.type = ROOM_TYPES.EMPTY;
  waitingForAction = true;
}

/* --- Lógica de fortalecimento (modal) ---*/
// Mostrar modal de fortalecimento
function showStrengthenModal() {
  // Verificar se o jogador tem dinheiro suficiente
  const hasEnoughGold = player.gold >= UPGRADE_COST;
  // Atualizar estado dos botões de upgrade
  if (upgradeAttackButton) upgradeAttackButton.disabled = !hasEnoughGold;
  if (upgradeDefenseButton) upgradeDefenseButton.disabled = !hasEnoughGold;
  if (upgradeHpButton) upgradeHpButton.disabled = !hasEnoughGold;
  // Exibir o modal
  strengthenModal.style.display = "flex";
}

// Esconder o modal
function hideStrengthenModal() {
  strengthenModal.style.display = "none";
}

// Fortalecer atributo
function upgradeAttribute(attribute) {
  // Verificar se o jogador tem dinheiro suficiente
  if (player.gold < UPGRADE_COST) {
    addMessage("Patacas insuficientes!");
    hideStrengthenModal();
    return;
  }

  // Remover o dinhero gasto do jogador
  player.gold -= UPGRADE_COST;
  // Aplicar o fortalecimento
  switch (attribute) {
    case "attack":
      player.attackBonus += 1;
      addMessage(
        `Seu ataque aumentou! (${player.attackBonus - 1} -> ${
          player.attackBonus
        })`
      );
      break;
    case "defense":
      player.ac += 1;
      addMessage(`Sua defesa aumentou! (${player.ac - 1} -> ${player.ac})`);
      break;
    case "hp":
      player.maxHp += 1;
      player.hp += 1;
      addMessage(
        `Sua vida máxima aumentou! (${player.maxHp - 1} -> ${player.maxHp})`
      );
      break;
    default:
      break;
  }
  // Fechar o modal
  hideStrengthenModal();
  updateUI();
  // Após fortalecer, retora à sala
  addMessage("Com energia nova a lhe guiar, você não vai fraquejar.");
  waitingForAction = true;
}

/* --- Inicialização --- */
document.addEventListener("DOMContentLoaded", () => {
  connectListeners();
  showScreen(splashScreen);
  // Foi necerssário utilizar esse código para garantir que a musica do menu seja executada.
  // Os navegadores não permitem que uma mídia seja executada automaticamente ao carregar uma página
  getEl("splash-screen").addEventListener("click", () => {
    initializeGame();
  });
});
