(function () {
  const STORAGE_KEY = 'learn.rescue-app.v1';

  function defaultState() {
    return {
      completedModules: {},
      quizResults: {},
      theme: null,
      lastVisited: null,
    };
  }

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) {
      return defaultState();
    }
  }

  function writeState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // localStorage no disponible (modo privado, cuota llena): la guía sigue
      // funcionando en memoria para esta carga, solo no persiste el progreso.
    }
  }

  const state = readState();

  window.Learn = window.Learn || {};
  window.Learn.store = {
    isModuleComplete(moduleId) {
      return !!state.completedModules[moduleId];
    },
    markModuleComplete(moduleId) {
      state.completedModules[moduleId] = true;
      writeState();
    },
    getQuizResult(moduleId) {
      return state.quizResults[moduleId] || null;
    },
    saveQuizResult(moduleId, result) {
      state.quizResults[moduleId] = result;
      writeState();
    },
    getTheme() {
      return state.theme;
    },
    setTheme(theme) {
      state.theme = theme;
      writeState();
    },
    getLastVisited() {
      return state.lastVisited;
    },
    setLastVisited(moduleId) {
      state.lastVisited = moduleId;
      writeState();
    },
    getAllState() {
      return state;
    },
  };
})();
