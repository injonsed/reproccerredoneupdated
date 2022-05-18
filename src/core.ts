var _typeof = (obj: any): any => {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = (obj: any) => {
            return typeof obj;
        };
    } else {
        _typeof = (obj): any => {
            return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
        };
    }

    return _typeof(obj);
}

export function _AwaitValue(value: any): void {
    this.wrapped = value;
}

export function _AsyncGenerator(gen: any) {
    var front: any, back: any;

    function send(key: string, arg: any) {
        return new Promise(function (resolve, reject) {
            var request = {
                key: key,
                arg: arg,
                resolve: resolve,
                reject: reject,
                next: null
            };

            if (back) {
                back = back.next = request;
            } else {
                front = back = request;
                resume(key, arg);
            }
        });
    }

    function resume(key: string, arg: any) {
        try {
            var result = gen[key](arg);
            var value = result.value;
            var wrappedAwait = value instanceof _AwaitValue;
            Promise.resolve(wrappedAwait ? value.wrapped : value).then(function (arg) {
                if (wrappedAwait) {
                    resume("next", arg);
                    return;
                }

                settle(result.done ? "return" : "normal", arg);
            }, function (err) {
                resume("throw", err);
            });
        } catch (err) {
            settle("throw", err);
        }
    }

    function settle(type: any, value: any) {
        switch (type) {
            case "return":
                front.resolve({
                    value: value,
                    done: true
                });
                break;

            case "throw":
                front.reject(value);
                break;

            default:
                front.resolve({
                    value: value,
                    done: false
                });
                break;
        }

        front = front.next;

        if (front) {
            resume(front.key, front.arg);
        } else {
            back = null;
        }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
        this.return = undefined;
    }
}

if (typeof Symbol === "function" && Symbol.asyncIterator) {
    _AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
        return this;
    };
}

_AsyncGenerator.prototype.next = function (arg: any) {
    return this._invoke("next", arg);
};

_AsyncGenerator.prototype.throw = function (arg: any) {
    return this._invoke("throw", arg);
};

_AsyncGenerator.prototype.return = function (arg: any) {
    return this._invoke("return", arg);
};

export function _classCallCheck(instance: any, Constructor: any): void {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

export function _defineProperties(target: any, props: any): void {
    for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}

export function _createClass(Constructor: any, protoProps: any, staticProps: any): any {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}

export function _defineProperty(obj: any, key: string, value: any): string {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }

    return obj;
}

export function overrideCraftingRecipes(cobj: Array<IRecipe>, armor: handle, bench: number,
                                        perk: string, input: string, patchFile: handle): void {
    var armorFormID = xelib.GetFormID(armor);
    cobj.forEach(function (recipe) {
        if (recipe.bnam !== bench || recipe.cnam !== armorFormID) {
            return;
        }

        var newRecipe = xelib.CopyElement(recipe.handle, patchFile);
        var baseItem = xelib.GetElement(newRecipe, 'Items\\[0]');
        xelib.SetValue(baseItem, 'CNTO\\Item', input);
    });
}

export function createHasPerkCondition(recipe: handle, type: string | number, value: any, perk: string): boolean | handle {
    var condition: handle;

    if (xelib.HasArrayItem(recipe, 'Conditions', 'CTDA\\Parameter #1', perk)) {
        return true;
    } else if (!xelib.GetElement(recipe, 'Conditions')) {
        xelib.AddElement(recipe, 'Conditions');
        condition = xelib.GetElement(recipe, 'Conditions\\[0]');
    } else {
        condition = xelib.AddElement(recipe, 'Conditions\\.');
    }

    updateHasPerkCondition(recipe, condition, type, value, perk);
    return condition;
}

export function getWinningLinksTo(rec: handle, path: string): handle {
    var ref = xelib.GetLinksTo(rec, path);
    return ref && xelib.GetWinningOverride(ref);
}

export function createGetEquippedCondition(recipe: handle, type: string | number, value: any, itemHandle: handle): handle {
    var condition = xelib.AddElement(recipe, 'Conditions\\.');
    xelib.SetValue(condition, 'CTDA\\Type', "".concat(String(type)));
    xelib.SetFloatValue(condition, 'CTDA\\Comparison Value - Float', value);
    xelib.SetValue(condition, 'CTDA\\Function', 'GetEquipped');
    xelib.SetValue(condition, 'CTDA\\Inventory Object', xelib.GetHexFormID(itemHandle));
    xelib.SetValue(condition, 'CTDA\\Run On', 'Subject');
    return condition;
}

export function updateHasPerkCondition(recipe: handle, condition: handle, type: string | number,
                                        value: any, perk: string, func = 'HasPerk'): void {
    xelib.SetValue(condition, 'CTDA\\Type', "".concat(String(type)));
    xelib.SetFloatValue(condition, 'CTDA\\Comparison Value - Float', value);
    xelib.SetValue(condition, 'CTDA\\Function', func);

    if (func === 'HasPerk') {
        xelib.SetValue(condition, 'CTDA\\Perk', perk);
    }

    xelib.SetValue(condition, 'CTDA\\Run On', 'Subject');
}

export function createGetItemCountCondition(recipe: handle, type: string | number, value: any, object: any): handle {
    var condition = xelib.AddElement(recipe, 'Conditions\\.');
    updateGetItemCountCondition(recipe, condition, type, value, object);
    return condition;
}

