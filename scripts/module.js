/**
 * Sanctum Social Initiative
 *
 * In an encounter flagged as social, CPRCombatant.getInitiativeRoll is replaced by a
 * copy of CPR 0.92.4's own character/mook branch with four changes:
 *   1. The stat is COOL instead of REF.
 *   2. Active Effects on bonuses.initiative (Speedware) are not added.
 *   3. Role initiative mods (Solo Initiative Reaction) are not added.
 *   4. Charismatic Impact rank, plus Active Effects on bonuses.charismaticImpact, is added.
 * Everything else (the d10, criticals, Dice So Nice, the chat card, sorting, the tracker)
 * is still CPR's normal CPRCombat.rollInitiative and the core Combat Tracker.
 */
import { CPRInitiative } from "/systems/cyberpunk-red-core/modules/rolls/cpr-rolls.js";
import CPRMod from "/systems/cyberpunk-red-core/modules/rolls/cpr-modifiers.js";
import SystemUtils from "/systems/cyberpunk-red-core/modules/utils/cpr-systemUtils.js";
import { MODULE_ID, SOCIAL_FLAG, isSocialCombat, findCharismaticImpact } from "./social-initiative.js";

const TARGET = "CONFIG.Combatant.documentClass.prototype.getInitiativeRoll";

async function socialGetInitiativeRoll(wrapped, formula) {
  const { actor } = this.token;
  if (!isSocialCombat(this.combat) || !["character", "mook"].includes(actor?.type)) {
    return wrapped(formula);
  }

  const cprInitiative = new CPRInitiative(
    actor.name,
    formula,
    SystemUtils.Localize("CPR.global.stats.cool"),
    actor.getStat("cool")
  );

  const impact = findCharismaticImpact(actor);
  if (impact) {
    const effects = Array.from(actor.allApplicableEffects());
    const allMods = CPRMod.getAllModifiers(effects);
    const filteredMods = allMods.filter(
      (m) => !m.isSituational || (m.isSituational && m.onByDefault)
    );
    cprInitiative.addMod([{ value: impact.rank, source: impact.name }]);
    cprInitiative.addMod(CPRMod.getRelevantMods(filteredMods, SystemUtils.slugify(impact.name)));
  }

  await cprInitiative.roll();
  return cprInitiative;
}

function registerWrapper() {
  if (globalThis.libWrapper) {
    libWrapper.register(MODULE_ID, TARGET, socialGetInitiativeRoll, "MIXED");
    return;
  }
  const proto = CONFIG.Combatant.documentClass.prototype;
  const original = proto.getInitiativeRoll;
  proto.getInitiativeRoll = function getInitiativeRoll(...args) {
    return socialGetInitiativeRoll.call(this, original.bind(this), ...args);
  };
}

/** GM-only toggle in the tracker header: the one way to mark an encounter as social. */
function addSocialToggle(app, html) {
  if (!game.user.isGM) return;
  const combat = app.viewed;
  if (!combat) return;
  const root = html instanceof HTMLElement ? html : html[0];
  const nav = root?.querySelector("nav.encounters");
  if (!nav || nav.querySelector(".sit-toggle")) return;

  const social = isSocialCombat(combat);
  const button = document.createElement("a");
  button.className = `combat-button sit-toggle${social ? " active" : ""}`;
  button.dataset.tooltip = game.i18n.localize(social ? "SIT.Toggle.Disable" : "SIT.Toggle.Enable");
  button.innerHTML = '<i class="fas fa-comments"></i>';
  button.addEventListener("click", (event) => {
    event.preventDefault();
    combat.setFlag(MODULE_ID, SOCIAL_FLAG, !social);
  });
  nav.append(button);
}

Hooks.once("setup", registerWrapper);
Hooks.on("renderCombatTracker", addSocialToggle);
