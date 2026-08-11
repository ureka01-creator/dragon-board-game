(() => {
  /**
   * Layered retro paper-doll.
   * Base character intentionally wears only simple underclothes.
   * Future equipment system can set hero.equipment = { armor, weapon, accessory }
   * and the same renderer will place item layers over the body.
   */
  window.heroSpriteHTML = function heroSpriteHTML(hero, size = 'large') {
    const v = hero.visual || {};
    const equipment = hero.equipment || {};
    const armor = equipment.armor || 'none';
    const weapon = equipment.weapon || 'none';
    const accessory = equipment.accessory || 'none';

    return `
      <div class="pixel-hero ${size} hero-${hero.id} body-${v.body || 'lean'}"
           style="--skin:${v.skin || '#c98b63'};--hair:${v.hair || '#4a2b1f'};--hair2:${v.hair2 || '#261710'};--eye:${v.eye || '#ddd'}"
           data-armor="${armor}" data-weapon="${weapon}" data-accessory="${accessory}"
           aria-label="${hero.name} 캐릭터">
        <span class="px shadow"></span>
        <span class="px leg leg-l"></span><span class="px leg leg-r"></span>
        <span class="px foot foot-l"></span><span class="px foot foot-r"></span>
        <span class="px torso"></span>
        <span class="px underwear-top"></span><span class="px underwear-bottom"></span>
        <span class="px arm arm-l"></span><span class="px arm arm-r"></span>
        <span class="px hand hand-l"></span><span class="px hand hand-r"></span>
        <span class="px head"></span>
        <span class="px ear ear-l"></span><span class="px ear ear-r"></span>
        <span class="px hair hair-main"></span><span class="px hair hair-extra"></span>
        <span class="px eye eye-l"></span><span class="px eye eye-r"></span>
        <span class="px nose"></span>
        <span class="px class-mark"></span>
        <span class="px equip armor-layer"></span>
        <span class="px equip weapon-layer"></span>
        <span class="px equip accessory-layer"></span>
      </div>`;
  };
})();
