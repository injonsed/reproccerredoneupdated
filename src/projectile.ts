import {
    getWinningLinksTo, updateHasPerkCondition,
    createGetItemCountCondition, SkyrimForms
} from "./core";
import { LocData } from "./localization";

export default class ProjectilePatcher {

    names: { [key: string]: string; };
    editorIds: { [key: string]: number; };

    helpers: xelibHelpers;
    locals: any;
    patchFile: handle;
    rules: any;
    settings: DefaultSettings;
    lang: string;

    patch: PatchFunction;
    load: FilterEntry;

    constructor(helpers: xelibHelpers, locals: any, pf: handle, settings: DefaultSettings) {
        this.names = {};
        this.editorIds = {};

        this.helpers = helpers;
        this.patchFile = pf;
        this.rules = locals.rules.projectiles;
        this.settings = settings;
        this.lang = settings.lang;

        this.load = {
            filter: this.filterFunc.bind(this),
            signature: 'AMMO'
        };
        this.patch = this.patchFunc.bind(this);
    }

    newEditorId(id: string): string {
        if (this.editorIds[id] === undefined)
            this.editorIds[id] = 0;

        this.editorIds[id] += 1;
        return "".concat(id).concat(String(this.editorIds[id]));
    }

    filterFunc(record: handle): boolean {
        if (!this.settings.projectiles.enabled)
            return false;

        var name = xelib.FullName(record);

        if (!name)
            return false;

        var edid = xelib.EditorID(record);
        if (this.rules.excludedAmmunition.find((ex: string) => {
            return (name.includes(ex) || edid.includes(ex));
        }))
            return false;

        if (!this.rules.baseStats.find((bs: IProjectileStats) => {
            return (name.includes(bs.identifier) || edid.includes(bs.identifier));
        }))
            return false;

        return true;
    }

    patchFunc(record: handle): void {
        this.names[record] = xelib.FullName(record);

        this.patchStats(record);

        if (!xelib.GetFlag(record, 'DATA\\Flags', 'Non-Playable'))
            this.addVariants(record);
    }

    createStrongAmmo(ammo: handle): handle {
        const tag = "Strong";
        var newName = "".concat(this.names[ammo], " - ", LocData.projectile[tag].name[this.lang]);
        var newEditorId = this.newEditorId("REP_STRONG_AMMO_".concat(xelib.EditorID(ammo)));
        var strongAmmo = xelib.CopyElement(ammo, this.patchFile, true);

        this.names[strongAmmo] = newName;
        xelib.AddElementValue(strongAmmo, 'EDID', newEditorId);
        xelib.AddElementValue(strongAmmo, 'FULL', newName);
        this.patchStats(strongAmmo);
        this.helpers.cacheRecord(strongAmmo, newEditorId);
        return strongAmmo;
    }

    createStrongestAmmo(ammo: handle): handle {
        const tag = "Strongest";
        var newName = "".concat(this.names[ammo], " - ", LocData.projectile[tag].name[this.lang]);
        var newEditorId = this.newEditorId("REP_STRONGEST_AMMO_".concat(xelib.EditorID(ammo)));
        var strongestAmmo = xelib.CopyElement(ammo, this.patchFile, true);

        this.names[strongestAmmo] = newName;
        xelib.AddElementValue(strongestAmmo, 'EDID', newEditorId);
        xelib.AddElementValue(strongestAmmo, 'FULL', newName);
        this.patchStats(strongestAmmo);
        this.helpers.cacheRecord(strongestAmmo, newEditorId);
        return strongestAmmo;
    }

