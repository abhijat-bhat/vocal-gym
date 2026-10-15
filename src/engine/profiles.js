import GENERATED from './data/profiles.generated.js';

/* Vocal Gym engine · raga profiles for the kalpana generator
   The table is compiled from data/raga-profiles.json by scripts/compile-profiles.js, so the browser
   never parses the JSON. getProfile(ragaId) returns a raga's compiled entry or null.
   setProfiles(table) swaps in another table (tests, future teacher-edited profiles);
   setProfiles(null) restores the compiled one. */
let TABLE = GENERATED;

function getProfile(raga) {
  const id = raga && typeof raga === 'object' ? raga.id : raga;
  return (id != null && Object.prototype.hasOwnProperty.call(TABLE, id) && TABLE[id]) || null;
}
function setProfiles(table) {
  TABLE = table == null ? GENERATED : table;
}

export { getProfile, setProfiles };
