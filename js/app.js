import dataService from './dataService.js';
import characterService from './characterService.js';

// Инициализация
dataService.init();

// Текущее состояние
let currentUser = null;
let currentRoom = null;
let currentCharacter = null;
let isMaster = false;

// DOM элементы
const authScreen = document.getElementById('authScreen');
const mainScreen = document.getElementById('mainScreen');
const dashboardSection = document.getElementById('dashboardSection');
const roomSection = document.getElementById('roomSection');
const characterSheetSection = document.getElementById('characterSheetSection');
const characterSelectionSection = document.getElementById('characterSelectionSection');

// Проверяем авторизацию при загрузке
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();

  // Проверяем сохраненную комнату
  const savedRoom = dataService.getCurrentRoom();
  if (savedRoom) {
    currentRoom = savedRoom;
    enterRoom(savedRoom.id);
  }
});

// Проверить авторизацию
function checkAuth() {
  const user = dataService.getCurrentUser();
  if (user) {
    currentUser = user;
    authScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    loadDashboard();
  }
}

// Настройка обработчиков событий
function setupEventListeners() {
  // Авторизация
  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('registerBtn').addEventListener('click', register);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Комнаты
  document.getElementById('createRoomBtn').addEventListener('click', createRoom);
  document.getElementById('backToDashboardBtn').addEventListener('click', backToDashboard);

  // Персонажи
  document.getElementById('createCharacterBtn').addEventListener('click', showCharacterSelection);
  document.getElementById('backFromCharacterSheetBtn').addEventListener('click', backFromCharacterSheet);
  document.getElementById('saveCharacterBtn').addEventListener('click', saveCharacter);
  document.getElementById('backToRoomFromSelectionBtn').addEventListener('click', backToRoomFromSelection);
  document.getElementById('createNewCharacterForRoomBtn').addEventListener('click', createCharacterForRoom);
  document.getElementById('createCharacterGlobalBtn').addEventListener('click', createCharacterGlobal);

  // Удаление комнаты
  document.getElementById('confirmDeleteRoomBtn').addEventListener('click', confirmDeleteRoom);

  // Обновление характеристик
  const statInputs = [
    'strInput', 'dexInput', 'conInput',
    'intInput', 'wisInput', 'chaInput'
  ];

  statInputs.forEach(id => {
    document.getElementById(id).addEventListener('change', updateStatValue);
  });
}

// ================ АВТОРИЗАЦИЯ ================
function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!username || !password) {
    alert('Заполните все поля');
    return;
  }

  const users = dataService.getUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    currentUser = user;
    dataService.setCurrentUser(user);
    authScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    loadDashboard();
  } else {
    alert('Неверное имя пользователя или пароль');
  }
}

function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!username || !password) {
    alert('Заполните все поля');
    return;
  }

  const users = dataService.getUsers();

  if (users.some(u => u.username === username)) {
    alert('Пользователь с таким именем уже существует');
    return;
  }

  const newUser = {
    id: Date.now().toString(),
    username,
    password
  };

  users.push(newUser);
  dataService.saveUsers(users);
  dataService.setCurrentUser(newUser);
  currentUser = newUser;

  authScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
  loadDashboard();
}

function logout() {
  dataService.clearCurrentUser();
  dataService.clearCurrentRoom();
  currentUser = null;
  currentRoom = null;
  mainScreen.classList.add('hidden');
  authScreen.classList.remove('hidden');
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
}