export function updateGetItemCountCondition(recipe: handle, condition: handle, type: string | number, value: any, object: any): void {
    xelib.SetValue(condition, 'CTDA\\Type', "".concat(String(type)));
    xelib.SetFloatValue(condition, 'CTDA\\Comparison Value - Float', value);
    xelib.SetValue(condition, 'CTDA\\Function', 'GetItemCount');
    xelib.SetValue(condition, 'CTDA\\Inventory Object', xelib.GetHexFormID(object));
    xelib.SetValue(condition, 'CTDA\\Run On', 'Subject');
}

export var includes = function includes(a: string, b: string): boolean {
    return a.includes(b);
};

export var equals = function equals(a: string | number, b: string | number): boolean {
    return a === b;
};

export var compare = function compare(a: string, b: string, inclusion: boolean): boolean {
    return inclusion ? includes(a, b) : equals(a, b);
};

export function getValueFromName<T>(collection: Array<IJSONElement>, name: string, field1: string, field2: string, inclusion = true): T {
    var minLength = 0;
    var value: T = null;
    collection.forEach(function (thing) {
        if (thing.edid && thing.edid !== null && name.includes(thing.edid) && thing[field1].length > minLength) {
            value = thing[field2];
            minLength = thing[field1].length;
        } else if (thing.edidMatch && name.match(thing.edidMatch) && thing[field1].length > minLength) {
            value = thing[field2];
            minLength = thing[field1].length;
        } else if (compare(name, thing[field1], inclusion) && thing[field1].length > minLength) {
            value = thing[field2];
            minLength = thing[field1].length;
        }
    });
    return value;
}

export function getModifierFromMap(map: Array<MaterialMap>, collection: Array<IJSONElement>, h: handle,
                                    field1: string, field2: string, inclusion = true): number {
    var modifier = null;
    map.some(function (e) {
        if (!xelib.HasArrayItem(h, 'KWDA', '', e.kwda)) {
            return false;
        }

        modifier = getValueFromName(collection, e.name, field1, field2, inclusion);
        if (modifier === null)
            modifier = getValueFromName(collection, xelib.EditorID(h), field1, field2, inclusion);
        return true;
    });
    return modifier;
}

export function getKwda(h: handle): kwdaCallback {
    return function (kwda: string) {
        return xelib.HasArrayItem(h, 'KWDA', '', kwda);
    };
}

export function addPerkScript(weapon: handle, scriptName: string, propertyName: string, perk: string): void {
    var vmad = xelib.AddElement(weapon, 'VMAD');
    xelib.SetIntValue(vmad, 'Version', 5);
    xelib.SetIntValue(vmad, 'Object Format', 2);
    var script = xelib.AddElement(vmad, 'Scripts\\.');
    xelib.SetValue(script, 'scriptName', scriptName);
    var property = xelib.AddElement(script, 'Properties\\.');
    xelib.SetValue(property, 'propertyName', propertyName);
    xelib.SetValue(property, 'Type', 'Object');
    xelib.SetValue(property, 'Flags', 'Edited');
    xelib.SetValue(property, 'Value\\Object Union\\Object v2\\FormID', perk);
    xelib.SetValue(property, 'Value\\Object Union\\Object v2\\Alias', 'None');
}

export function safeHasFlag(h: handle, path: string, flag: string): boolean {
    return xelib.HasElement(h, path.split('\\')[0]) && !xelib.GetFlag(h, path, flag);
}

export function safeHasArrayItem(h: handle, path: string, subPath: string, value: any): boolean {
    return xelib.HasElement(h, path) && xelib.HasArrayItem(h, path, subPath, value);
}

export function clamp(min: number, value: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function removeTemperingConditions(h: handle, arr: Array<MaterialMap>, perk: string): boolean {
    var filteredArray = arr.filter((e) => {
        if (!e.perk || !xelib.HasArrayItem(h, 'Conditions', 'CTDA\\Parameter #1', e.perk)) {
            return false;
        }

        return e.perk !== perk;
    });
    var condition = filteredArray.some((e) => {
        if (!xelib.HasArrayItem(h, 'Conditions', 'CTDA\\Parameter #1', perk)) {
            var cond = xelib.GetArrayItem(h, 'Conditions', 'CTDA\\Parameter #1', e.perk);
            updateHasPerkCondition(h, cond, 10000000, 1, perk);
        }

        xelib.RemoveArrayItem(h, 'Conditions', 'CTDA\\Parameter #1', e.perk);
        return false;
    });
    return condition;
}

export function getKeyword(elem: handle, val: string): string {
    const items = xelib.GetElements(elem, 'KWDA', false);
    var path: string;

    const res = items.some((v, i) => {
        path = `KWDA\\[${i}]`;
        return xelib.GetValue(elem, path).includes(val);
    });
    if (res)
        return path;
    else
        return null;
}

function isMergeableObject(value: any): boolean {
    return isNonNullObject(value) && !isSpecial(value);
}

function isNonNullObject(value: any): boolean {
    return !!value && _typeof(value) === 'object';
}

function isSpecial(value: any): boolean {
    // see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
    var stringValue = Object.prototype.toString.call(value);
    return stringValue === '[object RegExp]' || stringValue === '[object Date]' || isReactElement(value);
}


var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE$1 = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

function isReactElement(value: any): boolean {
    return value.$$typeof === REACT_ELEMENT_TYPE$1;
}

function emptyTarget(val: any): any {
    return Array.isArray(val) ? [] : {};
}

function cloneUnlessOtherwiseSpecified(value: any, options: any): any {
    return options.clone !== false && options.isMergeableObject(value) ? deepmerge(emptyTarget(value), value, options) : value;
}

function defaultArrayMerge(target: Array<any>, source: Array<any>, options: any): any {
    return target.concat(source).map(function (element) {
        return cloneUnlessOtherwiseSpecified(element, options);
    });
}

function getMergeFunction(key: string, options: any): any {
    if (!options.customMerge) {
        return deepmerge;
    }

    var customMerge = options.customMerge(key);
    return typeof customMerge === 'function' ? customMerge : deepmerge;
}

function getEnumerableOwnPropertySymbols(target: any): Array<any> {
    return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function (symbol) {
        return target.propertyIsEnumerable(symbol);
    }) : [];
}

