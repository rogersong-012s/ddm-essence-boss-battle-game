(function (global) {
  'use strict';

  function chooseMaxRewardSkill(ddmUses, sswUses, ddmMaxUses, sswMaxUses, gameMode = 'boss', random = Math.random) {
    if (gameMode === 'whiteScore') return ddmUses < ddmMaxUses ? 'ddm' : null;

    const availableSkills = [];
    if (ddmUses < ddmMaxUses) availableSkills.push('ddm');
    if (sswUses < sswMaxUses) availableSkills.push('ssw');
    if (!availableSkills.length) return null;
    const choiceIndex = Math.min(availableSkills.length - 1, Math.floor(random() * availableSkills.length));
    return availableSkills[choiceIndex];
  }

  global.DDMGameSkills = Object.freeze({ chooseMaxRewardSkill });
})(window);