// ================ ДАШБОРД ================
function loadDashboard() {
  const rooms = dataService.getRooms();

  // Комнаты мастера
  const masterRooms = rooms.filter(room => room.masterId === currentUser.id);
  const masterRoomsList = document.getElementById('masterRoomsList');
  masterRoomsList.innerHTML = '';

  if (masterRooms.length === 0) {
    masterRoomsList.innerHTML = '<li class="list-group-item">Вы не создали ни одной комнаты</li>';
  } else {
    masterRooms.forEach(room => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.innerHTML = `
                <div class="d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold">${room.name}</span>
                        <div class="button-container">
                            <button class="btn btn-sm btn-danger delete-room-btn" data-id="${room.id}">Удалить</button>
                            <button class="btn btn-sm btn-primary enter-room-btn" data-id="${room.id}">Войти</button>
                        </div>
                    </div>
                </div>
            `;
      masterRoomsList.appendChild(li);
    });
  }

  // Комнаты игрока
  const playerRooms = rooms.filter(room =>
    room.players.some(player => player.id === currentUser.id)
  );
  const playerRoomsList = document.getElementById('playerRoomsList');
  playerRoomsList.innerHTML = '';

  if (playerRooms.length === 0) {
    playerRoomsList.innerHTML = '<li class="list-group-item">Вы не присоединились ни к одной комнате</li>';
  } else {
    playerRooms.forEach(room => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.innerHTML = `
                <div class="d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-center">
                        <span>${room.name} (Мастер: ${room.masterName})</span>
                        <div class="button-container">
                            <button class="btn btn-sm btn-primary enter-room-btn" data-id="${room.id}">Войти</button>
                        </div>
                    </div>
                </div>
            `;
      playerRoomsList.appendChild(li);
    });
  }

  // Открытые комнаты
  const openRooms = dataService.getOpenRooms(currentUser.id);
  const openRoomsList = document.getElementById('openRoomsList');
  openRoomsList.innerHTML = '';

  if (openRooms.length === 0) {
    openRoomsList.innerHTML = '<li class="list-group-item">Нет открытых комнат</li>';
  } else {
    openRooms.forEach(room => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `
                <span>${room.name} (Мастер: ${room.masterName})</span>
                <button class="btn btn-sm btn-primary join-room-btn" data-id="${room.id}">Присоединиться</button>
            `;
      openRoomsList.appendChild(li);
    });
  }

  // Обработчики для кнопок
  document.querySelectorAll('.enter-room-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const roomId = e.target.dataset.id;
      enterRoom(roomId);
    });
  });

  document.querySelectorAll('.join-room-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const roomId = e.target.dataset.id;
      joinRoom(roomId);
    });
  });

  document.querySelectorAll('.delete-room-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const roomId = e.target.dataset.id;
      showDeleteRoomModal(roomId);
    });
  });

  // Персонажи пользователя
  renderGlobalCharacters();
}

function createRoom() {
  const roomName = prompt('Введите название комнаты:');
  if (!roomName) return;

  const rooms = dataService.getRooms();

  const newRoom = {
    id: Date.now().toString(),
    name: roomName,
    masterId: currentUser.id,
    masterName: currentUser.username,
    players: []
  };

  rooms.push(newRoom);
  dataService.saveRooms(rooms);
  loadDashboard();
}

function showDeleteRoomModal(roomId) {
  const modal = new bootstrap.Modal(document.getElementById('deleteRoomModal'));
  document.getElementById('confirmDeleteRoomBtn').dataset.id = roomId;
  modal.show();
}

function confirmDeleteRoom(e) {
  const roomId = e.target.dataset.id;
  dataService.removeRoom(roomId);

  // Закрываем модальное окно
  const modal = bootstrap.Modal.getInstance(document.getElementById('deleteRoomModal'));
  if (modal) modal.hide();

  loadDashboard();
}

function joinRoom(roomId) {
  const rooms = dataService.getRooms();
  const room = rooms.find(r => r.id === roomId);

  if (!room) {
    alert('Комната не найдена');
    return;
  }

  // Добавляем игрока в комнату
  const success = dataService.addPlayerToRoom(roomId, {
    id: currentUser.id,
    username: currentUser.username
  });

  if (success) {
    alert(`Вы присоединились к комнате "${room.name}"`);
    loadDashboard();
  } else {
    alert('Вы уже в этой комнате');
  }
}

function renderGlobalCharacters() {
  const container = document.getElementById('globalCharactersContainer');
  container.innerHTML = '';

  const characters = dataService.getUserCharactersWithoutRoom(currentUser.id);

  if (characters.length === 0) {
    container.innerHTML = '<p>У вас пока нет персонажей</p>';
    return;
  }

  characters.forEach(char => {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';

    const card = document.createElement('div');
    card.className = 'card character-card h-100';
    card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${char.name}</h5>
                <p class="card-text">
                    <span class="badge bg-primary">${char.race}</span>
                    <span class="badge bg-success">${char.class} ${char.level} ур.</span>
                </p>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary w-100 open-character-btn" data-id="${char.id}">Открыть</button>
            </div>
        `;

    col.appendChild(card);
    container.appendChild(col);
  });

  // Обработчики для кнопок открытия
  document.querySelectorAll('.open-character-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const characterId = e.target.dataset.id;
      openCharacterSheet(characterId);
    });
  });
}

function createCharacterGlobal() {
  currentCharacter = characterService.createCharacter(currentUser.id);
  characterService.saveCharacter(currentCharacter);
  openCharacterSheet(currentCharacter.id);
  dashboardSection.classList.add('hidden');
  characterSheetSection.classList.remove('hidden');
}

// ================ КОМНАТА ================
function enterRoom(roomId) {
  const rooms = dataService.getRooms();
  currentRoom = rooms.find(room => room.id === roomId);

  if (!currentRoom) {
    alert('Комната не найдена');
    return;
  }

  // Сохраняем текущую комнату
  dataService.setCurrentRoom(currentRoom);

  // Проверяем является ли пользователь мастером
  isMaster = currentRoom.masterId === currentUser.id;

  // Обновляем интерфейс комнаты
  document.getElementById('roomTitle').textContent = currentRoom.name;

  // Список игроков
  const playersList = document.getElementById('playersList');
  playersList.innerHTML = '';

  // Мастер
  const masterLi = document.createElement('li');
  masterLi.className = 'list-group-item d-flex justify-content-between align-items-center';
  masterLi.innerHTML = `
        ${currentRoom.masterName} (Мастер)
    `;
  playersList.appendChild(masterLi);

  // Игроки
  currentRoom.players.forEach(player => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
            ${player.username}
        `;
    playersList.appendChild(li);
  });

  // Персонажи
  renderCharacters();

  // Показываем экран комнаты
  dashboardSection.classList.add('hidden');
  roomSection.classList.remove('hidden');
}

