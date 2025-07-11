const dataService = {
  // Инициализация данных
  init: function() {
    if (!localStorage.getItem('dnd_data')) {
      const initialData = {
        users: [],
        rooms: [],
        characters: []
      };
      localStorage.setItem('dnd_data', JSON.stringify(initialData));
    }
  },

  // Получить все данные
  getData: function() {
    return JSON.parse(localStorage.getItem('dnd_data'));
  },

  // Сохранить все данные
  saveData: function(data) {
    localStorage.setItem('dnd_data', JSON.stringify(data));
  },

  // Пользователи
  getUsers: function() {
    return this.getData().users;
  },
  saveUsers: function(users) {
    const data = this.getData();
    data.users = users;
    this.saveData(data);
  },

  // Комнаты
  getRooms: function() {
    return this.getData().rooms;
  },
  saveRooms: function(rooms) {
    const data = this.getData();
    data.rooms = rooms;
    this.saveData(data);
  },

  // Персонажи
  getCharacters: function() {
    return this.getData().characters;
  },
  saveCharacters: function(characters) {
    const data = this.getData();
    data.characters = characters;
    this.saveData(data);
  },

  // Текущий пользователь
  getCurrentUser: function() {
    return JSON.parse(localStorage.getItem('dnd_currentUser'));
  },
  setCurrentUser: function(user) {
    localStorage.setItem('dnd_currentUser', JSON.stringify(user));
  },
  clearCurrentUser: function() {
    localStorage.removeItem('dnd_currentUser');
  },

  // Текущая комната
  getCurrentRoom: function() {
    return JSON.parse(localStorage.getItem('dnd_currentRoom'));
  },
  setCurrentRoom: function(room) {
    localStorage.setItem('dnd_currentRoom', JSON.stringify(room));
  },
  clearCurrentRoom: function() {
    localStorage.removeItem('dnd_currentRoom');
  },

  // Вспомогательные методы
  getUserCharacters: function(userId) {
    const characters = this.getCharacters();
    return characters.filter(char => char.playerId === userId);
  },

  getUserCharactersWithoutRoom: function(userId) {
    const characters = this.getCharacters();
    return characters.filter(char => char.playerId === userId && !char.roomId);
  },

  getRoomCharacters: function(roomId) {
    const characters = this.getCharacters();
    return characters.filter(char => char.roomId === roomId);
  },

  getOpenRooms: function(currentUserId) {
    const rooms = this.getRooms();
    return rooms.filter(room =>
      room.masterId !== currentUserId &&
      !room.players.some(player => player.id === currentUserId)
    );
  },

  addPlayerToRoom: function(roomId, player) {
    const rooms = this.getRooms();
    const roomIndex = rooms.findIndex(r => r.id === roomId);

    if (roomIndex !== -1) {
      // Проверяем, не добавлен ли уже игрок
      if (!rooms[roomIndex].players.some(p => p.id === player.id)) {
        rooms[roomIndex].players.push({
          id: player.id,
          username: player.username
        });
        this.saveRooms(rooms);
        return true;
      }
    }
    return false;
  },

  removeRoom: function(roomId) {
    const rooms = this.getRooms();
    const updatedRooms = rooms.filter(room => room.id !== roomId);
    this.saveRooms(updatedRooms);

    // Удаляем персонажей из комнаты
    const characters = this.getCharacters();
    const updatedCharacters = characters.map(char => {
      if (char.roomId === roomId) {
        return {...char, roomId: null};
      }
      return char;
    });
    this.saveCharacters(updatedCharacters);
  }
};

export default dataService;