    createExplosiveAmmo(ammo: handle, explosion: string, type: string, desc: string): handle {
        var newName = "".concat(this.names[ammo], " - ", LocData.projectile[type].name[this.lang]);
        var newEditorId = this.newEditorId("REP_EXP_".concat(xelib.EditorID(ammo)));
        var newAmmo = xelib.CopyElement(ammo, this.patchFile, true);

        this.names[newAmmo] = newName;
        xelib.AddElementValue(newAmmo, 'EDID', newEditorId);
        xelib.AddElementValue(newAmmo, 'FULL', newName);
        xelib.AddElementValue(newAmmo, 'DESC', desc);
        this.patchStats(newAmmo);

        var projectile = xelib.GetLinksTo(newAmmo, 'DATA\\Projectile');
        xelib.SetFlag(projectile, 'DATA\\Flags', 'Explosion', true);
        xelib.SetFlag(projectile, 'DATA\\Flags', 'Alt. Trigger', false);
        xelib.SetValue(projectile, 'DATA\\Explosion', explosion);
        this.helpers.cacheRecord(newAmmo, newEditorId);
        return newAmmo;
    }

    createExplodingAmmo(ammo: handle): handle {
        const tag = "Explosive";
        var desc = LocData.projectile[tag].desc[this.lang];

        return this.createExplosiveAmmo(ammo, SkyrimForms.expExploding, tag, desc);
    }

    createTimebombAmmo(ammo: handle): handle {
        const tag = "Timebomb";
        var timer = 3;
        var newName = "".concat(this.names[ammo], " - ", LocData.projectile[tag].name[this.lang]);
        var newEditorId = this.newEditorId("REP_TIMEBOMB_".concat(xelib.EditorID(ammo)));
        var timebombAmmo = xelib.CopyElement(ammo, this.patchFile, true);

        this.names[timebombAmmo] = newName;
        xelib.AddElementValue(timebombAmmo, 'EDID', newEditorId);
        xelib.AddElementValue(timebombAmmo, 'FULL', newName);
        xelib.AddElementValue(timebombAmmo, 'DESC', LocData.projectile[tag].desc[this.lang]);
        this.patchStats(timebombAmmo);

        var projectile = getWinningLinksTo(timebombAmmo, 'DATA\\Projectile');
        if (!projectile)
            return timebombAmmo;
        xelib.SetFlag(projectile, 'DATA\\Flags', 'Explosion', true);
        xelib.SetFlag(projectile, 'DATA\\Flags', 'Alt. Trigger', true);
        xelib.SetFloatValue(projectile, 'DATA\\Explosion - Alt. Trigger - Timer', timer);
        xelib.SetValue(projectile, 'DATA\\Explosion', SkyrimForms.expTimebomb);
        this.helpers.cacheRecord(timebombAmmo, newEditorId);
        return timebombAmmo;
    }

    createFrostAmmo(ammo: handle): handle {
        const tag = "Frost";
        var desc = LocData.projectile[tag].desc[this.lang];

        return this.createExplosiveAmmo(ammo, SkyrimForms.expElementalFrost, tag, desc);
    }

    createFireAmmo(ammo: handle): handle {
        const tag = "Fire";
        var desc = LocData.projectile[tag].desc[this.lang];

        return this.createExplosiveAmmo(ammo, SkyrimForms.expElementalFire, tag, desc);
    }

    createShockAmmo(ammo: handle): handle {
        const tag = "Shock";
        var desc = LocData.projectile[tag].desc[this.lang];

        return this.createExplosiveAmmo(ammo, SkyrimForms.expElementalShock, tag, desc);
    }

    createBarbedAmmo(ammo: handle): handle {
        const tag = "Barbed";
        var desc = LocData.projectile[tag].desc[this.lang];

        return this.createExplosiveAmmo(ammo, SkyrimForms.expBarbed, tag, desc);
    }

    createHeavyweightAmmo(ammo: handle): handle {
        const tag = "Heavyweight";
        var desc = LocData.projectile[tag].desc[this.lang];

        return this.createExplosiveAmmo(ammo, SkyrimForms.expHeavyweight, tag, desc);
    }

