// =================================================================
// MÓDULO DE DADOS
// Responsabilidade: Definir constantes e estados iniciais do jogo
// =================================================================

/*--- Constantes e estados do jogo ---*/
// Constantes do jogo
export const BOSS_ROOM = 50; // Sala do chefe sempre será a ultima (50)
export const SAFE_ROOMS = [15, 30, 45]; // Salas seguras serão as 15,30 e 45
export const ANIM_DELAY = 4000; // Delay para animações
export const UPGRADE_COST = 25; // Custo em dinheiro para melhorar um atributo
export const TRAP_DAMAGE = 5; // Dano a cair na armadilha

// Tipos de sala
export const ROOM_TYPES = {
  EMPTY: "empty",
  MONSTER: "monster",
  BOSS: "boss",
  CHEST: "chest",
  TRAP: "trap",
  SAFE: "safe",
  PROTECTED: "protected",
  SEEN: "seen",
};

// Probabilidade de qual sala pode aparecer para o jogador
export const ROOM_PROBABILITIES = [
  { type: ROOM_TYPES.MONSTER, weight: 70 }, //Chance 70% Monstro
  { type: ROOM_TYPES.CHEST, weight: 15 }, //Chance 15% Butija
  { type: ROOM_TYPES.TRAP, weight: 10 }, //Chance 10% Arapuca
  { type: ROOM_TYPES.EMPTY, weight: 5 }, //Chance 5% Sala vazia
];

// Sons do jogo
export const SOUNDS = {
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
  roar: "sounds/roar.mp3",
  fire: "sounds/fire.mp3",
  gameMusic: "sounds/game_music.mp3",
  menuMusic: "sounds/menu_music.mp3",
};

// Estado inicial jogador
export const PLAYER_INITIAL = {
  hp: 20,
  maxHp: 20,
  ac: 3,
  attackBonus: 3,
  deaths: 0,
  potions: 3,
  gold: 0,
  currentRoom: 0,
  lastRoomTypes: [],
};

/* --- Tipos de Monstros ---*/
export const MONSTER = {
  fraco: [
    { name: "Porco do Mato", image: "images/monster/porco-do-mato.webp" },
    { name: "Cachorro Doido", image: "images/monster/cachorro-doido.webp" },
    { name: "Guabiru", image: "images/monster/guabiru.webp" },
    { name: "Cobra Cascavel", image: "images/monster/cobra-cascavel.webp" },
    { name: "Cassaco Raivoso", image: "images/monster/cassaco-raivoso.webp" },
    { name: "Escorpião", image: "images/monster/escorpiao.webp" },
  ],
  normal: [
    { name: "Jaguatitica", image: "images/monster/jaguatirica.webp" },
    { name: "Gato Maracajá", image: "images/monster/gato-maracaja.webp" },
    { name: "Cabeça de Cuia", image: "images/monster/cabeca-de-cuia.webp" },
    { name: "Visagem", image: "images/monster/visagem.webp" },
    { name: "Saci Pererê", image: "images/monster/saci-perere.webp" },
    { name: "Perna Cabeluda", image: "images/monster/perna-cabeluda.webp" },
  ],
  elite: [
    { name: "Caipora", image: "images/monster/caipora.webp" },
    { name: "Corpo Seco", image: "images/monster/corpo-seco.webp" },
    { name: "Cabra Cabriola", image: "images/monster/cabra-cabriola.webp" },
    { name: "Lobisomem", image: "images/monster/lobisomen.webp" },
    { name: "Boitatá", image: "images/monster/boitata.webp" },
    { name: "Quibungo", image: "images/monster/quibungo.webp" },
  ],
};

export const BOSS = [
  { name: "Curupira", image: "images/monster/curupira.webp" },
  { name: "Cuca", image: "images/monster/cuca.webp" },
  { name: "Mula sem Cabeça", image: "images/monster/mula-sem-cabeca.webp" },
  { name: "Labatut", image: "images/monster/labatut.webp" },
];

/* --- Frases diversas quando o jogador encontra ou derrota o inimigo */
export const GAME_PHRASES = {
  appear: [
    {
      text_p1: "O silêncio da noite quebrou,",
      text_p2: "logo se mostrou!",
    },
    {
      text_p1: "O mato guarda assombro e dor,",
      text_p2: "traz o terror!",
    },
    {
      text_p1: "O mato sussurra segredo,",
      text_p2: "vem sem medo!",
    },
  ],
  defeated: [
    { text: "foi derrotado!" },
    { text: "sucumbiu!" },
    { text: "está acabado!" },
  ],

  death: [
    { text: "O homem caiu na noite, e só a fera tomou açoite." },
    { text: "O chão abraçou seu corpo, a maldição cumpriu o acordo." },
    { text: "Nem a força, nem a reza, só a morte o atravessa." },
  ],

  dodge: [
    { text: "Mas você esquivou!" },
    { text: "Você desvia com destreza!" },
    { text: "Mas não te acertou!" },
  ],

  miss: [
    { text: "O inimigo desviou!" },
    { text: "Você errou!" },
    { text: "Errou por pouco!" },
  ],

  blessing: [
    { text: "Luz sagrada te guiou, tua coragem aumentou." },
    { text: "Com energia nova a lhe guiar, você não vai fraquejar." },
    { text: "O luar te envolveu, teu corpo fortaleceu." },
  ],
};

// Função auxiliar para sortear uma frase do jogo
export const drawPhrases = (arr) => {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
};

/* --- Ações do jogador ---*/
export const PLAYER_ACTIONS = [
  {
    type: "attack",
    image: "images/actions/knife.webp",
  },

  {
    type: "special",
    image: "images/actions/claw.webp",
  },

  {
    type: "roar",
    image: "images/actions/roar.webp",
  },

  {
    type: "potion",
    image: "images/actions/potion.webp",
  },

  {
    type: "interact",
    image: "images/actions/hands.webp",
  },

  {
    type: "death",
    image: "images/actions/close-eyes.webp",
  },

  {
    type: "blink",
    image: "images/actions/blink.webp",
  },

  {
    type: "wakeup",
    image: "images/actions/open-eyes.webp",
  },
];

// Tabelas de loot
export const LOOT_TABLES = {
  normal: [
    { chance: 30, loot: { type: "potion", amount: 1 } },
    { chance: 60, loot: { type: "gold", amount: 20, gold: 20 } },
    { chance: 80, loot: { type: "common_armor" } },
    { chance: 90, loot: { type: "common_attack" } },
    { chance: 100, loot: { type: "common_hp" } },
  ],
  raro: [
    { chance: 30, loot: { type: "potion", amount: 2, gold: 30 } },
    { chance: 60, loot: { type: "rare_armor", gold: 10 } },
    { chance: 90, loot: { type: "rare_attack", gold: 10 } },
    { chance: 100, loot: { type: "rare_hp", gold: 10 } },
  ],
  lendario: [
    { chance: 30, loot: { type: "potion", amount: 3, gold: 50 } },
    { chance: 60, loot: { type: "legendary_armor", gold: 30 } },
    { chance: 90, loot: { type: "legendary_attack", gold: 30 } },
    { chance: 100, loot: { type: "legendary_hp", gold: 30 } },
  ],
};
