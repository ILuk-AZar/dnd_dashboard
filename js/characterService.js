import dataService from './dataService.js';

const characterService = {
  createCharacter: function(playerId, roomId = null) {
    return {
      id: Date.now().toString(),
      playerId,
      roomId,
      name: "Новый персонаж",
      class: "fighter",
      race: "human",
      level: 1,
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      description: "",
      inventory: ""
    };
  },

  saveCharacter: function(character) {
    const characters = dataService.getCharacters();
    const existingIndex = characters.findIndex(c => c.id === character.id);

    if (existingIndex !== -1) {
      characters[existingIndex] = character;
    } else {
      characters.push(character);
    }

    dataService.saveCharacters(characters);
    return character;
  },

  deleteCharacter: function(characterId) {
    const characters = dataService.getCharacters();
    const updatedCharacters = characters.filter(c => c.id !== characterId);
    dataService.saveCharacters(updatedCharacters);
  },

  getCharacterStats: function(character) {
    return {
      strength: character.strength,
      dexterity: character.dexterity,
      constitution: character.constitution,
      intelligence: character.intelligence,
      wisdom: character.wisdom,
      charisma: character.charisma
    };
  }
};

export default characterService;