function getKeys(target: Object): Array<any> {
    return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
}

function propertyIsOnObject(object: any, property: string): boolean {
    // Protects from prototype poisoning and unexpected merging up the prototype chain.
    try {
        return property in object;
    } catch (_) {
        return false;
    }
}


function propertyIsUnsafe(target: any, key: string): boolean {
    // Properties are safe to merge if they don't exist in the target yet,
    // unsafe if they exist up the prototype chain,
    // and also unsafe if they're nonenumerable.
    return propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key)
            && Object.propertyIsEnumerable.call(target, key));
}

function mergeObject(target: Object, source: Object, options: any): any {
    var destination = {};

    if (options.isMergeableObject(target)) {
        getKeys(target).forEach(function (key) {
            destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
        });
    }

    getKeys(source).forEach(function (key) {
        if (propertyIsUnsafe(target, key)) {
            return;
        }

        if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
            destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
        } else {
            destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
        }
    });
    return destination;
}

export function deepmerge(target: any, source: any, options: any = {}): any {
    options.arrayMerge = options.arrayMerge || defaultArrayMerge;
    options.isMergeableObject = options.isMergeableObject || isMergeableObject; // cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
    // implementations can use it. The caller may not replace it.

    options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
    var sourceIsArray = Array.isArray(source);
    var targetIsArray = Array.isArray(target);
    var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

    if (!sourceAndTargetTypesMatch) {
        return cloneUnlessOtherwiseSpecified(source, options);
    } else if (sourceIsArray) {
        return options.arrayMerge(target, source, options);
    } else {
        return mergeObject(target, source, options);
    }
}

deepmerge.all = function deepmergeAll(array: any, options: any): any {
    if (!Array.isArray(array)) {
        throw new Error('first argument should be an array');
    }

    return array.reduce(function (prev, next) {
        return deepmerge(prev, next, options);
    }, {});
};

/**
 * Only boolean values
*/
export const Flags = {
    /** ACBS */
    OppositeGenderAnim: 'Opposite Gender Anims'
};

