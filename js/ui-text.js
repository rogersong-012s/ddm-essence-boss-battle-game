(function (global, document) {
  'use strict';

  // Player-facing copy lives by locale so another translation can be added
  // without mixing translated strings into gameplay modules.
  const UI_TEXT = Object.freeze({
    'zh-Hant': Object.freeze({
      document: {
        title: 'DDM Essence Merge — Melanin Boss Battle',
        description: '合成 DDM 精華累積能量，由玩家角色討伐黑色素 Boss。'
      },
      game: {
        label: 'DDM 精華合成戰鬥遊戲',
        canvasLabel: 'DDM 精華合成戰場，移動游標選擇位置，點擊放下 DDM 精華',
        headerKicker: 'DDM ESSENCE BATTLE',
        titleEssence: 'ESSENCE',
        titleMerge: 'MERGE',
        headerNote: '合成・蓄能・討伐',
        restart: '重新開始',
        controlMove: '移動選位置',
        controlDrop: '點擊放下',
        controlTouch: '觸控也可以玩'
      },
      player: {
        label: 'PLAYER',
        namePrefix: 'DDM 守衛+',
        role: '玩家角色，面向黑色素 Boss',
        visualAlt: '面向右側、手持精華能量杖的可愛護膚守衛'
      },
      boss: {
        label: 'RAID BOSS',
        hp: 'BOSS HP',
        hpBar: 'Boss 生命值',
        whiteScore: 'WHITE SCORE',
        unknown: 'BOSS',
        targetRoleDefault: '黑色素 Boss 敵方目標',
        targetRole: '{name} 敵方目標',
        visualAlt: '黑色素暴君',
        transitionDefeated: '{name} 擊破！',
        transitionNext: 'NEXT BOSS · {name} 即將出現',
        transitionTitleFallback: 'BOSS 擊破！',
        transitionNextFallback: '下一隻 BOSS 即將出現',
        transitionRegularKicker: 'BOSS DEFEATED',
        transitionFinalKicker: 'FINAL BOSS DEFEATED',
        transitionFinalNext: '所有黑色素 Boss 已擊破！'
      },
      attack: {
        damage: '−{damage}',
        whiteScore: '+{damage}'
      },
      canvas: {
        dangerLine: '危險線',
        max: 'MAX',
        level: 'LV{level}'
      },
      next: {
        group: '下一顆與技能資訊',
        section: '下一顆精華預覽',
        card: '下一顆 DDM 精華',
        kicker: 'NEXT',
        label: '下一顆',
        level: 'LV {level}',
        preview: '下一顆 DDM 精華：Lv {level}'
      },
      rules: {
        maxAria: 'Lv9 MAX 合成規則',
        maxTitle: 'LV 9 (MAX) 精華',
        maxDescription: '合成後精華會消除，並隨機補充 1 次技能。',
        maxWhiteDescription: 'MAX 合成只補充 DDM，不再補充 SSW+1。',
        maxReward: '合成後精華會消除，並隨機補充 1 次技能。'
      },
      skills: {
        group: '技能',
        ddmAria: '直接使用DDM',
        ddmTitle: '直接使用 DDM',
        ddmDescription: '標準傷害 × 25%',
        ddmHint: '選取精華，轉化為攻擊能量',
        ddmSelectedHint: '點選非 MAX 精華，造成其標準傷害的 25%',
        ddmEmptyHint: 'MAX 合成可補充技能次數',
        ddmTooHigh: '最高等級精華無法直接使用DDM，請選取非 MAX 精華',
        ddmUsesEmpty: '{skill} 次數用完了；MAX 合成可補充技能次數！',
        ddmUsesAria: '直接使用DDM，持有 {uses} 次，上限 {max} 次',
        sswAria: '使用SSW+1',
        sswTitle: '使用 SSW+1',
        sswDescription: '使用在Lv 8時不觸發獎勵',
        sswHint: '選取一顆精華提升一級',
        sswSelectedHint: '點選精華升級一階，不造成傷害',
        sswWhiteEmptyHint: 'WHITE MODE 不會補充 SSW+1',
        sswTooHigh: '已是最高等級',
        sswCompleted: 'SSW+1 強化完成：Lv {from} → Lv {to}',
        sswUsesAria: '使用SSW+1，持有 {uses} 次，上限 {max} 次',
        ddmResult: 'DDM 精華轉化為攻擊能量：{result}',
        ddmHpResult: '−{damage} HP',
        ddmWhiteResult: 'WHITE SCORE +{damage}',
        modeBanner: '選取一顆 DDM 精華使用技能',
        cancel: '取消技能選取',
        ddmMode: '選取一顆非 MAX DDM 精華，轉為攻擊能量（標準傷害的 25%）',
        sswMode: '選取一顆 DDM 精華直接升級一階，不造成傷害',
        emptySelection: '選取精華，轉化為攻擊能量',
        emptySswSelection: '選取一顆精華提升一級',
        count: '× {uses} / {max}'
      },
      theme: {
        selector: '精華色系切換',
        label: '精華色系',
        choose: '選擇精華的色系',
        current: '精華色系切換，目前為{theme}',
        select: '切換至{theme}',
        warm: '暖色系',
        rainbow: '繽紛彩色'
      },
      toast: {
        physicsError: '物理引擎載入失敗，請確認網路連線後重新整理。',
        maxSsw: 'SSW+1 強化抵達 MAX！',
        maxMerge: 'MAX DDM 精華合成完成！',
        playerLevelUp: '升級：DDM分子效率提升，分子尺寸-2%',
        maxRewardAllCapped: 'MAX 合成獎勵：技能次數皆已達上限',
        maxRewardDdmCapped: 'WHITE MODE MAX 獎勵：DDM 次數已達上限',
        maxReward: '{prefix}{skill} 次數 +1（目前 ×{uses}）',
        maxRewardPrefix: 'MAX 合成獎勵：',
        whiteMaxRewardPrefix: 'WHITE MODE MAX 獎勵：',
        mergeBusy: '這顆 DDM 精華正在合成，等一下再試！',
        ddmName: '直接使用DDM',
        sswName: '使用SSW+1',
        ddmUpgrade: 'DDM',
        sswUpgrade: 'SSW+1',
        maxMergeSsw: 'SSW+1 強化抵達 MAX！',
        ddmMerge: 'MAX DDM 精華合成完成！',
        skillMaxReached: '技能次數已達上限！',
        debugSkillUses: '測試補充技能次數：DDM ×{ddm}・SSW+1 ×{ssw}',
        spawnedLevel: 'Lv {level} DDM 精華'
      },
      combo: 'COMBO ×{count}',
      level: 'LV {level}',
      count: '× {uses} / {max}',
      end: {
        dialogLabel: '遊戲結算',
        eyebrow: '戰鬥結束',
        title: '這回合結束了',
        copy: '重新整理能量，再來挑戰黑色素暴君。',
        highest: '本局最高等級',
        continue: '繼續遊戲',
        startWhiteMode: '開始 WHITE MODE',
        restart: '重開一局',
        defeatBadge: '↻',
        defeatEyebrow: '再接再厲',
        defeatTitle: '好可惜，再挑戰一次吧！',
        defeatCopy: '這場連續 Boss 挑戰尚未完成，重新整隊後再來一戰。',
        victoryBadge: '✦',
        victoryEyebrow: '挑戰完成',
        victoryTitle: '勝利！五隻 Boss 全部擊破！',
        victoryCopy: 'DDM 精華能量成功發揮效果。你可以繼續累積 WHITE SCORE，或重開一局。',
        continuedBadge: '★',
        continuedEyebrow: '續戰完成',
        continuedTitle: '表現很棒！',
        continuedCopy: '你已經擊敗全部五隻 Boss，還在勝利後繼續奮戰，累積 WHITE SCORE {score}。',
        whiteRulesEyebrow: '續戰規則',
        whiteRulesTitle: 'WHITE MODE',
        whiteRulesCopy: '進入 WHITE MODE 後，Lv9（MAX）的技能獎勵只會補充 DDM，不再補充 SSW+1。挑戰更高 WHITE SCORE！'
      },
      orientation: {
        title: '建議使用直向模式',
        copy: '請將裝置轉回直向，讓遊戲與操作區完整顯示。'
      }
    })
  });

  let locale = 'zh-Hant';

  function get(path, values = {}) {
    const value = path.split('.').reduce((current, key) => current?.[key], UI_TEXT[locale]);
    if (value == null) return path;
    return String(value).replace(/\{([^}]+)\}/g, (_, key) => String(values[key] ?? ''));
  }

  function applyStaticText(root = document) {
    root.querySelectorAll('[data-ui-text]').forEach((element) => {
      element.textContent = get(element.dataset.uiText);
    });
    root.querySelectorAll('[data-ui-aria]').forEach((element) => {
      element.setAttribute('aria-label', get(element.dataset.uiAria));
    });
    root.querySelectorAll('[data-ui-title]').forEach((element) => {
      element.setAttribute('title', get(element.dataset.uiTitle));
    });
    root.querySelectorAll('[data-ui-content]').forEach((element) => {
      element.setAttribute('content', get(element.dataset.uiContent));
    });
    const title = root.querySelector('title[data-ui-text]');
    if (title) document.title = title.textContent;
    document.documentElement.lang = locale;
  }

  applyStaticText();
  global.DDMGameText = Object.freeze({ locale, get, applyStaticText });
})(window, document);