function renderCharacters() {
  const charactersContainer = document.getElementById('charactersContainer');
  charactersContainer.innerHTML = '';

  // Получаем персонажей комнаты
  const roomCharacters = dataService.getCharacters().filter(char =>
    char.roomId === currentRoom.id
  );

  // Фильтруем персонажей по правам доступа
  const visibleCharacters = roomCharacters.filter(char => {
    return isMaster || char.playerId === currentUser.id;
  });

  if (visibleCharacters.length === 0) {
    charactersContainer.innerHTML = '<p>В этой комнате еще нет персонажей</p>';
    return;
  }

  visibleCharacters.forEach(char => {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';

    const card = document.createElement('div');
    card.className = 'card character-card h-100';
    card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${char.name}</h5>
                <p class="card-text">
                    <span class="badge bg-primary">${char.race}</span>
                    <span class="badge bg-success">${char.class} ${char.level} ур.</span>
                </p>
                <div class="d-flex justify-content-between">
                    <span>Сила: <strong>${char.strength}</strong></span>
                    <span>Ловк: <strong>${char.dexterity}</strong></span>
                    <span>Тел: <strong>${char.constitution}</strong></span>
                </div>
            </div>
        `;

    card.addEventListener('click', () => {
      openCharacterSheet(char.id);
    });

    col.appendChild(card);
    charactersContainer.appendChild(col);
  });
}

function backToDashboard() {
  dataService.clearCurrentRoom();
  currentRoom = null;
  roomSection.classList.add('hidden');
  characterSheetSection.classList.add('hidden');
  characterSelectionSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
}

function backToRoomFromSelection() {
  characterSelectionSection.classList.add('hidden');
  roomSection.classList.remove('hidden');
}

function backFromCharacterSheet() {
  characterSheetSection.classList.add('hidden');

  if (currentRoom) {
    roomSection.classList.remove('hidden');
    renderCharacters();
  } else {
    dashboardSection.classList.remove('hidden');
    renderGlobalCharacters();
  }
}

// ================ ВЫБОР ПЕРСОНАЖА ================
function showCharacterSelection() {
  // Получаем персонажей пользователя, не привязанных к комнате
  const userCharacters = dataService.getUserCharactersWithoutRoom(currentUser.id);

  renderCharacterSelection(userCharacters);

  roomSection.classList.add('hidden');
  characterSelectionSection.classList.remove('hidden');
}

function renderCharacterSelection(characters) {
  const container = document.getElementById('characterSelectionContainer');
  container.innerHTML = '';

  if (characters.length === 0) {
    container.innerHTML = '<p>У вас нет персонажей. Создайте нового!</p>';
    return;
  }

  characters.forEach(char => {
    const col = document.createElement('div');
    col.className = 'col-md-6 mb-4';

    const card = document.createElement('div');
    card.className = 'card character-card h-100';
    card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${char.name}</h5>
                <p class="card-text">
                    <span class="badge bg-primary">${char.race}</span>
                    <span class="badge bg-success">${char.class} ${char.level} ур.</span>
                </p>
                <div class="d-flex justify-content-between">
                    <span>Сила: <strong>${char.strength}</strong></span>
                    <span>Ловк: <strong>${char.dexterity}</strong></span>
                    <span>Тел: <strong>${char.constitution}</strong></span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary select-character-btn w-100" data-id="${char.id}">Выбрать</button>
            </div>
        `;

    col.appendChild(card);
    container.appendChild(col);
  });

  // Обработчики выбора персонажа
  document.querySelectorAll('.select-character-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const characterId = e.target.dataset.id;
      selectCharacterForRoom(characterId);
    });
  });
}

