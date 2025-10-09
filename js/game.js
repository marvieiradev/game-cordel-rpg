// =================================================================
// MÓDULO DE GAME (LÓGICA DO JOGO)
// Responsabilidade: Gerenciar a lógica do jogo, estados, combate, salas e progresso
// =================================================================
import {
  ROOM_TYPES,
  ROOM_PROBABILITIES,
  SOUNDS,
  PLAYER_INITIAL,
  MONSTER,
  BOSS,
  GAME_PHRASES,
  BOSS_ROOM,
  SAFE_ROOMS,
  ANIM_DELAY,
  UPGRADE_COST,
  TRAP_DAMAGE,
  LOOT_TABLES,
  drawPhrases,
} from "./data.js";

import {
  DOM,
  showScreen,
  updateUI,
  playSound,
  playMusicMenu,
  playMusicGame,
  hideAllActions,
  addMessage,
  showAnimation,
  pauseAllMusics,
  hideBlessingModal,
} from "./ui.js";

// Estado global do jogo (centralizado)
export let gameState = {
  player: { ...PLAYER_INITIAL },
  currentMonster: null,
  gameRooms: {},
  currentRoomData: { number: 0, type: ROOM_TYPES.EMPTY },
  cpKey: 42,
  turnsToSpecial: 0,
  turnsToRoar: 0,
  deaths: 0,
  isPlayerDamage: false,
  isSpecialAtk: false,
  isMonsterScared: false,
  messageQueue: [],
  processingMessages: false,
  waitingForAction: false,
  movement: Math.floor(Math.random() * (2 - 1 + 1)) + 1,
  isPlayerDead: false,
  isPlayerVictory: false,
};

// Função simples de "criptografia" XOR para difcultar a manipulção dos dados salvos no armazenamento
// Para evitar a fácil alteração dos dados salvos do jogador, impedindo que o mesmo manipule o jogo
function encrypt(text) {
  const key = gameState.cpKey;
  return text
    .split("")
    .map((char) => char.charCodeAt(0) ^ key)
    .map((code) => code.toString(16).padStart(2, "0"))
    .join("");
}
// Função para "descriptografar"
function decrypt(hexString) {
  const key = gameState.cpKey;
  const codes = hexString.match(/.{1,2}/g).map((hex) => parseInt(hex, 16));
  return codes.map((code) => String.fromCharCode(code ^ key)).join("");
}
/* --- Gerenciamento do armazenamento de dados salvos do jogo ---*/
// Verificar se existe jogo salvo em sala segura
const saveGameData = (data) => {
  // Criptografa e salva os dados
  localStorage.setItem("saveGameData", encrypt(JSON.stringify(data)));
};
const loadGameData = () => {
  // Carrega e descriptografa
  const save = localStorage.getItem("saveGameData");
  let decrypted = save ? decrypt(save) : null;
  let data;
  // Verifica se os dados salvos são válidos
  try {
    data = save ? JSON.parse(decrypted) : null;
  } catch (error) {
    // Se houver algum erro, define os dados salvos como nulos e impede o jogo de ser carregado
    data = null;
  }
  return data; // Carrega os dados salvos se houver e se forem válidos
};
// Remover todos os dados salvos
const removeGameData = () => {
  localStorage.removeItem("saveGameData");
};

/* --- Inicialização do jogo ---*/
export function initializeGame() {
  // Gerar salas
  generateAllRooms();

  // Reseta os estados do jogo
  gameState.turnsToSpecial = 0;
  gameState.turnsToRoar = 0;
  gameState.deaths = 0;
  gameState.isMonsterScared = false;
  gameState.isPlayerDead = false;
  gameState.isPlayerVictory = false;
  DOM.imageElementEl.src = ""; // Usar o DOM diretamente, sem variavel de estado.

  // Verificar save em sala segura, se hover, o botão continuar será exibido
  const saved = loadGameData();
  if (saved) {
    // Verifica a quantidade de mortes
    gameState.deaths = saved.deaths || 0;
    if (saved.currentRoom > 0) {
      DOM.continueButton.disabled = false;
      DOM.continueButton.style.display = "block";
    } else {
      DOM.continueButton.disabled = true;
      DOM.continueButton.style.display = "none";
    }
  } else {
    DOM.continueButton.disabled = true;
    DOM.continueButton.style.display = "none";
  }

  // Iniciar com a tela adequada
  playMusicMenu();
  showScreen(DOM.menuScreen);
}

