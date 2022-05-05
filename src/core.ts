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

export function FormIdList (GetHex: GetHextCallback) {
    return {
        armorStrongerLow: GetHex(0x000666, 'Update.esm'),
        armorStrongerMedium: GetHex(0x000667, 'Update.esm'),
        armorStrongerHigh: GetHex(0x000668, 'Update.esm'),
        armorWeakerLow: GetHex(0x000669, 'Update.esm'),
        armorWeakerMedium: GetHex(0x00066a, 'Update.esm'),
        armorWeakerHigh: GetHex(0x00066b, 'Update.esm'),
        // Weapon Modifiers
        weaponStrongerLow: GetHex(0x000660, 'Update.esm'),
        weaponStrongerMedium: GetHex(0x000661, 'Update.esm'),
        weaponStrongerHigh: GetHex(0x000662, 'Update.esm'),
        weaponWeakerLow: GetHex(0x000663, 'Update.esm'),
        weaponWeakerMedium: GetHex(0x000664, 'Update.esm'),
        weaponWeakerHigh: GetHex(0x000665, 'Update.esm'),
        excludeFromMeltdownRecipes: GetHex(0x000650, 'Update.esm'),
        // Explosions
        expBarbed: GetHex(0x0c3421, 'SkyRe_Main.esp'),
        expElementalFire: GetHex(0x010d90, 'Dawnguard.esm'),
        expElementalFrost: GetHex(0x010d91, 'Dawnguard.esm'),
        expElementalShock: GetHex(0x010d92, 'Dawnguard.esm'),
        expExploding: GetHex(0x00f952, 'SkyRe_Main.esp'),
        expHeavyweight: GetHex(0x3df04c, 'SkyRe_Main.esp'),
        expNoisemaker: GetHex(0x03a323, 'SkyRe_Main.esp'),
        expNeuralgia: GetHex(0x3df04f, 'SkyRe_Main.esp'),
        expTimebomb: GetHex(0x00f944, 'SkyRe_Main.esp'),
        // Game Settings
        gmstArmorScalingFactor: GetHex(0x021a72, 'Skyrim.esm'),
        gmstMaxArmorRating: GetHex(0x037deb, 'Skyrim.esm'),
        // Items
        ingotCorundum: GetHex(0x05ad93, 'Skyrim.esm'),
        ingotDwarven: GetHex(0x0db8a2, 'Skyrim.esm'),
        ingotEbony: GetHex(0x05ad9d, 'Skyrim.esm'),
        ingotGold: GetHex(0x05ad9e, 'Skyrim.esm'),
        ingotIron: GetHex(0x05ace4, 'Skyrim.esm'),
        ingotMalachite: GetHex(0x05ada1, 'Skyrim.esm'),
        ingotMoonstone: GetHex(0x05ad9f, 'Skyrim.esm'),
        ingotOrichalcum: GetHex(0x05ad99, 'Skyrim.esm'),
        ingotQuicksilver: GetHex(0x05ada0, 'Skyrim.esm'),
        ingotSilver: GetHex(0x05ace3, 'Skyrim.esm'),
        ingotSteel: GetHex(0x05ace5, 'Skyrim.esm'),
        ale: GetHex(0x034c5e, 'Skyrim.esm'),
        boneMeal: GetHex(0x034cdd, 'Skyrim.esm'),
        charcoal: GetHex(0x033760, 'Skyrim.esm'),
        chaurusChitin: GetHex(0x03ad57, 'Skyrim.esm'),
        chitinPlate: GetHex(0x02b04e, 'Dragonborn.esm'),
        deathBell: GetHex(0x0516c8, 'Skyrim.esm'),
        dragonbone: GetHex(0x03ada4, 'Skyrim.esm'),
        dragonscale: GetHex(0x03ada3, 'Skyrim.esm'),
        fireSalt: GetHex(0x03ad5e, 'Skyrim.esm'),
        firewood: GetHex(0x06f993, 'Skyrim.esm'),
        frostSalt: GetHex(0x03ad5f, 'Skyrim.esm'),
        leather: GetHex(0x0db5d2, 'Skyrim.esm'),
        leatherStrips: GetHex(0x0800e4, 'Skyrim.esm'),
        netchLeather: GetHex(0x01cd7c, 'Dragonborn.esm'),
        oreStalhrim: GetHex(0x02b06b, 'Dragonborn.esm'),
        pettySoulGem: GetHex(0x02e4e2, 'Skyrim.esm'),
        torchbugThorax: GetHex(0x04da73, 'Skyrim.esm'),
        voidSalt: GetHex(0x03ad60, 'Skyrim.esm'),
        // Keywords
        kwClothingHands: GetHex(0x10cd13, 'Skyrim.esm'),
        kwClothingHead: GetHex(0x10cd11, 'Skyrim.esm'),
        kwClothingFeet: GetHex(0x10cd12, 'Skyrim.esm'),
        kwClothingBody: GetHex(0x0a8657, 'Skyrim.esm'),
        kwArmorClothing: GetHex(0x06bbe8, 'Skyrim.esm'),
        kwArmorHeavy: GetHex(0x06bbd2, 'Skyrim.esm'),
        kwArmorLight: GetHex(0x06bbd3, 'Skyrim.esm'),
        kwArmorDreamcloth: GetHex(0x05c2c4, 'SkyRe_Main.esp'),
        // Keywords - Armor Materials
        kwArmorMaterialBlades: GetHex(0x0009c0, 'Update.esm'),
        kwArmorMaterialDaedric: GetHex(0x06bbd4, 'Skyrim.esm'),
        kwArmorMaterialDarkBrotherhood: GetHex(0x10fd62, 'Skyrim.esm'),
        kwArmorMaterialDawnguard: GetHex(0x012ccd, 'Dawnguard.esm'),
        kwArmorMaterialDragonplate: GetHex(0x06bbd5, 'Skyrim.esm'),
        kwArmorMaterialDragonscale: GetHex(0x06bbd6, 'Skyrim.esm'),
        kwArmorMaterialDwarven: GetHex(0x06bbd7, 'Skyrim.esm'),
        kwArmorMaterialEbony: GetHex(0x06bbd8, 'Skyrim.esm'),
        kwArmorMaterialElven: GetHex(0x06bbd9, 'Skyrim.esm'),
        kwArmorMaterialElvenGilded: GetHex(0x06bbda, 'Skyrim.esm'),
        kwArmorMaterialFalmerHardened: GetHex(0x012cce, 'Dawnguard.esm'),
        kwArmorMaterialFalmerHeavy: GetHex(0x012ccf, 'Dawnguard.esm'),
        kwArmorMaterialFalmerHeavyOriginal: GetHex(0x012cd0, 'Dawnguard.esm'),
        kwArmorMaterialForsworn: GetHex(0x0009b9, 'Update.esm'),
        kwArmorMaterialFur: GetHex(0x008254, 'SkyRe_Main.esp'),
        kwArmorMaterialGlass: GetHex(0x06bbdc, 'Skyrim.esm'),
        kwArmorMaterialHide: GetHex(0x06bbdd, 'Skyrim.esm'),
        kwArmorMaterialHunter: GetHex(0x0050c4, 'Dawnguard.esm'),
        kwArmorMaterialImperialHeavy: GetHex(0x06bbe2, 'Skyrim.esm'),
        kwArmorMaterialImperialLight: GetHex(0x06bbe0, 'Skyrim.esm'),
        kwArmorMaterialImperialStudded: GetHex(0x06bbe1, 'Skyrim.esm'),
        kwArmorMaterialIron: GetHex(0x06bbe3, 'Skyrim.esm'),
        kwArmorMaterialIronBanded: GetHex(0x06bbe4, 'Skyrim.esm'),
        kwArmorMaterialLeather: GetHex(0x06bbdb, 'Skyrim.esm'),
        kwArmorMaterialNightingale: GetHex(0x10fd61, 'Skyrim.esm'),
        kwArmorMaterialNordicHeavy: GetHex(0x024105, 'Dragonborn.esm'),
        kwArmorMaterialOrcish: GetHex(0x06bbe5, 'Skyrim.esm'),
        kwArmorMaterialScaled: GetHex(0x06bbde, 'Skyrim.esm'),
        kwArmorMaterialStalhrimHeavy: GetHex(0x024106, 'Dragonborn.esm'),
        kwArmorMaterialStalhrimLight: GetHex(0x024107, 'Dragonborn.esm'),
        kwArmorMaterialSteel: GetHex(0x06bbe6, 'Skyrim.esm'),
        kwArmorMaterialSteelPlate: GetHex(0x06bbe7, 'Skyrim.esm'),
        kwArmorMaterialStormcloak: GetHex(0x0ac13a, 'Skyrim.esm'),
        kwArmorMaterialStudded: GetHex(0x06bbdf, 'Skyrim.esm'),
        kwArmorMaterialThievesGuild: GetHex(0x0009bc, 'Update.esm'),
        kwArmorMaterialVampire: GetHex(0x01463e, 'Dawnguard.esm'),
        kwDLC1ArmorMaterialDawnguard: GetHex(0x012ccd, 'Dawnguard.esm'),
        kwDLC1ArmorMaterialHunter: GetHex(0x0050c4, 'Dawnguard.esm'),
        kwDLC2ArmorMaterialChitinLight: GetHex(0x024102, 'Dragonborn.esm'),
        kwDLC2ArmorMaterialChitinHeavy: GetHex(0x024103, 'Dragonborn.esm'),
        kwDLC2ArmorMaterialBonemoldLight: GetHex(0x024100, 'Dragonborn.esm'),
        kwDLC2ArmorMaterialBonemoldHeavy: GetHex(0x024101, 'Dragonborn.esm'),
        kwWAF_ArmorMaterialDraugr: GetHex(0xaf0135, 'Update.esm'),
        kwWAF_ArmorMaterialGuard: GetHex(0xaf0112, 'Update.esm'),
        kwWAF_ArmorMaterialThalmor: GetHex(0xaf0222, 'Update.esm'),
        kwWAF_ArmorWolf: GetHex(0xaf0107, 'Update.esm'),
        kwWAF_DLC1ArmorDawnguardHeavy: GetHex(0xaf0117, 'Update.esm'),
        kwWAF_DLC1ArmorDawnguardLight: GetHex(0xaf0118, 'Update.esm'),
        kwArmorShieldHeavy: GetHex(0x08f265, 'SkyRe_Main.esp'),
        kwArmorShieldLight: GetHex(0x08f266, 'SkyRe_Main.esp'),
        kwArmorSlotGauntlets: GetHex(0x06c0ef, 'Skyrim.esm'),
        kwArmorSlotHelmet: GetHex(0x06c0ee, 'Skyrim.esm'),
        kwArmorSlotBoots: GetHex(0x06c0ed, 'Skyrim.esm'),
        kwArmorSlotCuirass: GetHex(0x06c0ec, 'Skyrim.esm'),
        kwArmorSlotShield: GetHex(0x0965b2, 'Skyrim.esm'),
        kwCraftingSmelter: GetHex(0x0a5cce, 'Skyrim.esm'),
        kwCraftingSmithingArmorTable: GetHex(0x0adb78, 'Skyrim.esm'),
        kwCraftingSmithingForge: GetHex(0x088105, 'Skyrim.esm'),
        kwCraftingSmithingSharpeningWheel: GetHex(0x088108, 'Skyrim.esm'),
        kwCraftingTanningRack: GetHex(0x07866a, 'Skyrim.esm'),
        kwCraftingClothingStation: GetHex(0x038964, 'Poulet - Main.esp'),
        kwJewelry: GetHex(0x08f95a, 'Skyrim.esm'),
        kwMasqueradeBandit: GetHex(0x03a8aa, 'SkyRe_Main.esp'),
        kwMasqueradeForsworn: GetHex(0x03a8a9, 'SkyRe_Main.esp'),
        kwMasqueradeImperial: GetHex(0x037d31, 'SkyRe_Main.esp'),
        kwMasqueradeStormcloak: GetHex(0x037d2f, 'SkyRe_Main.esp'),
        kwMasqueradeThalmor: GetHex(0x037d2b, 'SkyRe_Main.esp'),
        kwVendorItemClothing: GetHex(0x08f95b, 'Skyrim.esm'),
        // Keywords - Weapon Materials
        kwWAF_WeapMaterialBlades: GetHex(0xaf0103, 'Update.esm'),
        kwWAF_WeapMaterialForsworn: GetHex(0xaf0104, 'Update.esm'),
        kwWAF_DLC1WeapMaterialDawnguard: GetHex(0xaf0116, 'Update.esm'),
        kwWAF_TreatAsMaterialDaedric: GetHex(0xaf0217, 'Update.esm'),
        kwWAF_TreatAsMaterialDragon: GetHex(0xaf0216, 'Update.esm'),
        kwWAF_TreatAsMaterialDwarven: GetHex(0xaf0211, 'Update.esm'),
        kwWAF_TreatAsMaterialEbony: GetHex(0xaf0215, 'Update.esm'),
        kwWAF_TreatAsMaterialElven: GetHex(0xaf0212, 'Update.esm'),
        kwWAF_TreatAsMaterialGlass: GetHex(0xaf0214, 'Update.esm'),
        kwWAF_TreatAsMaterialIron: GetHex(0xaf0209, 'Update.esm'),
        kwWAF_TreatAsMaterialLeather: GetHex(0xaf0219, 'Update.esm'),
        kwWAF_TreatAsMaterialOrcish: GetHex(0xaf0213, 'Update.esm'),
        kwWAF_TreatAsMaterialSteel: GetHex(0xaf0210, 'Update.esm'),
        kwDLC2WeaponMaterialStalhrim: GetHex(0x02622f, 'Dragonborn.esm'),
        kwWeapMaterialDaedric: GetHex(0x01e71f, 'Skyrim.esm'),
        kwWeapMaterialDragonbone: GetHex(0x019822, 'Dawnguard.esm'),
        kwWeapMaterialDraugr: GetHex(0x0c5c01, 'Skyrim.esm'),
        kwWeapMaterialDraugrHoned: GetHex(0x0c5c02, 'Skyrim.esm'),
        kwWeapMaterialDwarven: GetHex(0x01e71a, 'Skyrim.esm'),
        kwWeapMaterialEbony: GetHex(0x01e71e, 'Skyrim.esm'),
        kwWeapMaterialElven: GetHex(0x01e71b, 'Skyrim.esm'),
        kwWeapMaterialFalmer: GetHex(0x0c5c03, 'Skyrim.esm'),
        kwWeapMaterialFalmerHoned: GetHex(0x0c5c04, 'Skyrim.esm'),
        kwWeapMaterialGlass: GetHex(0x01e71d, 'Skyrim.esm'),
        kwWeapMaterialImperial: GetHex(0x0c5c00, 'Skyrim.esm'),
        kwWeapMaterialIron: GetHex(0x01e718, 'Skyrim.esm'),
        kwWeapMaterialNordic: GetHex(0x026230, 'Dragonborn.esm'),
        kwWeapMaterialOrcish: GetHex(0x01e71c, 'Skyrim.esm'),
        kwWeapMaterialSilver: GetHex(0x10aa1a, 'Skyrim.esm'),
        kwWeapMaterialSilverRefined: GetHex(0x24f987, 'SkyRe_Main.esp'),
        kwWeapMaterialSteel: GetHex(0x01e719, 'Skyrim.esm'),
        kwWeapMaterialWood: GetHex(0x01e717, 'Skyrim.esm'),
        // Keywords - Weapon Types
        kwWeapTypeBastardSword: GetHex(0x054ff1, 'SkyRe_Main.esp'),
        kwWeapTypeBattleaxe: GetHex(0x06d932, 'Skyrim.esm'),
        kwWeapTypeBattlestaff: GetHex(0x020857, 'SkyRe_Main.esp'),
        kwWeapTypeBoundWeapon: GetHex(0x00f3e1, 'SkyRe_Main.esp'),
        kwWeapTypeBow: GetHex(0x01e715, 'Skyrim.esm'),
        kwWeapTypeBroadsword: GetHex(0x05451f, 'SkyRe_Main.esp'),
        kwWeapTypeClub: GetHex(0x09ba23, 'SkyRe_Main.esp'),
        kwWeapTypeCrossbow: GetHex(0x06f3fd, 'Skyrim.esm'),
        kwWeapTypeDagger: GetHex(0x01e713, 'Skyrim.esm'),
        kwWeapTypeGlaive: GetHex(0x09ba40, 'SkyRe_Main.esp'),
        kwWeapTypeGreatsword: GetHex(0x06d931, 'Skyrim.esm'),
        kwWeapTypeHalberd: GetHex(0x09ba3e, 'SkyRe_Main.esp'),
        kwWeapTypeHatchet: GetHex(0x333676, 'SkyRe_Main.esp'),
        kwWeapTypeKatana: GetHex(0x054523, 'SkyRe_Main.esp'),
        kwWeapTypeLongbow: GetHex(0x06f3fe, 'Skyrim.esm'),
        kwWeapTypeLongmace: GetHex(0x0a068f, 'SkyRe_Main.esp'),
        kwWeapTypeLongsword: GetHex(0x054520, 'SkyRe_Main.esp'),
        kwWeapTypeMace: GetHex(0x01e714, 'Skyrim.esm'),
        kwWeapTypeMaul: GetHex(0x333677, 'SkyRe_Main.esp'),
        kwWeapTypeNodachi: GetHex(0x054a88, 'SkyRe_Main.esp'),
        kwWeapTypeSaber: GetHex(0x054a87, 'SkyRe_Main.esp'),
        kwWeapTypeScimitar: GetHex(0x054a87, 'SkyRe_Main.esp'),
        kwWeapTypeShortbow: GetHex(0x056b5f, 'SkyRe_Main.esp'),
        kwWeapTypeShortspear: GetHex(0x1ac2b9, 'SkyRe_Main.esp'),
        kwWeapTypeShortsword: GetHex(0x085067, 'SkyRe_Main.esp'),
        kwWeapTypeStaff: GetHex(0x01e716, 'Skyrim.esm'),
        kwWeapTypeSword: GetHex(0x01e711, 'Skyrim.esm'),
        kwWeapTypeTanto: GetHex(0x054522, 'SkyRe_Main.esp'),
        kwWeapTypeUnarmed: GetHex(0x066f62, 'SkyRe_Main.esp'),
        kwWeapTypeWakizashi: GetHex(0x054521, 'SkyRe_Main.esp'),
        kwWeapTypeWaraxe: GetHex(0x01e712, 'Skyrim.esm'),
        kwWeapTypeWarhammer: GetHex(0x06d930, 'Skyrim.esm'),
        kwWeapTypeYari: GetHex(0x09ba3f, 'SkyRe_Main.esp'),
        // Other keywords
        kwDLC1CrossbowIsEnhanced: GetHex(0x00399c, 'Dawnguard.esm'),
        kwMagicDisallowEnchanting: GetHex(0x0c27bd, 'Skyrim.esm'),
        // Activator keywords
        kwActivatorLever: GetHex(0x06DEAD, 'Skyrim.esm'),
        // Lights
        lightLightsource: GetHex(0x03a335, 'SkyRe_Main.esp'),
        // Perks
        perkAlchemyFuse: GetHex(0x00feda, 'SkyRe_Main.esp'),
        perkAlchemyAdvancedExplosives: GetHex(0x00fed9, 'SkyRe_Main.esp'),
        perkDreamclothBody: GetHex(0x5cda5, 'SkyRe_Main.esp'),
        perkDreamclothHands: GetHex(0x5cda8, 'SkyRe_Main.esp'),
        perkDreamclothHead: GetHex(0x5cda4, 'SkyRe_Main.esp'),
        perkDreamclothFeet: GetHex(0x5cda7, 'SkyRe_Main.esp'),
        perkEnchantingElementalBombard0: GetHex(0x0af659, 'SkyRe_Main.esp'),
        perkEnchantingElementalBombard1: GetHex(0x3df04e, 'SkyRe_Main.esp'),
        perkMarksmanshipAdvancedMissilecraft0: GetHex(0x0af670, 'SkyRe_Main.esp'),
        perkMarksmanshipAdvancedMissilecraft1: GetHex(0x0af6a4, 'SkyRe_Main.esp'),
        perkMarksmanshipAdvancedMissilecraft2: GetHex(0x3df04d, 'SkyRe_Main.esp'),
        perkMarksmanshipArbalest: GetHex(0x0af6a1, 'SkyRe_Main.esp'),
        perkMarksmanshipBallistics: GetHex(0x0af657, 'SkyRe_Main.esp'),
        perkMarksmanshipEngineer: GetHex(0x0af6a5, 'SkyRe_Main.esp'),
        perkMarksmanshipLightweightConstruction: GetHex(0x0af6a2, 'SkyRe_Main.esp'),
        perkMarksmanshipRecurve: GetHex(0x0af6a0, 'SkyRe_Main.esp'),
        perkMarksmanshipSilencer: GetHex(0x0af6a3, 'SkyRe_Main.esp'),
        perkSilverPerk: GetHex(0x10d685, 'Skyrim.esm'),
        perkSmithingAdvanced: GetHex(0x0cb414, 'Skyrim.esm'),
        perkSmithingArcaneBlacksmith: GetHex(0x05218e, 'Skyrim.esm'),
        perkSmithingDaedric: GetHex(0x0cb413, 'Skyrim.esm'),
        perkSmithingDragon: GetHex(0x052190, 'Skyrim.esm'),
        perkSmithingDwarven: GetHex(0x0cb40e, 'Skyrim.esm'),
        perkSmithingEbony: GetHex(0x0cb412, 'Skyrim.esm'),
        perkSmithingElven: GetHex(0x0cb40f, 'Skyrim.esm'),
        perkSmithingGlass: GetHex(0x0cb411, 'Skyrim.esm'),
        perkSmithingLeather: GetHex(0x1d8be6, 'SkyRe_Main.esp'),
        perkSmithingMeltdown: GetHex(0x058f75, 'Skyrim.esm'),
        perkSmithingOrcish: GetHex(0x0cb410, 'Skyrim.esm'),
        perkSmithingSilver: GetHex(0x0581e2, 'Skyrim.esm'),
        perkSmithingSilverRefined: GetHex(0x054ff5, 'SkyRe_Main.esp'),
        perkSmithingSteel: GetHex(0x0cb40d, 'Skyrim.esm'),
        perkSmithingWeavingMill: GetHex(0x05c827, 'SkyRe_Main.esp'),
        perkSneakThiefsToolbox0: GetHex(0x037d35, 'SkyRe_Main.esp'),
        perkWeaponCrossbow: GetHex(0x252122, 'SkyRe_Main.esp'),
        perkWeaponCrossbowArbalest: GetHex(0x0af6a6, 'SkyRe_Main.esp'),
        perkWeaponCrossbowArbalestSilenced: GetHex(0x0af6a8, 'SkyRe_Main.esp'),
        perkWeaponCrossbowSilenced: GetHex(0x0af6a7, 'SkyRe_Main.esp'),
        perkWeaponShortspear: GetHex(0x1ac2ba, 'SkyRe_Main.esp'),
        perkWeaponSilverRefined: GetHex(0x056b5c, 'SkyRe_Main.esp'),
        perkWeaponYari: GetHex(0x09e623, 'SkyRe_Main.esp'),
        // Sound descriptors
        itmCoinPouchUp: GetHex(0x0899AD, 'Skyrim.esm'),
        itmCoinPouchDown: GetHex(0x0899AE, 'Skyrim.esm'),
        itmMushroomUp: GetHex(0x0BAD13, 'Skyrim.esm'),
        itmClampUp: GetHex(0x100526, 'Skyrim.esm'),
        itmPotionUpSD: GetHex(0x03EDBD, 'Skyrim.esm')
    };
}
