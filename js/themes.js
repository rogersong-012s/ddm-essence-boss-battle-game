(function (global) {
  'use strict';

  function create(ballDiameterForLevel) {
    const WARM_LEVELS = [
      null,
      { diameter: ballDiameterForLevel(1), color: '#FCEEE8', highlight: '#FFF9F5', shadow: '#EBDAD7', eyeColor: '#FFFCF9', eyeOutlineColor: '#DFA6A2', pupilColor: '#764B53', cheekColor: 'rgba(220,132,141,.34)', labelColor: '#875B61', badgeFill: 'rgba(255,250,247,.72)', faceColor: '#875B61', face: 'calm', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .2, labelFont: 9 },
      { diameter: ballDiameterForLevel(2), color: '#F9E1D7', highlight: '#FFF5EF', shadow: '#EBCBC1', eyeColor: '#FFFCF8', eyeOutlineColor: '#D99A97', pupilColor: '#74474F', cheekColor: 'rgba(220,125,138,.34)', labelColor: '#8C565B', badgeFill: 'rgba(255,249,245,.68)', faceColor: '#8C565B', face: 'smile', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .22, labelFont: 12 },
      { diameter: ballDiameterForLevel(3), color: '#F6D1C2', highlight: '#FFEFE8', shadow: '#E7B6AA', eyeColor: '#FFFBF7', eyeOutlineColor: '#D48686', pupilColor: '#75434B', cheekColor: 'rgba(217,113,132,.34)', labelColor: '#945157', badgeFill: 'rgba(255,249,245,.62)', faceColor: '#945157', face: 'happy', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .24, labelFont: 13 },
      { diameter: ballDiameterForLevel(4), color: '#F2C0AF', highlight: '#FFE8E0', shadow: '#E0A698', eyeColor: '#FFF9F5', eyeOutlineColor: '#CB7E82', pupilColor: '#743F49', cheekColor: 'rgba(215,105,127,.33)', labelColor: '#94484F', badgeFill: 'rgba(255,248,244,.58)', faceColor: '#94484F', face: 'wink', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .22, labelFont: 14 },
      { diameter: ballDiameterForLevel(5), color: '#EEAE9B', highlight: '#FFE0D6', shadow: '#D78E84', eyeColor: '#FFF9F4', eyeOutlineColor: '#C87077', pupilColor: '#733B46', cheekColor: 'rgba(211,99,123,.32)', labelColor: '#8A454D', badgeFill: 'rgba(255,248,243,.56)', faceColor: '#8A454D', face: 'proud', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .25, labelFont: 16 },
      { diameter: ballDiameterForLevel(6), color: '#E99988', highlight: '#FFD7CE', shadow: '#D27A75', eyeColor: '#FFF9F5', eyeOutlineColor: '#C96C72', pupilColor: '#703A45', cheekColor: 'rgba(219,112,132,.32)', labelColor: '#80434B', badgeFill: 'rgba(255,247,243,.5)', faceColor: '#80434B', face: 'mischief', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .23, labelFont: 18 },
      { diameter: ballDiameterForLevel(7), color: '#E28379', highlight: '#FFC9C3', shadow: '#C96769', eyeColor: '#FFF8F4', eyeOutlineColor: '#F0B0AB', pupilColor: '#713940', cheekColor: 'rgba(255,175,179,.34)', labelColor: '#FFF8F4', badgeFill: 'rgba(132,48,55,.44)', faceColor: '#FFF5F0', face: 'confident', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .22, labelFont: 20 },
      { diameter: ballDiameterForLevel(8), color: '#D96E69', highlight: '#F7B4AF', shadow: '#BE595F', eyeColor: '#FFF8F3', eyeOutlineColor: '#EBA7A4', pupilColor: '#6F3741', cheekColor: 'rgba(255,185,187,.32)', labelColor: '#FFF8F4', badgeFill: 'rgba(111,41,51,.4)', faceColor: '#FFF3EE', face: 'gentle', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .2, labelFont: 22 },
      { diameter: ballDiameterForLevel(9), color: '#CC5C5D', highlight: '#EF9997', shadow: '#AF4C58', eyeColor: '#FFF8F4', eyeOutlineColor: '#E59A9B', pupilColor: '#68323D', cheekColor: 'rgba(255,190,190,.3)', labelColor: '#FFF8F4', badgeFill: 'rgba(95,32,45,.4)', faceColor: '#FFF3EF', face: 'confident', faceScale: 1, eyeScale: .19, eyeHeightScale: .24, eyeOffset: .32, mouthScale: .23, labelFont: 24 }
    ];

    const RAINBOW_COLORS = [
      null,
      { color: '#EF89AB', highlight: '#FFD3E1', shadow: '#D36B8D', outlineColor: 'rgba(255,248,251,.68)', eyeColor: '#FFFCF9', eyeOutlineColor: '#C76387', pupilColor: '#653B4D', cheekColor: 'rgba(207,74,109,.26)', labelColor: '#704252', badgeFill: 'rgba(255,251,252,.76)', faceColor: '#704252' },
      { color: '#F18477', highlight: '#FFD1C0', shadow: '#D5635D', outlineColor: 'rgba(255,249,247,.68)', eyeColor: '#FFFCF8', eyeOutlineColor: '#CE6B65', pupilColor: '#663E49', cheekColor: 'rgba(213,87,93,.26)', labelColor: '#78454B', badgeFill: 'rgba(255,250,246,.74)', faceColor: '#78454B' },
      { color: '#F3A15F', highlight: '#FFE0B1', shadow: '#D77F44', outlineColor: 'rgba(255,249,244,.68)', eyeColor: '#FFFCF7', eyeOutlineColor: '#CF793F', pupilColor: '#69414A', cheekColor: 'rgba(209,104,94,.25)', labelColor: '#70464D', badgeFill: 'rgba(255,250,245,.76)', faceColor: '#70464D' },
      { color: '#E7C45D', highlight: '#FFF0AE', shadow: '#C8A543', outlineColor: 'rgba(255,252,241,.72)', eyeColor: '#FFFCF5', eyeOutlineColor: '#C7A441', pupilColor: '#49444D', cheekColor: 'rgba(224,102,119,.26)', labelColor: '#514750', badgeFill: 'rgba(255,252,242,.78)', faceColor: '#514750' },
      { color: '#94C56E', highlight: '#DDF0B4', shadow: '#6E9D56', outlineColor: 'rgba(250,255,241,.7)', eyeColor: '#FFFCF5', eyeOutlineColor: '#78A752', pupilColor: '#36523D', cheekColor: 'rgba(226,113,129,.28)', labelColor: '#405842', badgeFill: 'rgba(250,255,244,.76)', faceColor: '#405842' },
      { color: '#67BBC5', highlight: '#C7EBEE', shadow: '#438E9C', outlineColor: 'rgba(244,255,255,.72)', eyeColor: '#FFFCF8', eyeOutlineColor: '#4B9DA9', pupilColor: '#31535D', cheekColor: 'rgba(236,130,148,.27)', labelColor: '#345766', badgeFill: 'rgba(246,255,255,.76)', faceColor: '#345766' },
      { color: '#7298D9', highlight: '#CBDBF6', shadow: '#506DA9', outlineColor: 'rgba(246,250,255,.72)', eyeColor: '#FFF9F3', eyeOutlineColor: '#AFC4EA', pupilColor: '#4B5682', cheekColor: 'rgba(255,178,190,.34)', labelColor: '#FFF9F3', badgeFill: 'rgba(46,67,120,.4)', faceColor: '#FFF7F1' },
      { color: '#8D82D1', highlight: '#D5CEF4', shadow: '#625BA8', outlineColor: 'rgba(250,248,255,.72)', eyeColor: '#FFF9F4', eyeOutlineColor: '#BDB4EA', pupilColor: '#4D477E', cheekColor: 'rgba(255,183,198,.32)', labelColor: '#FFF9F4', badgeFill: 'rgba(53,49,108,.4)', faceColor: '#FFF7F2' },
      { color: '#B174C2', highlight: '#E6C3F0', shadow: '#805397', outlineColor: 'rgba(255,249,255,.72)', eyeColor: '#FFFAF7', eyeOutlineColor: '#D0ADE0', pupilColor: '#543664', cheekColor: 'rgba(255,192,206,.3)', labelColor: '#FFF9F5', badgeFill: 'rgba(72,44,94,.42)', faceColor: '#FFF7F3' }
    ];

    const RAINBOW_LEVELS = [
      null,
      ...WARM_LEVELS.slice(1).map((level, index) => ({ ...level, ...RAINBOW_COLORS[index + 1] }))
    ];

    const BALL_THEMES = {
      warm: { name: '暖色系', swatch: 'linear-gradient(135deg, #FCEEE8 0%, #EEAE9B 55%, #CC5C5D 100%)', levels: WARM_LEVELS },
      rainbow: { name: '繽紛彩色', swatch: 'conic-gradient(#EF89AB 0deg, #F18477 50deg, #F3A15F 95deg, #E7C45D 140deg, #94C56E 185deg, #67BBC5 230deg, #7298D9 275deg, #8D82D1 320deg, #B174C2 360deg)', levels: RAINBOW_LEVELS }
    };

    return { WARM_LEVELS, RAINBOW_COLORS, RAINBOW_LEVELS, BALL_THEMES };
  }

  global.DDMGameThemes = Object.freeze({ create });
})(window);