export const Records = {
    /**
     * Value: object
    */
    Configuration: 'ACBS',
    ConfigurationFlags: 'ACBS\\Flags',
    /** Value: handle */
    AttackRace: 'ATKR',
    /**
     * Array
     * Fields:
     * PRKR\\[index]\\Perk
     * Value: handle
     * PRKR\\[index]\\Rank
     * Value: number
     * */
    Perks: 'PRKR',
    PerkValue: (index: number) => `PRKR\\[${index}]\\Perk`,
    PerkRank: (index: number) => `PRKR\\[${index}]\\Rank`,
    /** Object */
    AIData: 'AIDT',
    AIDTAggression: 'AIDT\\Aggression',
    AIDTConfidence: 'AIDT\\Confidence',
    AIDTEnergy: 'AIDT\\Energy Level',
    AIDTResponsibility: 'AIDT\\Responsibility',
    AIDTMood: 'AIDT\\Mood',
    AIDTAssistance: 'AIDT\\Assistance',
    /** Object */
    AIDTAggro: 'AIDT\\Aggro',
    AIDTAggroRadius: 'AIDT\\Aggro\\Aggro Radius Behavior',
    AIDTAggroWarn: 'AIDT\\Aggro\\Warn',
    AIDTAggroWarnAttack: 'AIDT\\Aggro\\Warn/Attack',
    AIDTAggroAttack: 'AIDT\\Aggro\\Attack',
    /** Value: handle */
    Class: 'CNAM',
    /**
     * Array
     * Value: handle
     * */
    Keywords: 'KWDA',
    Keyword: (index: number) => `KWDA\\${index}`,
    /** Value: string */
    Name: 'FULL',
    /** Value: string */
    ShortName: 'SHRT',
    /** Value: string */
    Description: 'DESC',
    /** Object */
    Data: 'DNAM',
    /** Value: string */
    DataSkill: 'DNAM\\Skill',
    /** Object */
    PlayerSkills: 'DNAM',
    /**
     * Array
     * Value: number
     * Length: 18
     * */
    PlayerSkillValues: 'DNAM\\Skill Values',
    PlayerSkillValue: (index: number) => `DNAM\\Skill Values\\${index}`,
    /**
     * Array
     * Value: number
     * Length: 18
     * */
    PlayerSkillOffsets: 'DNAM\\Skill Offsets',
    PlayerSkillOffset: (index: number) => `DNAM\\Skill Offsets\\${index}`,
    /** Value: number */
    PlayerHealth: 'DNAM\\Health',
    /** Value: number */
    PlayerMagicka: 'DNAM\\Magicka',
    /** Value: number */
    PlayerStamina: 'DNAM\\Stamina',
    PlayerGear: 'DNAM\Geared up weapons',
    /**
     * Array
     * Value: handle
     * */
    HeadParts: 'PNAM',
    HeadPart: (index: number) => `PNAM\\${index}`,
    FaceTexture: 'FTST',
    HairColor: 'HCLF',
    Height: 'NAM6',
    Weight: 'NAM7',
    /**
     * Object
     * Value: number
     * */
    TextureLight: 'QNAM',
    TextureLightList: ['QNAM\\Red', 'QNAM\\Green', 'QNAM\\Blue'],
    /**
     * Object
     * Value: number
     * */
    FaceParts: 'NAMA',
    FacePartNose: 'NAMA\\Nose',
    FacePartEyes: 'NAMA\\Eyes',
    FacePartMouth: 'NAMA\\Mouth',
    FacePathOther: 'NAM9\\Unknown',
    /**
     * Object
     * Value: number
     * */
    FaceMorphs: 'NAM9',
    FaceMorphsList: [
        'NAM9\\Nose Long/Short', 'NAM9\\Nose Up/Down', 'NAM9\\Jaw Up/Down', 'NAM9\\Jaw Narrow/Wide',
        'NAM9\\Jaw Farward/Back', 'NAM9\\Cheeks Up/Down', 'NAM9\\Cheeks Farward/Back', 'NAM9\\Eyes Up/Down',
        'NAM9\\Eyes In/Out', 'NAM9\\Brows Up/Down', 'NAM9\\Brows In/Out', 'NAM9\\Brows Farward/Back',
        'NAM9\\Lips Up/Down', 'NAM9\\Lips In/Out', 'NAM9\\Chin Narrow/Wide', 'NAM9\\Chin Up/Down',
        'NAM9\\Chin Underbite/Overbite', 'NAM9\\Eyes Farward/Back'
    ],
    /**
     * Object
    */
    TintLayers: 'Tint Layers',
    TintLayer: (index: number) => `Tint Layers\\${index}`,
    TintLayerKeys: ['TINI', 'TINC\\Red', 'TINC\\Green', 'TINC\\Blue', 'TINC\\Alpha', 'TINV', 'TIAS']

};

export enum PluginsList {
    Skyrim = 'Skyrim.esm',
    Update = 'Update.esm',
    Dawnguard = 'Dawnguard.esm',
    Dragonborn = 'Dragonborn.esm',
    SkyRe = 'SkyRe_Main.esp',
    Poulet = 'Poulet - Main.esp'
}

export function Form(formID: number, plugin: PluginsList): string {
    return ''.concat(String(formID), ':', plugin);
}