/* --- Iniciar novo jogo / continuar jogo ---*/
export function startNewGame() {
  // "Meta-progresso" por número de mortes (torna personagem ligeiramente mais forte)
  // Mecanica semelhante a um jogo "Rogue-like"
  gameState.player = {
    ...PLAYER_INITIAL,
    ac: PLAYER_INITIAL.ac + gameState.deaths,
    attackBonus: PLAYER_INITIAL.attackBonus + gameState.deaths,
    hp: PLAYER_INITIAL.hp + gameState.deaths,
    maxHp: PLAYER_INITIAL.maxHp + gameState.deaths,
    lastRoomTypes: [],
  };
  gameState.currentMonster = null;
  gameState.messageQueue = [];
  gameState.processingMessages = false;
  gameState.waitingForAction = false;

  // Mostrar a tela de história
  showScreen(DOM.storyScreen);
  playMusicGame();
}

export function continueGame() {
  const saved = loadGameData();
  if (!saved) return;
  gameState.player = { ...saved };
  // Converter sala segura em vazia para evitar salvar novamente
  if (SAFE_ROOMS.includes(gameState.player.currentRoom)) {
    gameState.gameRooms[gameState.player.currentRoom] = ROOM_TYPES.EMPTY;
  }
  showScreen(DOM.gameScreen);
  playMusicGame();
  updateUI();

  // Definir o tipo da sala atual como vazia para garantir que apenas as opções de direção apareçam
  gameState.currentRoomData = {
    number: gameState.player.currentRoom,
    type: ROOM_TYPES.EMPTY,
  };
  addMessage(
    "Você desperta no recanto seguro, na mata calma, sem nenhum apuro."
  );
  DOM.imageElementEl.src = "";
  showAnimation("player-wakeup");
  gameState.waitingForAction = true;
}
// Iniciar o jogo apartir da tela inicial da história
export function startGameFromStory() {
  showScreen(DOM.gameScreen);
  updateUI();
  showAnimation("player-wakeup");
  enterRoom(0);
}

/* --- Apagar dados salvos e Gerenciar o modal "Apagar dados" ---*/
export function deleteAllData() {
  if (!DOM.eraseModal) return;
  DOM.eraseModal.style.display = "flex";

  // Botões e listeners do modal
  const onYes = () => {
    if (DOM.confirmOptions) DOM.confirmOptions.style.display = "none";
    if (DOM.eraseOptions) DOM.eraseOptions.style.display = "block";
  };
  const onEraseYes = () => {
    removeGameData();
    generateAllRooms();
    if (DOM.continueButton) {
      DOM.continueButton.disabled = true;
      DOM.continueButton.style.display = "none";
    }
    if (DOM.eraseOptions) DOM.eraseOptions.style.display = "none";
    if (DOM.okOptions) DOM.okOptions.style.display = "flex";
  };
  const onOk = () => {
    removeGameData();
    initializeGame();
    resetEraseModal();
  };
  const onNo = () => resetEraseModal();

  if (DOM.btnYes) DOM.btnYes.onclick = onYes;
  if (DOM.btnEraseYes) DOM.btnEraseYes.onclick = onEraseYes;
  if (DOM.btnEraseNo) DOM.btnEraseNo.onclick = onNo;
  if (DOM.btnNo) DOM.btnNo.onclick = onNo;
  if (DOM.btnOk) DOM.btnOk.onclick = onOk;
}

// Reseta o modal
export function resetEraseModal() {
  if (!DOM.eraseModal) return;
  DOM.eraseModal.style.display = "none";
  if (DOM.confirmOptions) DOM.confirmOptions.style.display = "block";
  if (DOM.eraseOptions) DOM.eraseOptions.style.display = "none";
  if (DOM.okOptions) DOM.okOptions.style.display = "none";
}

/* --- Lógica das Salas --- */
// Gerar as salas
function generateAllRooms() {
  gameState.gameRooms = {};
  // Pré-definir salas fixas
  gameState.gameRooms[0] = ROOM_TYPES.EMPTY; // Sala inicial
  gameState.gameRooms[BOSS_ROOM] = ROOM_TYPES.BOSS; // Sala do boss
  // Garantir que as salas seguras sejam sempre do tipo SAFE
  for (const r of SAFE_ROOMS) gameState.gameRooms[r] = ROOM_TYPES.SAFE;
  gameState.gameRooms[BOSS_ROOM - 1] = ROOM_TYPES.CHEST;
  // Gerar as outras salas aleatoriamente
  for (let i = 1; i < BOSS_ROOM; i++) {
    if (gameState.gameRooms[i] === undefined) gameState.gameRooms[i] = null;
  }
}