    createLightsourceAmmo(ammo: handle): handle {
        const tag = "Lightsource";
        var newName = "".concat(this.names[ammo], " - ", LocData.projectile[tag].name[this.lang]);
        var newEditorId = this.newEditorId("REP_LIGHTSOURCE_".concat(xelib.EditorID(ammo)));
        var lightsourceAmmo = xelib.CopyElement(ammo, this.patchFile, true);

        this.names[lightsourceAmmo] = newName;
        xelib.AddElementValue(lightsourceAmmo, 'EDID', newEditorId);
        xelib.AddElementValue(lightsourceAmmo, 'FULL', newName);
        xelib.AddElementValue(lightsourceAmmo, 'DESC', LocData.projectile[tag].desc[this.lang]);
        this.patchStats(lightsourceAmmo);

        var projectile = xelib.GetWinningOverride(xelib.GetLinksTo(lightsourceAmmo, 'DATA\\Projectile'));
        xelib.SetValue(projectile, 'DATA\\Light', SkyrimForms.lightLightsource);
        this.helpers.cacheRecord(lightsourceAmmo, newEditorId);
        return lightsourceAmmo;
    }

    createNoisemakerAmmo(ammo: handle): handle {
        const tag = "Noisemaker";
        var desc = LocData.projectile[tag].desc[this.lang];

        return this.createExplosiveAmmo(ammo, SkyrimForms.expNoisemaker, tag, desc);
    }

    createNeuralgiaAmmo(ammo: handle): handle {
        const tag = "Neuralgia";
        var desc = LocData.projectile[tag].desc[this.lang];

        return this.createExplosiveAmmo(ammo, SkyrimForms.expNeuralgia, tag, desc);
    }

    addCraftingRecipe(baseAmmo: handle, newAmmo: handle, secondaryIngredients: Array<string>, requiredPerks: Array<string>): void {
        var ammoReforgeInputCount = 10;
        var ammoReforgeOutputCount = 10;
        var secondaryIngredientInputCount = 1;

        var newRecipe = xelib.AddElement(this.patchFile, 'Constructible Object\\COBJ');
        xelib.AddElementValue(newRecipe, 'EDID', "REP_CRAFT_AMMO_".concat(xelib.EditorID(newAmmo)));
        xelib.AddElement(newRecipe, 'Items');

        var baseItem = xelib.GetElement(newRecipe, 'Items\\[0]');
        xelib.SetValue(baseItem, 'CNTO\\Item', xelib.GetHexFormID(baseAmmo));
        xelib.SetUIntValue(baseItem, 'CNTO\\Count', ammoReforgeInputCount);

        secondaryIngredients.forEach((ingredient) => {
            var secondaryItem = xelib.AddElement(newRecipe, 'Items\\.');
            xelib.SetValue(secondaryItem, 'CNTO\\Item', ingredient);
            xelib.SetUIntValue(secondaryItem, 'CNTO\\Count', secondaryIngredientInputCount);
        });
        xelib.AddElementValue(newRecipe, 'BNAM', SkyrimForms.kwCraftingSmithingForge);
        xelib.AddElementValue(newRecipe, 'NAM1', "".concat(String(ammoReforgeOutputCount)));
        xelib.AddElementValue(newRecipe, 'CNAM', xelib.GetHexFormID(newAmmo));
        xelib.AddElement(newRecipe, 'Conditions');
        requiredPerks.forEach((perk, index) => {
            var condition: handle;

            if (index === 0) {
                condition = xelib.GetElement(newRecipe, 'Conditions\\[0]');
            } else {
                condition = xelib.AddElement(newRecipe, 'Conditions\\.');
            }

            updateHasPerkCondition(newRecipe, condition, 10000000, 1, perk);
        });
        createGetItemCountCondition(newRecipe, 11000000, ammoReforgeInputCount, baseAmmo);
    }

