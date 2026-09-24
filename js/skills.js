(function (global) {
  'use strict';

  function chooseMaxRewardSkill(ddmUses, sswUses, maxUses, random = Math.random) {
    const availableSkills = [];
    if (ddmUses < maxUses) availableSkills.push('ddm');
    if (sswUses < maxUses) availableSkills.push('ssw');
    if (!availableSkills.length) return null;
    const choiceIndex = Math.min(availableSkills.length - 1, Math.floor(random() * availableSkills.length));
    return availableSkills[choiceIndex];
  }

  global.DDMGameSkills = Object.freeze({ chooseMaxRewardSkill });
})(window);