// --- Determinar tipo da sala ---
function determineRoomType(roomNumber) {
  if (roomNumber === 0) return ROOM_TYPES.EMPTY; // Sala inicial é sempre vazia
  if (roomNumber === BOSS_ROOM) return ROOM_TYPES.BOSS;
  if (SAFE_ROOMS.includes(roomNumber)) return ROOM_TYPES.SAFE;
  if (roomNumber === BOSS_ROOM - 1) return ROOM_TYPES.CHEST; // Sala 49 sempre é baú

  // Verificar as últimas salas visitadas para aplicar as regras de sequência
  const lastTwo = gameState.player.lastRoomTypes.slice(-2);

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
  if (gameState.player.lastRoomTypes.length > 0) {
    const last =
      gameState.player.lastRoomTypes[gameState.player.lastRoomTypes.length - 1];
    if (
      last === ROOM_TYPES.EMPTY ||
      last === ROOM_TYPES.CHEST ||
      last === ROOM_TYPES.SEEN
    ) {
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
    gameState.gameRooms[roomNumber] = ROOM_TYPES.SAFE;
    return ROOM_TYPES.SAFE;
  }
  // Se a sala já foi pré-definida (as salas seguras e do boss), usar esse valor
  if (gameState.gameRooms[roomNumber] != null)
    return gameState.gameRooms[roomNumber];
  // Caso contrário, determinar o tipo e salvar
  const type = determineRoomType(roomNumber);
  gameState.gameRooms[roomNumber] = type;
  return type;
}

/* --- Entrar na sala --- */
function enterRoom(roomNumber) {
  // Esconder todos os botões no início
  hideAllActions();

  gameState.player.currentRoom = roomNumber;
  const roomType = generateRoomType(roomNumber);
  const appear = drawPhrases(GAME_PHRASES.appear);

  // Registrar o tipo da sala para as regras de sequência
  gameState.player.lastRoomTypes.push(roomType);
  if (gameState.player.lastRoomTypes.length > 5)
    gameState.player.lastRoomTypes.shift();

  // Atualizar dados da sala atual
  gameState.currentRoomData = { number: roomNumber, type: roomType };

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
      gameState.currentMonster = generateMonster(roomNumber);
      addMessage(
        `${appear.text_p1} ${gameState.currentMonster.name} ${appear.text_p2}`
      );
      DOM.imageElementEl.src = gameState.currentMonster.image; // Garante que a imagem está na UI
      break;
    case ROOM_TYPES.BOSS: // Sala boss
      gameState.currentMonster = generateBoss();
      addMessage(
        `${appear.text_p1} ${gameState.currentMonster.name} ${appear.text_p2}`
      );
      DOM.imageElementEl.src = gameState.currentMonster.image; // Garante que a imagem está na UI
      break;
    case ROOM_TYPES.CHEST: // Sala butija
      DOM.imageElementEl.src = "images/objects/butija.webp";
      addMessage("Na mata algo brilhou, uma butija você encontrou!");
      break;
    case ROOM_TYPES.TRAP: // Sala armadilha
      DOM.imageElementEl.src = "images/objects/arapuca.webp";
      addMessage("Você caiu em uma apauca!");
      setTimeout(() => playSound(SOUNDS.playerDamage), ANIM_DELAY / 2);
      // Aplicar dano da armadilha
      gameState.player.hp -= TRAP_DAMAGE;
      addMessage(`Você perdeu ${TRAP_DAMAGE} de vida!`);

      // Verificar se o jogador morreu
      if (gameState.player.hp <= 0) {
        gameState.player.hp = 0;
        updateUI();
        setTimeout(gameOver, ANIM_DELAY);
        return;
      }
      break;
    case ROOM_TYPES.SAFE: // Sala segura
      DOM.imageElementEl.src = "images/objects/fogueira.webp";
      showAnimation("fire");
      addMessage(
        "Neste recanto, seu peito sossegou, um lugar seguro você encontrou."
      );
      break;
  }

  // Atualizar UI
  updateUI();
  // Marcar que estamos esperando uma ação do jogador
  gameState.waitingForAction = true;
}