    createCrossbowOnlyVariants(ammo: handle): void {
        var ingredients = [];
        var perks = [];

        var fireAmmo = this.createFireAmmo(ammo);
        ingredients = [SkyrimForms.pettySoulGem, SkyrimForms.fireSalt];
        perks = [SkyrimForms.perkEnchantingElementalBombard0];
        this.addCraftingRecipe(ammo, fireAmmo, ingredients, perks);

        var frostAmmo = this.createFrostAmmo(ammo);
        ingredients = [SkyrimForms.pettySoulGem, SkyrimForms.frostSalt];
        perks = [SkyrimForms.perkEnchantingElementalBombard0];
        this.addCraftingRecipe(ammo, frostAmmo, ingredients, perks);

        var shockAmmo = this.createShockAmmo(ammo);
        ingredients = [SkyrimForms.pettySoulGem, SkyrimForms.voidSalt];
        perks = [SkyrimForms.perkEnchantingElementalBombard0];
        this.addCraftingRecipe(ammo, shockAmmo, ingredients, perks);

        var neuralgiaAmmo = this.createNeuralgiaAmmo(ammo);
        ingredients = [SkyrimForms.pettySoulGem, SkyrimForms.deathBell];
        perks = [SkyrimForms.perkEnchantingElementalBombard1];
        this.addCraftingRecipe(ammo, neuralgiaAmmo, ingredients, perks);

        var barbedAmmo = this.createBarbedAmmo(ammo);
        ingredients = [SkyrimForms.ingotSteel, SkyrimForms.deathBell];
        perks = [SkyrimForms.perkMarksmanshipAdvancedMissilecraft1];
        this.addCraftingRecipe(ammo, barbedAmmo, ingredients, perks);

        var heavyweightAmmo = this.createHeavyweightAmmo(ammo);
        ingredients = [SkyrimForms.ingotSteel, SkyrimForms.boneMeal];
        perks = [SkyrimForms.perkMarksmanshipAdvancedMissilecraft2];
        this.addCraftingRecipe(ammo, heavyweightAmmo, ingredients, perks);
    }

    createVariants(ammo: handle): void {
        var ingredients = [];
        var perks = [];

        var explodingAmmo = this.createExplodingAmmo(ammo);
        ingredients = [SkyrimForms.ale, SkyrimForms.torchbugThorax];
        perks = [SkyrimForms.perkAlchemyFuse];
        this.addCraftingRecipe(ammo, explodingAmmo, ingredients, perks);

        var timebombAmmo = this.createTimebombAmmo(ammo);
        ingredients = [SkyrimForms.fireSalt, SkyrimForms.torchbugThorax];
        perks = [SkyrimForms.perkAlchemyAdvancedExplosives];
        this.addCraftingRecipe(ammo, timebombAmmo, ingredients, perks);

        var lightsourceAmmo = this.createLightsourceAmmo(ammo);
        ingredients = [SkyrimForms.torchbugThorax, SkyrimForms.leatherStrips];
        perks = [SkyrimForms.perkSneakThiefsToolbox0];
        this.addCraftingRecipe(ammo, lightsourceAmmo, ingredients, perks);

        var noisemakerAmmo = this.createNoisemakerAmmo(ammo);
        ingredients = [SkyrimForms.pettySoulGem, SkyrimForms.boneMeal];
        perks = [SkyrimForms.perkSneakThiefsToolbox0];
        this.addCraftingRecipe(ammo, noisemakerAmmo, ingredients, perks);

        var edid = xelib.EditorID(ammo);
        var found = this.rules.baseStats.find((bs: IProjectileStats) => {
            return edid.includes(bs.identifier) && bs.type !== 'ARROW';
        });

        if (found) {
            this.createCrossbowOnlyVariants(ammo);
        }
    }

    addVariants(ammo: handle): void {
        var name = this.names[ammo];
        var edid = xelib.EditorID(ammo).toUpperCase();

        if (this.rules.excludedAmmunitionVariants.find((v: string) => {
            return name.includes(v) || edid.includes(v.toUpperCase());
        })) {
            return;
        }

        this.createVariants(ammo);
        this.multiplyBolts(ammo);
    }

