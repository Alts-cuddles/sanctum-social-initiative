/**
 * Pure helpers for Sanctum Social Initiative (no Foundry globals, so Node tests can import them).
 */

export const MODULE_ID = "sanctum-social-initiative";
export const SOCIAL_FLAG = "social";
export const CHARISMATIC_IMPACT = "Charismatic Impact";

/** True when the encounter carries this module's social flag. */
export function isSocialCombat(combat) {
  if (!combat) return false;
  if (typeof combat.getFlag === "function") return Boolean(combat.getFlag(MODULE_ID, SOCIAL_FLAG));
  return Boolean(combat.flags?.[MODULE_ID]?.[SOCIAL_FLAG]);
}

/**
 * Highest Charismatic Impact rank on the actor's role items, read the same way
 * CPRRole.getRoleRoll reads role ranks (main ability on system.rank, sub-abilities
 * on system.abilities[].rank). Returns null when the actor doesn't have it.
 */
export function findCharismaticImpact(actor) {
  const roles = Array.from(actor?.itemTypes?.role ?? []);
  let best = null;
  for (const role of roles) {
    const sys = role.system ?? {};
    const candidates = [];
    if (sys.mainRoleAbility === CHARISMATIC_IMPACT) {
      candidates.push({ name: sys.mainRoleAbility, rank: Number.parseInt(sys.rank, 10) || 0 });
    }
    for (const ability of sys.abilities ?? []) {
      if (ability?.name === CHARISMATIC_IMPACT) {
        candidates.push({ name: ability.name, rank: Number.parseInt(ability.rank, 10) || 0 });
      }
    }
    for (const c of candidates) if (!best || c.rank > best.rank) best = c;
  }
  return best;
}