/* --- Movimento do jogador --- */
export function moveToNextRoom(direction) {
  //Toca o efeito sonoro
  playSound(SOUNDS.walk);
  DOM.imageElementEl.src = "";
  // Determinar o próximo número de sala
  let nextRoom = gameState.player.currentRoom;
  nextRoom = Math.min(gameState.player.currentRoom + move(), BOSS_ROOM);
  // Entrar na próxima sala
  enterRoom(nextRoom);
}
// Função auxiliar para garantir que o jogador visite o numero minimo de salas
function move() {
  if (gameState.movement === 1) {
    gameState.movement = 2;
    return 1;
  } else {
    gameState.movement = 1;
    return 2;
  }
}

/* --- Lógica de Combate --- */
// Jogar o dado (aleatório)
const rollDice = (sides) => Math.floor(Math.random() * sides) + 1;

// Função para o cálculo de ataque
function resolveAttack(
  attacker,
  defender,
  { bonus = 0, scared = false, isPlayer = false } = {}
) {
  // Rolar um d20 + bonus de ataque + (buffs ou debuffs)
  const rollAttack = rollDice(20);
  const rollDamage = rollDice(6); // Rolar o D6 do dano
  // Logica de buff ou debuff de medo (scared)
  // -> quando é a vez do jogador, ele ganha +3 de ataque e +3 de dano e o inimigo perde -3 de CA
  // -> quando é a vez do inimigo, ele perde -3 de ataque e -3 de dano.
  const scaredDebuff = isPlayer && scared ? 3 : !isPlayer && scared ? -3 : 0;
  const effectiveAC = defender.ac - (!isPlayer ? 0 : scaredDebuff);
  const attackTotal = rollAttack + attacker.attackBonus + bonus + scaredDebuff;

  let damage = 0;
  let result = "miss";

  if (attackTotal >= effectiveAC) {
    // Rolar o dano
    damage =
      rollDamage +
      (isPlayer ? Math.floor(attacker.attackBonus / 2) : attacker.damageBonus) +
      scaredDebuff;
    damage = Math.max(damage, 1);

    // Ataque crítico - dobro do dano
    if (rollAttack === 20) {
      damage *= 2;
      result = "crit";
    }
    // Erro crítico - ataque falha automaticamente
    else if (rollAttack === 1) {
      result = "miss";
    }
    // Ataque igual à CA do defensor - causa apenas metade do dano (de raspão)
    else if (attackTotal === effectiveAC) {
      damage = Math.ceil(damage / 2);
      result = "graze";
    }
    // Se o ataque supera a CA do defensor + 50% - dano aumentado em 50%
    // Exemplo: Se a CA do defensor é 10 e o ataque total do atacante (d20 + bonus de ataque) for igual ou maior que 15
    // Então isso é o dano é 50% maior que a CA do defensor, logo o ataque causa 50% a mais de dano
    else if (attackTotal >= effectiveAC + Math.ceil(effectiveAC * 0.5)) {
      damage = Math.floor(damage * 1.5);
      result = "strong";
    } else {
      result = "hit";
    }
  }
  return { rollAttack, attackTotal, damage, result };
}

// --- Combate: jogador ataca (turno do jogador) ---
export function playerAttack(useSpecial) {
  if (gameState.processingMessages || !gameState.currentMonster) return;

  const specialBonus = useSpecial ? 5 : 0;
  // Verifica se foi um ataque normal ou ataque especial
  if (useSpecial) {
    gameState.turnsToSpecial += 4; // A cada uso do especial, adicionar 4 turnos para o próximo uso
    gameState.isSpecialAtk = true;
    addMessage("Você ataca furiosamente!");
  } else {
    gameState.isSpecialAtk = false;
    addMessage("Você ataca!");
  }

  // Calculo e verificação do ataque
  const attack = resolveAttack(gameState.player, gameState.currentMonster, {
    bonus: specialBonus,
    scared: gameState.isMonsterScared,
    isPlayer: true,
  });
  // Animação de ataque
  showAnimation("player-attack");

  // Mensagens informando o dano do jogador
  if (attack.result === "miss") {
    const miss = drawPhrases(GAME_PHRASES.miss);
    addMessage(miss.text);
  } else {
    gameState.currentMonster.hp -= attack.damage + specialBonus;
    switch (attack.result) {
      case "crit":
        addMessage(`CRÍTICO! você causa ${attack.damage} de dano!`);
        break;
      case "graze":
        addMessage(`De raspão! você causa ${attack.damage} de dano.`);
        break;
      case "strong":
        addMessage(`Golpe forte! você causa ${attack.damage} de dano!`);
        break;
      default:
        addMessage(`Você causa ${attack.damage} de dano.`);
        break;
    }
  }
  updateUI();

  // Verifica se o inimigo morreu
  if (gameState.currentMonster.hp <= 0) {
    const defeated = drawPhrases(GAME_PHRASES.defeated);
    addMessage(`${gameState.currentMonster.name} ${defeated.text}`);
    monsterDefeated();
    return;
  }
  // Turno do monstro após um delay
  setTimeout(() => monsterTurn(), ANIM_DELAY);
}