    multiplyBolts(ammo: handle): void {
        var edid = xelib.EditorID(ammo);

        var found = this.rules.baseStats.find((bs: IProjectileStats) => {
            return edid.includes(bs.identifier) && bs.type !== 'BOLT';
        });

        if (found)
            return;

        var secondaryIngredients = [];
        var requiredPerks = [];
        var strongAmmo = this.createStrongAmmo(ammo);
        secondaryIngredients = [SkyrimForms.ingotIron];
        requiredPerks = [SkyrimForms.perkMarksmanshipAdvancedMissilecraft0];
        this.addCraftingRecipe(ammo, strongAmmo, secondaryIngredients, requiredPerks);
        this.createVariants(strongAmmo);

        var strongestAmmo = this.createStrongestAmmo(ammo);
        secondaryIngredients = [SkyrimForms.ingotSteel, SkyrimForms.ingotIron];
        requiredPerks = [SkyrimForms.perkMarksmanshipAdvancedMissilecraft0];
        this.addCraftingRecipe(ammo, strongestAmmo, secondaryIngredients, requiredPerks);
        this.createVariants(strongestAmmo);
    }

    patchStats(ammo: handle): void {
        var calculateProjec = this.calculateProjectileStats(ammo);
        var newGravity = calculateProjec.gravity;
        var newSpeed = calculateProjec.speed;
        var newRange = calculateProjec.range;
        var newDamage = calculateProjec.damage;
        var failed = calculateProjec.failed;

        if (failed) {
            return;
        }

        var oldProjectile = getWinningLinksTo(ammo, 'DATA\\Projectile');
        if (!oldProjectile)
            return;

        var newEditorId = this.newEditorId("REP_PROJ_".concat(xelib.EditorID(ammo)));
        var newProjectile = xelib.CopyElement(oldProjectile, this.patchFile, true);
        xelib.AddElementValue(newProjectile, 'EDID', newEditorId);
        xelib.SetFloatValue(newProjectile, 'DATA\\Gravity', newGravity);
        xelib.SetFloatValue(newProjectile, 'DATA\\Speed', newSpeed);
        xelib.SetFloatValue(newProjectile, 'DATA\\Range', newRange);
        this.helpers.cacheRecord(newProjectile, newEditorId);
        xelib.SetValue(ammo, 'DATA\\Projectile', xelib.GetHexFormID(newProjectile));
        xelib.SetUIntValue(ammo, 'DATA\\Damage', newDamage);
    }

    calculateProjectileStats(ammo: handle): IProjectileStats {
        var name = this.names[ammo];
        var edid = xelib.EditorID(ammo);

        var newGravity = 0;
        var newSpeed = 0;
        var newRange = 0;
        var newDamage = 0;
        var failed = false;
        this.rules.baseStats.some((bs: IProjectileStats) => {
            if (!edid.includes(bs.identifier))
                return false;

            newGravity = bs.gravity;
            newSpeed = bs.speed;
            newRange = bs.range;
            newDamage = bs.damage;
            return true;
        });

        this.rules.materialStats.some((ms: IProjectileStats) => {
            if (edid.includes(ms.name) || (ms.edid && ms.edid !== null && edid.includes(ms.edid))) {
                newGravity += ms.gravity;
                newSpeed += ms.speed;
                newDamage += ms.damage;
                return true;
            } else
                return false;
        });

        this.rules.modifierStats.some((ms: IProjectileStats) => {
            if (name.includes(ms.name) || edid.includes(ms.name)) {
                newGravity += ms.gravity;
                newSpeed += ms.speed;
                newDamage += ms.damage;
                return true;
            } else
                return false
        });

        failed = newGravity <= 0 || newSpeed <= 0 || newRange <= 0 || newDamage <= 0;
        return {
            gravity: newGravity,
            speed: newSpeed,
            range: newRange,
            damage: newDamage,
            failed: failed
        };
    }
}
