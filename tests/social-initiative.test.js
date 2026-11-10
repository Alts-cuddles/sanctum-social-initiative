import assert from "node:assert/strict";
import { MODULE_ID, SOCIAL_FLAG, isSocialCombat, findCharismaticImpact } from "../scripts/social-initiative.js";

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

const role = (system) => ({ type: "role", system: { abilities: [], ...system } });
const actor = (...roles) => ({ itemTypes: { role: roles } });

test("flag off means normal combat", () => {
  assert.equal(isSocialCombat(null), false);
  assert.equal(isSocialCombat({ flags: {} }), false);
});

test("flag on means social", () => {
  assert.equal(isSocialCombat({ flags: { [MODULE_ID]: { [SOCIAL_FLAG]: true } } }), true);
  assert.equal(isSocialCombat({ getFlag: (m, k) => m === MODULE_ID && k === SOCIAL_FLAG }), true);
});

test("Rockerboy main ability rank is found", () => {
  assert.deepEqual(
    findCharismaticImpact(actor(role({ mainRoleAbility: "Charismatic Impact", rank: 4 }))),
    { name: "Charismatic Impact", rank: 4 }
  );
});

test("no Rockerboy role gives null", () => {
  assert.equal(findCharismaticImpact(actor(role({ mainRoleAbility: "Combat Awareness", rank: 6 }))), null);
  assert.equal(findCharismaticImpact({}), null);
});

test("Solo Initiative Reaction sub-ability is never picked up", () => {
  const solo = role({
    mainRoleAbility: "Combat Awareness",
    rank: 6,
    abilities: [{ name: "Initiative Reaction", rank: 3 }],
  });
  assert.equal(findCharismaticImpact(actor(solo)), null);
});

test("multiclass takes the highest Charismatic Impact rank", () => {
  const a = role({ mainRoleAbility: "Charismatic Impact", rank: 2 });
  const b = role({ mainRoleAbility: "Moto", rank: 5, abilities: [{ name: "Charismatic Impact", rank: 3 }] });
  assert.equal(findCharismaticImpact(actor(a, b)).rank, 3);
});

console.log(`${passed} tests passed`);