// --- Combate: turno do monstro ---
function monsterTurn() {
  if (!gameState.currentMonster || gameState.currentMonster.hp <= 0) return;

  addMessage(`${gameState.currentMonster.name} te ataca!`);

  // Animação de ataque do monstro
  const attack = resolveAttack(gameState.currentMonster, gameState.player, {
    scared: gameState.isMonsterScared,
  });

  // Mensagens informando o dano do monstro
  if (attack.result === "miss") {
    gameState.isPlayerDamage = false;
    const playerDodge = drawPhrases(GAME_PHRASES.dodge);
    addMessage(playerDodge.text);
  } else {
    gameState.isPlayerDamage = true;
    gameState.player.hp -= attack.damage;
    switch (attack.result) {
      case "crit":
        addMessage(`CRÍTICO! você perde ${attack.damage} de vida!`);
        break;
      case "graze":
        addMessage(`De raspão! você perde ${attack.damage} de vida.`);
        break;
      case "strong":
        addMessage(`Golpe forte! você perde ${attack.damage} de vida!`);
        break;
      default:
        addMessage(`Acerto! você perde ${attack.damage} de vida.`);
        break;
    }
  }

  showAnimation("monster-attack");

  // Verifica se o jogador morreu
  if (gameState.player.hp <= 0) {
    setTimeout(() => gameOver(), ANIM_DELAY);
    return;
  }

  // Verifia se o monstro  está assustado
  monsterScared();
  if (gameState.turnsToRoar <= 3) gameState.isMonsterScared = false;
  setTimeout(updateUI, ANIM_DELAY);
  turnSpend();
}

function turnSpend() {
  if (gameState.player.hp <= 0) return;
  if (gameState.turnsToSpecial > 0) gameState.turnsToSpecial--;
  if (gameState.turnsToRoar > 0) gameState.turnsToRoar--;
  gameState.waitingForAction = true;
}

/*--- Jogador usa um rugido para amedrontar o inimigo ---*/
export function playerRoar() {
  if (gameState.processingMessages) return;
  // Chance de 80% de amedrontar o monstro
  const chance = Math.floor(Math.random() * (5 - 1 + 1)) + 1;
  gameState.isMonsterScared = chance <= 4;
  addMessage(
    `Você ruge! ${
      gameState.isMonsterScared
        ? `${gameState.currentMonster.name} ficou aterrorizado!`
        : ""
    }`
  );
  gameState.turnsToRoar += 4;
  showAnimation("player-roar");
  gameState.waitingForAction = false;
  updateUI(); // Chama o render para desabilitar o botão
  setTimeout(() => monsterTurn(), ANIM_DELAY);
}

/* --- Atualiza o status do monstro assustado na UI --- */
function monsterScared() {
  DOM.monsterStatus.style.opacity = gameState.isMonsterScared ? 1 : 0;
}