function selectCharacterForRoom(characterId) {
  const characters = dataService.getCharacters();
  const characterIndex = characters.findIndex(c => c.id === characterId);

  if (characterIndex !== -1) {
    characters[characterIndex].roomId = currentRoom.id;
    dataService.saveCharacters(characters);
    alert('Персонаж добавлен в комнату!');
    backToRoomFromSelection();
    renderCharacters();
  }
}

function createCharacterForRoom() {
  currentCharacter = characterService.createCharacter(currentUser.id, currentRoom.id);
  characterService.saveCharacter(currentCharacter);
  openCharacterSheet(currentCharacter.id);
  characterSelectionSection.classList.add('hidden');
}

// ================ ЛИСТ ПЕРСОНАЖА ================
function openCharacterSheet(characterId) {
  const characters = dataService.getCharacters();
  currentCharacter = characters.find(char => char.id === characterId);

  if (!currentCharacter) {
    alert('Персонаж не найден');
    return;
  }

  // Проверяем права доступа
  const canEdit = (currentRoom && isMaster) || currentCharacter.playerId === currentUser.id;

  // Заполняем форму
  document.getElementById('characterNameTitle').textContent = currentCharacter.name;
  document.getElementById('charName').value = currentCharacter.name;
  document.getElementById('charClass').value = currentCharacter.class;
  document.getElementById('charRace').value = currentCharacter.race;
  document.getElementById('charLevel').value = currentCharacter.level;

  // Характеристики
  document.getElementById('strInput').value = currentCharacter.strength;
  document.getElementById('dexInput').value = currentCharacter.dexterity;
  document.getElementById('conInput').value = currentCharacter.constitution;
  document.getElementById('intInput').value = currentCharacter.intelligence;
  document.getElementById('wisInput').value = currentCharacter.wisdom;
  document.getElementById('chaInput').value = currentCharacter.charisma;

  // Обновляем значения характеристик
  updateStatValues();

  // Описание и инвентарь
  document.getElementById('charDescription').value = currentCharacter.description || '';
  document.getElementById('charInventory').value = currentCharacter.inventory || '';

  // Блокируем поля, если нет прав
  const editableFields = [
    'charName', 'charClass', 'charRace', 'charLevel',
    'strInput', 'dexInput', 'conInput',
    'intInput', 'wisInput', 'chaInput',
    'charDescription', 'charInventory'
  ];

  editableFields.forEach(id => {
    document.getElementById(id).disabled = !canEdit;
  });
  document.getElementById('saveCharacterBtn').disabled = !canEdit;

  // Показываем экран персонажа
  roomSection.classList.add('hidden');
  characterSelectionSection.classList.add('hidden');
  characterSheetSection.classList.remove('hidden');
}

function updateStatValue(e) {
  const input = e.target;
  const statId = input.id.replace('Input', 'Value');
  document.getElementById(statId).textContent = input.value;
}

function updateStatValues() {
  const stats = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  stats.forEach(stat => {
    const value = document.getElementById(`${stat}Input`).value;
    document.getElementById(`${stat}Value`).textContent = value;
  });
}

function saveCharacter() {
  // Обновляем данные персонажа
  currentCharacter.name = document.getElementById('charName').value;
  currentCharacter.class = document.getElementById('charClass').value;
  currentCharacter.race = document.getElementById('charRace').value;
  currentCharacter.level = parseInt(document.getElementById('charLevel').value);

  currentCharacter.strength = parseInt(document.getElementById('strInput').value);
  currentCharacter.dexterity = parseInt(document.getElementById('dexInput').value);
  currentCharacter.constitution = parseInt(document.getElementById('conInput').value);
  currentCharacter.intelligence = parseInt(document.getElementById('intInput').value);
  currentCharacter.wisdom = parseInt(document.getElementById('wisInput').value);
  currentCharacter.charisma = parseInt(document.getElementById('chaInput').value);

  currentCharacter.description = document.getElementById('charDescription').value;
  currentCharacter.inventory = document.getElementById('charInventory').value;

  // Сохраняем
  characterService.saveCharacter(currentCharacter);
  alert('Персонаж сохранен!');

  // Возвращаемся назад
  backFromCharacterSheet();
}