export class SkyrimForms {
    static armorStrongerLow = Form(0x000666, PluginsList.Update);
    static armorStrongerMedium = Form(0x000667, PluginsList.Update);
    static armorStrongerHigh = Form(0x000668, PluginsList.Update);
    static armorWeakerLow = Form(0x000669, PluginsList.Update);
    static armorWeakerMedium = Form(0x00066a, PluginsList.Update);
    static armorWeakerHigh = Form(0x00066b, PluginsList.Update);
    // Weapon Modifiers
    static weaponStrongerLow = Form(0x000660, PluginsList.Update);
    static weaponStrongerMedium = Form(0x000661, PluginsList.Update);
    static weaponStrongerHigh = Form(0x000662, PluginsList.Update);
    static weaponWeakerLow = Form(0x000663, PluginsList.Update);
    static weaponWeakerMedium = Form(0x000664, PluginsList.Update);
    static weaponWeakerHigh = Form(0x000665, PluginsList.Update);
    static excludeFromMeltdownRecipes = Form(0x000650, PluginsList.Update);
    // Explosions
    static expBarbed = Form(0x0c3421, PluginsList.SkyRe);
    static expElementalFire = Form(0x010d90, PluginsList.Dawnguard);
    static expElementalFrost = Form(0x010d91, PluginsList.Dawnguard);
    static expElementalShock = Form(0x010d92, PluginsList.Dawnguard);
    static expExploding = Form(0x00f952, PluginsList.SkyRe);
    static expHeavyweight = Form(0x3df04c, PluginsList.SkyRe);
    static expNoisemaker = Form(0x03a323, PluginsList.SkyRe);
    static expNeuralgia = Form(0x3df04f, PluginsList.SkyRe);
    static expTimebomb = Form(0x00f944, PluginsList.SkyRe);
    // Game Settings
    static gmstArmorScalingFactor = Form(0x021a72, PluginsList.Skyrim);
    static gmstMaxArmorRating = Form(0x037deb, PluginsList.Skyrim);
    // Items
    static ingotCorundum = Form(0x05ad93, PluginsList.Skyrim);
    static ingotDwarven = Form(0x0db8a2, PluginsList.Skyrim);
    static ingotEbony = Form(0x05ad9d, PluginsList.Skyrim);
    static ingotGold = Form(0x05ad9e, PluginsList.Skyrim);
    static ingotIron = Form(0x05ace4, PluginsList.Skyrim);
    static ingotMalachite = Form(0x05ada1, PluginsList.Skyrim);
    static ingotMoonstone = Form(0x05ad9f, PluginsList.Skyrim);
    static ingotOrichalcum = Form(0x05ad99, PluginsList.Skyrim);
    static ingotQuicksilver = Form(0x05ada0, PluginsList.Skyrim);
    static ingotSilver = Form(0x05ace3, PluginsList.Skyrim);
    static ingotSteel = Form(0x05ace5, PluginsList.Skyrim);
    static ale = Form(0x034c5e, PluginsList.Skyrim);
    static boneMeal = Form(0x034cdd, PluginsList.Skyrim);
    static charcoal = Form(0x033760, PluginsList.Skyrim);
    static chaurusChitin = Form(0x03ad57, PluginsList.Skyrim);
    static chitinPlate = Form(0x02b04e, PluginsList.Dragonborn);
    static deathBell = Form(0x0516c8, PluginsList.Skyrim);
    static dragonbone = Form(0x03ada4, PluginsList.Skyrim);
    static dragonscale = Form(0x03ada3, PluginsList.Skyrim);
    static fireSalt = Form(0x03ad5e, PluginsList.Skyrim);
    static firewood = Form(0x06f993, PluginsList.Skyrim);
    static frostSalt = Form(0x03ad5f, PluginsList.Skyrim);
    static leather = Form(0x0db5d2, PluginsList.Skyrim);
    static leatherStrips = Form(0x0800e4, PluginsList.Skyrim);
    static netchLeather = Form(0x01cd7c, PluginsList.Dragonborn);
    static oreStalhrim = Form(0x02b06b, PluginsList.Dragonborn);
    static pettySoulGem = Form(0x02e4e2, PluginsList.Skyrim);
    static torchbugThorax = Form(0x04da73, PluginsList.Skyrim);
    static voidSalt = Form(0x03ad60, PluginsList.Skyrim);
    // Keywords
    static kwClothingHands = Form(0x10cd13, PluginsList.Skyrim);
    static kwClothingHead = Form(0x10cd11, PluginsList.Skyrim);
    static kwClothingFeet = Form(0x10cd12, PluginsList.Skyrim);
    static kwClothingBody = Form(0x0a8657, PluginsList.Skyrim);
    static kwArmorClothing = Form(0x06bbe8, PluginsList.Skyrim);
    static kwArmorHeavy = Form(0x06bbd2, PluginsList.Skyrim);
    static kwArmorLight = Form(0x06bbd3, PluginsList.Skyrim);
    static kwArmorDreamcloth = Form(0x05c2c4, PluginsList.SkyRe);
    // Keywords - Armor Materials
    static kwArmorMaterialBlades = Form(0x0009c0, PluginsList.Update);
    static kwArmorMaterialDaedric = Form(0x06bbd4, PluginsList.Skyrim);
    static kwArmorMaterialDarkBrotherhood = Form(0x10fd62, PluginsList.Skyrim);
    static kwArmorMaterialDawnguard = Form(0x012ccd, PluginsList.Dawnguard);
    static kwArmorMaterialDragonplate = Form(0x06bbd5, PluginsList.Skyrim);
    static kwArmorMaterialDragonscale = Form(0x06bbd6, PluginsList.Skyrim);
    static kwArmorMaterialDwarven = Form(0x06bbd7, PluginsList.Skyrim);
    static kwArmorMaterialEbony = Form(0x06bbd8, PluginsList.Skyrim);
    static kwArmorMaterialElven = Form(0x06bbd9, PluginsList.Skyrim);
    static kwArmorMaterialElvenGilded = Form(0x06bbda, PluginsList.Skyrim);
    static kwArmorMaterialFalmerHardened = Form(0x012cce, PluginsList.Dawnguard);
    static kwArmorMaterialFalmerHeavy = Form(0x012ccf, PluginsList.Dawnguard);
    static kwArmorMaterialFalmerHeavyOriginal = Form(0x012cd0, PluginsList.Dawnguard);
    static kwArmorMaterialForsworn = Form(0x0009b9, PluginsList.Update);
    static kwArmorMaterialFur = Form(0x008254, PluginsList.SkyRe);
    static kwArmorMaterialGlass = Form(0x06bbdc, PluginsList.Skyrim);
    static kwArmorMaterialHide = Form(0x06bbdd, PluginsList.Skyrim);
    static kwArmorMaterialHunter = Form(0x0050c4, PluginsList.Dawnguard);
    static kwArmorMaterialImperialHeavy = Form(0x06bbe2, PluginsList.Skyrim);
    static kwArmorMaterialImperialLight = Form(0x06bbe0, PluginsList.Skyrim);
    static kwArmorMaterialImperialStudded = Form(0x06bbe1, PluginsList.Skyrim);
    static kwArmorMaterialIron = Form(0x06bbe3, PluginsList.Skyrim);
    static kwArmorMaterialIronBanded = Form(0x06bbe4, PluginsList.Skyrim);
    static kwArmorMaterialLeather = Form(0x06bbdb, PluginsList.Skyrim);
    static kwArmorMaterialNightingale = Form(0x10fd61, PluginsList.Skyrim);
    static kwArmorMaterialNordicHeavy = Form(0x024105, PluginsList.Dragonborn);
    static kwArmorMaterialOrcish = Form(0x06bbe5, PluginsList.Skyrim);
    static kwArmorMaterialScaled = Form(0x06bbde, PluginsList.Skyrim);
    static kwArmorMaterialStalhrimHeavy = Form(0x024106, PluginsList.Dragonborn);
    static kwArmorMaterialStalhrimLight = Form(0x024107, PluginsList.Dragonborn);
    static kwArmorMaterialSteel = Form(0x06bbe6, PluginsList.Skyrim);
    static kwArmorMaterialSteelPlate = Form(0x06bbe7, PluginsList.Skyrim);
    static kwArmorMaterialStormcloak = Form(0x0ac13a, PluginsList.Skyrim);
    static kwArmorMaterialStudded = Form(0x06bbdf, PluginsList.Skyrim);
    static kwArmorMaterialThievesGuild = Form(0x0009bc, PluginsList.Update);
    static kwArmorMaterialVampire = Form(0x01463e, PluginsList.Dawnguard);
    static kwDLC1ArmorMaterialDawnguard = Form(0x012ccd, PluginsList.Dawnguard);
    static kwDLC1ArmorMaterialHunter = Form(0x0050c4, PluginsList.Dawnguard);
    static kwDLC2ArmorMaterialChitinLight = Form(0x024102, PluginsList.Dragonborn);
    static kwDLC2ArmorMaterialChitinHeavy = Form(0x024103, PluginsList.Dragonborn);
    static kwDLC2ArmorMaterialBonemoldLight = Form(0x024100, PluginsList.Dragonborn);
    static kwDLC2ArmorMaterialBonemoldHeavy = Form(0x024101, PluginsList.Dragonborn);
    static kwWAF_ArmorMaterialDraugr = Form(0xaf0135, PluginsList.Update);
    static kwWAF_ArmorMaterialGuard = Form(0xaf0112, PluginsList.Update);
    static kwWAF_ArmorMaterialThalmor = Form(0xaf0222, PluginsList.Update);
    static kwWAF_ArmorWolf = Form(0xaf0107, PluginsList.Update);
    static kwWAF_DLC1ArmorDawnguardHeavy = Form(0xaf0117, PluginsList.Update);
    static kwWAF_DLC1ArmorDawnguardLight = Form(0xaf0118, PluginsList.Update);
    static kwArmorShieldHeavy = Form(0x08f265, PluginsList.SkyRe);
    static kwArmorShieldLight = Form(0x08f266, PluginsList.SkyRe);
    static kwArmorSlotGauntlets = Form(0x06c0ef, PluginsList.Skyrim);
    static kwArmorSlotHelmet = Form(0x06c0ee, PluginsList.Skyrim);
    static kwArmorSlotBoots = Form(0x06c0ed, PluginsList.Skyrim);
    static kwArmorSlotCuirass = Form(0x06c0ec, PluginsList.Skyrim);
    static kwArmorSlotShield = Form(0x0965b2, PluginsList.Skyrim);
    static kwCraftingSmelter = Form(0x0a5cce, PluginsList.Skyrim);
    static kwCraftingSmithingArmorTable = Form(0x0adb78, PluginsList.Skyrim);
    static kwCraftingSmithingForge = Form(0x088105, PluginsList.Skyrim);
    static kwCraftingSmithingSharpeningWheel = Form(0x088108, PluginsList.Skyrim);
    static kwCraftingTanningRack = Form(0x07866a, PluginsList.Skyrim);
    static kwJewelry = Form(0x08f95a, PluginsList.Skyrim);
    static kwMasqueradeBandit = Form(0x03a8aa, PluginsList.SkyRe);
    static kwMasqueradeForsworn = Form(0x03a8a9, PluginsList.SkyRe);
    static kwMasqueradeImperial = Form(0x037d31, PluginsList.SkyRe);
    static kwMasqueradeStormcloak = Form(0x037d2f, PluginsList.SkyRe);
    static kwMasqueradeThalmor = Form(0x037d2b, PluginsList.SkyRe);
    static kwVendorItemClothing = Form(0x08f95b, PluginsList.Skyrim);
    // Keywords - Weapon Materials
    static kwWAF_WeapMaterialBlades = Form(0xaf0103, PluginsList.Update);
    static kwWAF_WeapMaterialForsworn = Form(0xaf0104, PluginsList.Update);
    static kwWAF_DLC1WeapMaterialDawnguard = Form(0xaf0116, PluginsList.Update);
    static kwWAF_TreatAsMaterialDaedric = Form(0xaf0217, PluginsList.Update);
    static kwWAF_TreatAsMaterialDragon = Form(0xaf0216, PluginsList.Update);
    static kwWAF_TreatAsMaterialDwarven = Form(0xaf0211, PluginsList.Update);
    static kwWAF_TreatAsMaterialEbony = Form(0xaf0215, PluginsList.Update);
    static kwWAF_TreatAsMaterialElven = Form(0xaf0212, PluginsList.Update);
    static kwWAF_TreatAsMaterialGlass = Form(0xaf0214, PluginsList.Update);
    static kwWAF_TreatAsMaterialIron = Form(0xaf0209, PluginsList.Update);
    static kwWAF_TreatAsMaterialLeather = Form(0xaf0219, PluginsList.Update);
    static kwWAF_TreatAsMaterialOrcish = Form(0xaf0213, PluginsList.Update);
    static kwWAF_TreatAsMaterialSteel = Form(0xaf0210, PluginsList.Update);
    static kwDLC2WeaponMaterialStalhrim = Form(0x02622f, PluginsList.Dragonborn);
    static kwWeapMaterialDaedric = Form(0x01e71f, PluginsList.Skyrim);
    static kwWeapMaterialDragonbone = Form(0x019822, PluginsList.Dawnguard);
    static kwWeapMaterialDraugr = Form(0x0c5c01, PluginsList.Skyrim);
    static kwWeapMaterialDraugrHoned = Form(0x0c5c02, PluginsList.Skyrim);
    static kwWeapMaterialDwarven = Form(0x01e71a, PluginsList.Skyrim);
    static kwWeapMaterialEbony = Form(0x01e71e, PluginsList.Skyrim);
    static kwWeapMaterialElven = Form(0x01e71b, PluginsList.Skyrim);
    static kwWeapMaterialFalmer = Form(0x0c5c03, PluginsList.Skyrim);
    static kwWeapMaterialFalmerHoned = Form(0x0c5c04, PluginsList.Skyrim);
    static kwWeapMaterialGlass = Form(0x01e71d, PluginsList.Skyrim);
    static kwWeapMaterialImperial = Form(0x0c5c00, PluginsList.Skyrim);
    static kwWeapMaterialIron = Form(0x01e718, PluginsList.Skyrim);
    static kwWeapMaterialNordic = Form(0x026230, PluginsList.Dragonborn);
    static kwWeapMaterialOrcish = Form(0x01e71c, PluginsList.Skyrim);
    static kwWeapMaterialSilver = Form(0x10aa1a, PluginsList.Skyrim);
    static kwWeapMaterialSilverRefined = Form(0x24f987, PluginsList.SkyRe);
    static kwWeapMaterialSteel = Form(0x01e719, PluginsList.Skyrim);
    static kwWeapMaterialWood = Form(0x01e717, PluginsList.Skyrim);
    // Keywords - Weapon Types
    static kwWeapTypeBastardSword = Form(0x054ff1, PluginsList.SkyRe);
    static kwWeapTypeBattleaxe = Form(0x06d932, PluginsList.Skyrim);
    static kwWeapTypeBattlestaff = Form(0x020857, PluginsList.SkyRe);
    static kwWeapTypeBoundWeapon = Form(0x00f3e1, PluginsList.SkyRe);
    static kwWeapTypeBow = Form(0x01e715, PluginsList.Skyrim);
    static kwWeapTypeBroadsword = Form(0x05451f, PluginsList.SkyRe);
    static kwWeapTypeClub = Form(0x09ba23, PluginsList.SkyRe);
    static kwWeapTypeCrossbow = Form(0x06f3fd, PluginsList.Skyrim);
    static kwWeapTypeDagger = Form(0x01e713, PluginsList.Skyrim);
    static kwWeapTypeGlaive = Form(0x09ba40, PluginsList.SkyRe);
    static kwWeapTypeGreatsword = Form(0x06d931, PluginsList.Skyrim);
    static kwWeapTypeHalberd = Form(0x09ba3e, PluginsList.SkyRe);
    static kwWeapTypeHatchet = Form(0x333676, PluginsList.SkyRe);
    static kwWeapTypeKatana = Form(0x054523, PluginsList.SkyRe);
    static kwWeapTypeLongbow = Form(0x06f3fe, PluginsList.Skyrim);
    static kwWeapTypeLongmace = Form(0x0a068f, PluginsList.SkyRe);
    static kwWeapTypeLongsword = Form(0x054520, PluginsList.SkyRe);
    static kwWeapTypeMace = Form(0x01e714, PluginsList.Skyrim);
    static kwWeapTypeMaul = Form(0x333677, PluginsList.SkyRe);
    static kwWeapTypeNodachi = Form(0x054a88, PluginsList.SkyRe);
    static kwWeapTypeSaber = Form(0x054a87, PluginsList.SkyRe);
    static kwWeapTypeScimitar = Form(0x054a87, PluginsList.SkyRe);
    static kwWeapTypeShortbow = Form(0x056b5f, PluginsList.SkyRe);
    static kwWeapTypeShortspear = Form(0x1ac2b9, PluginsList.SkyRe);
    static kwWeapTypeShortsword = Form(0x085067, PluginsList.SkyRe);
    static kwWeapTypeStaff = Form(0x01e716, PluginsList.Skyrim);
    static kwWeapTypeSword = Form(0x01e711, PluginsList.Skyrim);
    static kwWeapTypeTanto = Form(0x054522, PluginsList.SkyRe);
    static kwWeapTypeUnarmed = Form(0x066f62, PluginsList.SkyRe);
    static kwWeapTypeWakizashi = Form(0x054521, PluginsList.SkyRe);
    static kwWeapTypeWaraxe = Form(0x01e712, PluginsList.Skyrim);
    static kwWeapTypeWarhammer = Form(0x06d930, PluginsList.Skyrim);
    static kwWeapTypeYari = Form(0x09ba3f, PluginsList.SkyRe);
    // Other keywords
    static kwDLC1CrossbowIsEnhanced = Form(0x00399c, PluginsList.Dawnguard);
    static kwMagicDisallowEnchanting = Form(0x0c27bd, PluginsList.Skyrim);
    // Activator keywords
    static kwActivatorLever = Form(0x06DEAD, PluginsList.Skyrim);
    // Lights
    static lightLightsource = Form(0x03a335, PluginsList.SkyRe);
    // Perks
    static perkAlchemyFuse = Form(0x00feda, PluginsList.SkyRe);
    static perkAlchemyAdvancedExplosives = Form(0x00fed9, PluginsList.SkyRe);
    static perkDreamclothBody = Form(0x5cda5, PluginsList.SkyRe);
    static perkDreamclothHands = Form(0x5cda8, PluginsList.SkyRe);
    static perkDreamclothHead = Form(0x5cda4, PluginsList.SkyRe);
    static perkDreamclothFeet = Form(0x5cda7, PluginsList.SkyRe);
    static perkEnchantingElementalBombard0 = Form(0x0af659, PluginsList.SkyRe);
    static perkEnchantingElementalBombard1 = Form(0x3df04e, PluginsList.SkyRe);
    static perkMarksmanshipAdvancedMissilecraft0 = Form(0x0af670, PluginsList.SkyRe);
    static perkMarksmanshipAdvancedMissilecraft1 = Form(0x0af6a4, PluginsList.SkyRe);
    static perkMarksmanshipAdvancedMissilecraft2 = Form(0x3df04d, PluginsList.SkyRe);
    static perkMarksmanshipArbalest = Form(0x0af6a1, PluginsList.SkyRe);
    static perkMarksmanshipBallistics = Form(0x0af657, PluginsList.SkyRe);
    static perkMarksmanshipEngineer = Form(0x0af6a5, PluginsList.SkyRe);
    static perkMarksmanshipLightweightConstruction = Form(0x0af6a2, PluginsList.SkyRe);
    static perkMarksmanshipRecurve = Form(0x0af6a0, PluginsList.SkyRe);
    static perkMarksmanshipSilencer = Form(0x0af6a3, PluginsList.SkyRe);
    static perkSilverPerk = Form(0x10d685, PluginsList.Skyrim);
    static perkSmithingAdvanced = Form(0x0cb414, PluginsList.Skyrim);
    static perkSmithingArcaneBlacksmith = Form(0x05218e, PluginsList.Skyrim);
    static perkSmithingDaedric = Form(0x0cb413, PluginsList.Skyrim);
    static perkSmithingDragon = Form(0x052190, PluginsList.Skyrim);
    static perkSmithingDwarven = Form(0x0cb40e, PluginsList.Skyrim);
    static perkSmithingEbony = Form(0x0cb412, PluginsList.Skyrim);
    static perkSmithingElven = Form(0x0cb40f, PluginsList.Skyrim);
    static perkSmithingGlass = Form(0x0cb411, PluginsList.Skyrim);
    static perkSmithingLeather = Form(0x1d8be6, PluginsList.SkyRe);
    static perkSmithingMeltdown = Form(0x058f75, PluginsList.Skyrim);
    static perkSmithingOrcish = Form(0x0cb410, PluginsList.Skyrim);
    static perkSmithingSilver = Form(0x0581e2, PluginsList.Skyrim);
    static perkSmithingSilverRefined = Form(0x054ff5, PluginsList.SkyRe);
    static perkSmithingSteel = Form(0x0cb40d, PluginsList.Skyrim);
    static perkSmithingWeavingMill = Form(0x05c827, PluginsList.SkyRe);
    static perkSneakThiefsToolbox0 = Form(0x037d35, PluginsList.SkyRe);
    static perkWeaponCrossbow = Form(0x252122, PluginsList.SkyRe);
    static perkWeaponCrossbowArbalest = Form(0x0af6a6, PluginsList.SkyRe);
    static perkWeaponCrossbowArbalestSilenced = Form(0x0af6a8, PluginsList.SkyRe);
    static perkWeaponCrossbowSilenced = Form(0x0af6a7, PluginsList.SkyRe);
    static perkWeaponShortspear = Form(0x1ac2ba, PluginsList.SkyRe);
    static perkWeaponSilverRefined = Form(0x056b5c, PluginsList.SkyRe);
    static perkWeaponYari = Form(0x09e623, PluginsList.SkyRe);
    // Sound descriptors
    static itmCoinPouchUp = Form(0x0899AD, PluginsList.Skyrim);
    static itmCoinPouchDown = Form(0x0899AE, PluginsList.Skyrim);
    static itmMushroomUp = Form(0x0BAD13, PluginsList.Skyrim);
    static itmClampUp = Form(0x100526, PluginsList.Skyrim);
    static itmPotionUpSD = Form(0x03EDBD, PluginsList.Skyrim);
    // Addons Keywords
    static kwdaWeapTypeAny1H = Form(0x01F02A, PluginsList.Poulet);
    static kwdaWeapTypeAny2H = Form(0x01F02B, PluginsList.Poulet);
    static kwCraftingClothingStation = Form(0x038964, PluginsList.Poulet);

    static init(cb: GetHextCallback) {
        Object.keys(SkyrimForms).forEach((v) => {
            const parts = SkyrimForms[v].split(':');
            SkyrimForms[v] = cb(parseInt(parts[0], 10), parts[1]);
        });
    }
}