/* --- Quando monstro morre: gerar loot e limpar sala --- */
function monsterDefeated() {
  // Passa o turno
  turnSpend();
  gameState.isMonsterScared = false;
  monsterScared();

  setTimeout(() => {
    // Animação para a morte do monstro
    showAnimation("monster-death");
    playSound(SOUNDS.monsterDeath);
  }, ANIM_DELAY * 1.5);

  if (gameState.currentMonster.type === "boss") {
    setTimeout(victory, ANIM_DELAY);
    return;
  }

  // Determinar loot baseado no tipo do monstro
  let goldAmount = 0;
  let potionChance = 0;
  switch (gameState.currentMonster.type) {
    case "fraco":
      goldAmount = Math.floor(Math.random() * 5) + 5;
      potionChance = 0.1; // 10% chance de vir poção
      break;
    case "normal":
      goldAmount = Math.floor(Math.random() * 5) + 10;
      potionChance = 0.2; // 20% chance de vir poção
      break;
    case "elite":
      goldAmount = Math.floor(Math.random() * 10) + 10;
      potionChance = 0.3; // 30% chance de vir poção
      break;
  }

  // Adicionar dinheiro ao jogador
  gameState.player.gold += goldAmount;
  let lootMessage = `Você achou ${goldAmount} patacas!`;

  //Chance de achar um aluá
  if (Math.random() < potionChance) {
    gameState.player.potions += 1;
    lootMessage += `\n E uma garrafa cheia de aluá!`;
  }

  addMessage(lootMessage);

  gameState.currentMonster = null;
  gameState.waitingForAction = true;
  setTimeout(updateUI, ANIM_DELAY * 2);
}

/* --- Usar poção (aluá) --- */
export function usePotion() {
  if (gameState.player.potions <= 0) {
    addMessage("Você não tem mais aluá!");
    gameState.waitingForAction = true;
    return;
  }
  if (gameState.player.hp >= gameState.player.maxHp) {
    addMessage("Sua vida já está no máximo!");
    gameState.waitingForAction = true;
    return;
  }
  gameState.player.potions--;
  const healAmount = 10;
  const healedLife = Math.min(
    healAmount,
    gameState.player.maxHp - gameState.player.hp
  );
  gameState.player.hp = Math.min(
    gameState.player.hp + healAmount,
    gameState.player.maxHp
  );
  addMessage(`Você bebeu um aluá! curou ${healedLife} de vida.`);
  showAnimation("potion");
  updateUI();
  gameState.waitingForAction = true;
}

/* --- Funções Game Over / Vitória ---*/
function gameOver() {
  const death = drawPhrases(GAME_PHRASES.death);
  addMessage(`${death.text}`);
  // Salvar mortes para "meta-progresso" (rogue-like)
  saveGameData({
    ...PLAYER_INITIAL,
    deaths: gameState.deaths + 1,
    currentRoom: 0,
  });
  showAnimation("player-death");
  gameState.isPlayerDead = true;
  // Mostrar tela de game over
  setTimeout(() => {
    DOM.imageElementEl.src = "";
    showScreen(DOM.gameOverScreen);
    playMusicMenu();
  }, ANIM_DELAY);
}

function victory() {
  gameState.isPlayerVictory = true;
  setTimeout(() => {
    showAnimation("player-blink");
    setTimeout(() => {
      addMessage(
        "Raiou o dia, dissipou a noite escura, o você segue vivo, com força e bravura."
      );
      gameState.currentMonster = null;
      DOM.imageElementEl.src = "";
      DOM.bgRoom.style.backgroundImage = "url('images/ui/forest-color.webp')";
      updateUI();
    }, 1000);
    pauseAllMusics();
  }, ANIM_DELAY);

  // Mostrar tela de créditos
  setTimeout(() => {
    showScreen(DOM.creditsScreen);
    const stars = Math.max(6 - Math.floor(gameState.deaths / 2), 1);
    DOM.starsEl.innerHTML = "";
    for (let i = 0; i < stars; i++) {
      DOM.starsEl.innerHTML += ` <img src="images/ui/star.webp" class="star"/>`;
    }
    removeGameData(); // Remover os dados salvos do jogador
    playMusicMenu(); // Tocar a musica do menu
  }, ANIM_DELAY * 3.5);
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
      hp: generateMonsterStates(18, 22), // 18-22 HP
      ac: generateMonsterStates(10, 13), // 10-13 CA (defesa)
      attackBonus: generateMonsterStates(1, 3), // 1-3 Bonus de Ataque
      damageBonus: generateMonsterStates(1, 2), // 1-2 Bonus de Dano
    };
  } else if (monsterType === "normal") {
    monsterStats = {
      hp: generateMonsterStates(26, 30), // 26-30 HP
      ac: generateMonsterStates(13, 15), // 13-15 CA (defesa)
      attackBonus: generateMonsterStates(4, 5), // 4-5 Bonus de Ataque
      damageBonus: generateMonsterStates(2, 3), // 2-3 Bonus de Dano
    };
  } else {
    monsterStats = {
      hp: generateMonsterStates(36, 40), // 36-40 HP
      ac: generateMonsterStates(15, 18), // 15-18 CA (defesa)
      attackBonus: generateMonsterStates(6, 8), // 6-8 Bonus de Ataque
      damageBonus: generateMonsterStates(3, 4), // 3-4 Bonus de Dano
    };
  }

  // Escolher monstro aleatório e definir seu nome e imagem
  const pick = randFrom(MONSTER[monsterType]);

  // Status do mostro definido
  return {
    name: pick.name,
    image: pick.image,
    hp: monsterStats.hp,
    ac: monsterStats.ac,
    attackBonus: monsterStats.attackBonus,
    damageBonus: monsterStats.damageBonus,
    type: monsterType,
  };
}

//Gerar o boss do jogo
function generateBoss() {
  const pick = randFrom(BOSS);
  return {
    name: pick.name,
    image: pick.image,
    hp: generateMonsterStates(78, 80), // 78-80 HP
    ac: 20, // 20 CA (defesa)
    attackBonus: generateMonsterStates(12, 14), // 12-14 Bonus de Ataque
    damageBonus: generateMonsterStates(7, 10), // 7-10 Bonus de Dano
    type: "boss",
  };
}

// Funcão auxiliar para gerar estados de monstros
function generateMonsterStates(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* --- Lógica de baús (butija) --- */
// Abrir baú
export function openChest() {
  // Determinar o tipo do baú
  const roll = Math.random() * 100;
  let chestType = "normal";
  if (roll >= 95) chestType = "lendario";
  else if (roll >= 85) chestType = "raro";

  // Gerar o loot do baú com base no tipo
  const loot = generateChestLoot(chestType);
  showAnimation("chest");
  // Tocar o som do baú
  playSound(SOUNDS.chest);
  // Aplicar o loot ao jogador
  applyLoot(loot);
  // Marcar o tipo da sala como visitada após abrir o baú
  gameState.currentRoomData.type = ROOM_TYPES.SEEN;
  updateUI();
  gameState.waitingForAction = true;
}

// Ignorar baú
export function ignoreChest() {
  addMessage("Você decide não mexer na butija.");
  //Animação de ignorar butija
  showAnimation("ignore");
  playSound(SOUNDS.walk);
  // Marcar o tipo da sala como visitada após ignorar o baú
  gameState.currentRoomData.type = ROOM_TYPES.SEEN;
  updateUI();
  gameState.waitingForAction = true;
}

/* Logica das armadilhas (arapucas) */
// Levantar
export function liftAction() {
  addMessage("Você se levanta com cuidado.");
  // Após levantar, a armadilha desaparece e a sala é marcada como visitada
  // Animação de sair da armadilha
  DOM.imageElementEl.src = "images/objects/arapuca-alt.webp";
  showAnimation("trap");
  gameState.currentRoomData.type = ROOM_TYPES.SEEN;
  addMessage("Firmou o passo, seguiu adiante, na mata escura e constante.");
  updateUI();
  gameState.waitingForAction = true;
}

// Apenas olha ao redor (não gera nenhuma ação)
export function observeAction() {
  addMessage("Por aqui nenhum assombro se mostrou, só o vento que soprou.");
  gameState.waitingForAction = true;
}

/* --- Logica para aplicação dos loots ao jogador --- */
// Função para gerar loot baseado no tipo do baú
function generateChestLoot(type) {
  const roll = Math.random() * 100;
  const table = LOOT_TABLES[type] || [];
  return table.find((entry) => roll < entry.chance)?.loot || {};
}

/* --- Aplicar loot ao jogador --- */
function applyLoot(loot) {
  if (!loot?.type) return;

  const actions = {
    // Achar dinheiro
    gold: () => {
      const amount = loot.gold || loot.amount || 0;
      gameState.player.gold += amount;
      addMessage(`Você achou ${amount} patacas!`);
    },
    // Achar poção
    potion: () => {
      const amount = loot.amount || 1;
      gameState.player.potions += amount;
      addMessage(
        `Você achou ${amount} ${amount === 1 ? "garrafa" : "garrafas"} de aluá!`
      );
    },
    //Aumenta a defesa baseado no tipo de loot (comum, raro e lendário)
    common_armor: () =>
      increaseDef(1, "Você achou um tônico! \nSua defesa aumenta +1!"),
    rare_armor: () =>
      increaseDef(2, "Você achou um tônico amargo! \nSua defesa aumenta +2!"),
    legendary_armor: () =>
      increaseDef(3, "Você achou um tônico forte! \nSua defesa aumenta +3!"),
    //Aumenta o HP baseado no tipo de loot (comum, raro e lendário)
    common_hp: () =>
      increaseHP(3, "Você achou um elixir! \nSua vida máxima aumenta +3!"),
    rare_hp: () =>
      increaseHP(
        5,
        "Você achou um elixir forte! \nSua vida máxima aumenta +5!"
      ),
    legendary_hp: () =>
      increaseHP(
        10,
        "Você achou um elixir santo! \nSua vida máxima aumenta +10!"
      ),
    //Aumenta o ataque baseado no tipo de loot (comum, raro e lendário)
    common_attack: () =>
      increaseAtk(1, "Você achou um chá amargo! \nSeu ataque aumenta +1"),
    rare_attack: () =>
      increaseAtk(
        2,
        "Você achou um chá forte de raiz! \nSeu ataque aumenta +2"
      ),
    legendary_attack: () =>
      increaseAtk(3, "Você achou um chá encantado! \nSeu ataque aumenta +3"),
  };
  // Funções auxiliares para aumentar atributos e mostrar mensagens
  function increaseDef(value, msg) {
    gameState.player.ac += value;
    addMessage(msg);
  }
  function increaseHP(value, msg) {
    gameState.player.maxHp += value;
    gameState.player.hp += value;
    addMessage(msg);
  }
  function increaseAtk(value, msg) {
    gameState.player.attackBonus += value;
    addMessage(msg);
  }
  // Executa ação correspondente
  actions[loot.type]?.();
  updateUI();
}

/* --- Logica da sala segura --- */
// Função salvar
function saveGameInSafeRoom() {
  saveGameData(gameState.player);
  addMessage("O fogo aquece, o sono vem, o fica jogo salvo também.");
}

// Função que salva o jogo e recupera a vida do jogador
export function saveAndContinue() {
  // Recupera a vida do jogador
  gameState.player.hp = gameState.player.maxHp;
  saveGameInSafeRoom();
  updateUI();
  // Após salvar, marcar a sala como protegida
  gameState.currentRoomData.type = ROOM_TYPES.PROTECTED;
  gameState.waitingForAction = true;
}

// Função que é executada logo após salavar o jogo, mostrando as ações apropriadas para o jogador
export function continueAfterSaving() {
  showAnimation("player-blink");
  addMessage(
    "O corpo renovado, o peito a brilhar, você segue pronto pra caminhar."
  );
  // Após salvar, marcar a sala como vazia para mostrar opções de direção
  gameState.currentRoomData.type = ROOM_TYPES.EMPTY;
  gameState.waitingForAction = true;
}

// Fortalecer atributos do jogador
export function upgradeAttribute(attribute) {
  // Verificar se o jogador tem dinheiro suficiente
  if (gameState.player.gold < UPGRADE_COST) {
    addMessage("Patacas insuficientes!");
    hideBlessingModal();
    return;
  }

  // Remover o dinhero gasto do jogador
  gameState.player.gold -= UPGRADE_COST;
  // Aplicar o fortalecimento
  switch (attribute) {
    case "attack":
      gameState.player.attackBonus += 1;
      addMessage(
        `Seu ataque aumentou! (${gameState.player.attackBonus - 1} -> ${
          gameState.player.attackBonus
        })`
      );
      break;
    case "defense":
      gameState.player.ac += 1;
      addMessage(
        `Sua defesa aumentou! (${gameState.player.ac - 1} -> ${
          gameState.player.ac
        })`
      );
      break;
    case "hp":
      gameState.player.maxHp += 1;
      gameState.player.hp += 1;
      addMessage(
        `Sua vida máxima aumentou! (${gameState.player.maxHp - 1} -> ${
          gameState.player.maxHp
        })`
      );
      break;
    default:
      break;
  }
  // Fechar o modal
  hideBlessingModal();
  updateUI();
  // Após fortalecer, retora à sala
  const blessing = drawPhrases(GAME_PHRASES.blessing);
  addMessage(`${blessing.text}`);
  gameState.waitingForAction = true;
}
