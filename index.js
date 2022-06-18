(() => {
  // src/core.ts
  var _typeof = (obj) => {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = (obj2) => {
        return typeof obj2;
      };
    } else {
      _typeof = (obj2) => {
        return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
      };
    }
    return _typeof(obj);
  };
  function _AwaitValue(value) {
    this.wrapped = value;
  }
  function _AsyncGenerator(gen) {
    var front, back;
    function send(key, arg) {
      return new Promise(function(resolve, reject) {
        var request = {
          key,
          arg,
          resolve,
          reject,
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
    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;
        var wrappedAwait = value instanceof _AwaitValue;
        Promise.resolve(wrappedAwait ? value.wrapped : value).then(function(arg2) {
          if (wrappedAwait) {
            resume("next", arg2);
            return;
          }
          settle(result.done ? "return" : "normal", arg2);
        }, function(err) {
          resume("throw", err);
        });
      } catch (err) {
        settle("throw", err);
      }
    }
    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value,
            done: true
          });
          break;
        case "throw":
          front.reject(value);
          break;
        default:
          front.resolve({
            value,
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
      this.return = void 0;
    }
  }
  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    _AsyncGenerator.prototype[Symbol.asyncIterator] = function() {
      return this;
    };
  }
  _AsyncGenerator.prototype.next = function(arg) {
    return this._invoke("next", arg);
  };
  _AsyncGenerator.prototype.throw = function(arg) {
    return this._invoke("throw", arg);
  };
  _AsyncGenerator.prototype.return = function(arg) {
    return this._invoke("return", arg);
  };
  function overrideCraftingRecipes(cobj, armor, bench, perk, input, patchFile) {
    var armorFormID = xelib.GetFormID(armor);
    cobj.forEach(function(recipe) {
      if (recipe.bnam !== bench || recipe.cnam !== armorFormID) {
        return;
      }
      var newRecipe = xelib.CopyElement(recipe.handle, patchFile);
      var baseItem = xelib.GetElement(newRecipe, "Items\\[0]");
      xelib.SetValue(baseItem, "CNTO\\Item", input);
    });
  }
  function createHasPerkCondition(recipe, type, value, perk) {
    var condition;
    if (xelib.HasArrayItem(recipe, "Conditions", "CTDA\\Parameter #1", perk)) {
      return true;
    } else if (!xelib.GetElement(recipe, "Conditions")) {
      xelib.AddElement(recipe, "Conditions");
      condition = xelib.GetElement(recipe, "Conditions\\[0]");
    } else {
      condition = xelib.AddElement(recipe, "Conditions\\.");
    }
    updateHasPerkCondition(recipe, condition, type, value, perk);
    return condition;
  }
  function getWinningLinksTo(rec, path) {
    var ref = xelib.GetLinksTo(rec, path);
    return ref && xelib.GetWinningOverride(ref);
  }
  function createGetEquippedCondition(recipe, type, value, itemHandle) {
    var condition = xelib.AddElement(recipe, "Conditions\\.");
    xelib.SetValue(condition, "CTDA\\Type", "".concat(String(type)));
    xelib.SetFloatValue(condition, "CTDA\\Comparison Value - Float", value);
    xelib.SetValue(condition, "CTDA\\Function", "GetEquipped");
    xelib.SetValue(condition, "CTDA\\Inventory Object", xelib.GetHexFormID(itemHandle));
    xelib.SetValue(condition, "CTDA\\Run On", "Subject");
    return condition;
  }
  function updateHasPerkCondition(recipe, condition, type, value, perk, func = "HasPerk") {
    xelib.SetValue(condition, "CTDA\\Type", "".concat(String(type)));
    xelib.SetFloatValue(condition, "CTDA\\Comparison Value - Float", value);
    xelib.SetValue(condition, "CTDA\\Function", func);
    if (func === "HasPerk") {
      xelib.SetValue(condition, "CTDA\\Perk", perk);
    }
    xelib.SetValue(condition, "CTDA\\Run On", "Subject");
  }
  function createGetItemCountCondition(recipe, type, value, object) {
    var condition = xelib.AddElement(recipe, "Conditions\\.");
    updateGetItemCountCondition(recipe, condition, type, value, object);
    return condition;
  }
  function updateGetItemCountCondition(recipe, condition, type, value, object) {
    xelib.SetValue(condition, "CTDA\\Type", "".concat(String(type)));
    xelib.SetFloatValue(condition, "CTDA\\Comparison Value - Float", value);
    xelib.SetValue(condition, "CTDA\\Function", "GetItemCount");
    xelib.SetValue(condition, "CTDA\\Inventory Object", xelib.GetHexFormID(object));
    xelib.SetValue(condition, "CTDA\\Run On", "Subject");
  }
  var includes = function includes2(a, b) {
    return a.includes(b);
  };
  var equals = function equals2(a, b) {
    return a === b;
  };
  var compare = function compare2(a, b, inclusion) {
    return inclusion ? includes(a, b) : equals(a, b);
  };
  function getValueFromName(collection, name, field1, field2, inclusion = true) {
    var minLength = 0;
    var value;
    collection.forEach(function(thing) {
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
  function getModifierFromMap(itemData, collection, h, field1, field2, inclusion = true) {
    var modifier;
    itemData.some(function(e) {
      if (!xelib.HasArrayItem(h, "KWDA", "", e.kwda)) {
        return false;
      }
      modifier = getValueFromName(collection, e.name, field1, field2, inclusion);
      if (modifier === null)
        modifier = getValueFromName(collection, xelib.EditorID(h), field1, field2, inclusion);
      return true;
    });
    return modifier;
  }
  function getKwda(h) {
    return function(kwda) {
      return xelib.HasArrayItem(h, "KWDA", "", kwda);
    };
  }
  function addPerkScript(weapon, scriptName, propertyName, perk) {
    var vmad = xelib.AddElement(weapon, "VMAD");
    xelib.SetIntValue(vmad, "Version", 5);
    xelib.SetIntValue(vmad, "Object Format", 2);
    var script = xelib.AddElement(vmad, "Scripts\\.");
    xelib.SetValue(script, "scriptName", scriptName);
    var property = xelib.AddElement(script, "Properties\\.");
    xelib.SetValue(property, "propertyName", propertyName);
    xelib.SetValue(property, "Type", "Object");
    xelib.SetValue(property, "Flags", "Edited");
    xelib.SetValue(property, "Value\\Object Union\\Object v2\\FormID", perk);
    xelib.SetValue(property, "Value\\Object Union\\Object v2\\Alias", "None");
  }
  function safeHasFlag(h, path, flag) {
    return xelib.HasElement(h, path.split("\\")[0]) && !xelib.GetFlag(h, path, flag);
  }
  function safeHasArrayItem(h, path, subPath, value) {
    return xelib.HasElement(h, path) && xelib.HasArrayItem(h, path, subPath, value);
  }
  function clamp(min, value, max) {
    return Math.min(Math.max(value, min), max);
  }
  function removeTemperingConditions(h, arr, perk) {
    var filteredArray = arr.filter((e) => {
      if (!e.perk || !xelib.HasArrayItem(h, "Conditions", "CTDA\\Parameter #1", e.perk)) {
        return false;
      }
      return e.perk !== perk;
    });
    var condition = filteredArray.some((e) => {
      if (!xelib.HasArrayItem(h, "Conditions", "CTDA\\Parameter #1", perk)) {
        var cond = xelib.GetArrayItem(h, "Conditions", "CTDA\\Parameter #1", e.perk);
        updateHasPerkCondition(h, cond, 1e7, 1, perk);
      }
      xelib.RemoveArrayItem(h, "Conditions", "CTDA\\Parameter #1", e.perk);
      return false;
    });
    return condition;
  }
  function findKeyword(elem, val) {
    const items = xelib.GetElements(elem, "KWDA", false);
    var path;
    items.some((v, i) => {
      path = `KWDA\\[${i}]`;
      return xelib.GetValue(elem, path).includes(val);
    });
    return path;
  }
  function isMergeableObject(value) {
    return isNonNullObject(value) && !isSpecial(value);
  }
  function isNonNullObject(value) {
    return !!value && _typeof(value) === "object";
  }
  function isSpecial(value) {
    var stringValue = Object.prototype.toString.call(value);
    return stringValue === "[object RegExp]" || stringValue === "[object Date]" || isReactElement(value);
  }
  var canUseSymbol = typeof Symbol === "function" && Symbol.for;
  var REACT_ELEMENT_TYPE$1 = canUseSymbol ? Symbol.for("react.element") : 60103;
  function isReactElement(value) {
    return value.$$typeof === REACT_ELEMENT_TYPE$1;
  }
  function emptyTarget(val) {
    return Array.isArray(val) ? [] : {};
  }
  function cloneUnlessOtherwiseSpecified(value, options) {
    return options.clone !== false && options.isMergeableObject(value) ? deepmerge(emptyTarget(value), value, options) : value;
  }
  function defaultArrayMerge(target, source, options) {
    return target.concat(source).map(function(element) {
      return cloneUnlessOtherwiseSpecified(element, options);
    });
  }
  function getMergeFunction(key, options) {
    if (!options.customMerge) {
      return deepmerge;
    }
    var customMerge = options.customMerge(key);
    return typeof customMerge === "function" ? customMerge : deepmerge;
  }
  function getEnumerableOwnPropertySymbols(target) {
    return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function(symbol) {
      return target.propertyIsEnumerable(symbol);
    }) : [];
  }
  function getKeys(target) {
    return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
  }
  function propertyIsOnObject(object, property) {
    try {
      return property in object;
    } catch (_) {
      return false;
    }
  }
  function propertyIsUnsafe(target, key) {
    return propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key));
  }
  function mergeObject(target, source, options) {
    var destination = {};
    if (options.isMergeableObject(target)) {
      getKeys(target).forEach(function(key) {
        destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
      });
    }
    getKeys(source).forEach(function(key) {
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
  function deepmerge(target, source, options = {}) {
    options.arrayMerge = options.arrayMerge || defaultArrayMerge;
    options.isMergeableObject = options.isMergeableObject || isMergeableObject;
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
  deepmerge.all = function deepmergeAll(array, options) {
    if (!Array.isArray(array)) {
      throw new Error("first argument should be an array");
    }
    return array.reduce(function(prev, next) {
      return deepmerge(prev, next, options);
    }, {});
  };
  var Flags = {
    OppositeGenderAnim: "Opposite Gender Anims"
  };
  var Records = {
    Configuration: "ACBS",
    ConfigurationFlags: "ACBS\\Flags",
    AttackRace: "ATKR",
    Perks: "PRKR",
    PerkValue: (index) => `PRKR\\[${index}]\\Perk`,
    PerkRank: (index) => `PRKR\\[${index}]\\Rank`,
    AIData: "AIDT",
    AIDTAggression: "AIDT\\Aggression",
    AIDTConfidence: "AIDT\\Confidence",
    AIDTEnergy: "AIDT\\Energy Level",
    AIDTResponsibility: "AIDT\\Responsibility",
    AIDTMood: "AIDT\\Mood",
    AIDTAssistance: "AIDT\\Assistance",
    AIDTAggro: "AIDT\\Aggro",
    AIDTAggroRadius: "AIDT\\Aggro\\Aggro Radius Behavior",
    AIDTAggroWarn: "AIDT\\Aggro\\Warn",
    AIDTAggroWarnAttack: "AIDT\\Aggro\\Warn/Attack",
    AIDTAggroAttack: "AIDT\\Aggro\\Attack",
    Class: "CNAM",
    Keywords: "KWDA",
    Keyword: (index) => `KWDA\\${index}`,
    Name: "FULL",
    ShortName: "SHRT",
    Description: "DESC",
    Data: "DNAM",
    DataSkill: "DNAM\\Skill",
    PlayerSkills: "DNAM",
    PlayerSkillValues: "DNAM\\Skill Values",
    PlayerSkillValue: (index) => `DNAM\\Skill Values\\${index}`,
    PlayerSkillOffsets: "DNAM\\Skill Offsets",
    PlayerSkillOffset: (index) => `DNAM\\Skill Offsets\\${index}`,
    PlayerHealth: "DNAM\\Health",
    PlayerMagicka: "DNAM\\Magicka",
    PlayerStamina: "DNAM\\Stamina",
    PlayerGear: "DNAMGeared up weapons",
    HeadParts: "PNAM",
    HeadPart: (index) => `PNAM\\${index}`,
    FaceTexture: "FTST",
    HairColor: "HCLF",
    Height: "NAM6",
    Weight: "NAM7",
    TextureLight: "QNAM",
    TextureLightList: ["QNAM\\Red", "QNAM\\Green", "QNAM\\Blue"],
    FaceParts: "NAMA",
    FacePartNose: "NAMA\\Nose",
    FacePartEyes: "NAMA\\Eyes",
    FacePartMouth: "NAMA\\Mouth",
    FacePathOther: "NAM9\\Unknown",
    FaceMorphs: "NAM9",
    FaceMorphsList: [
      "NAM9\\Nose Long/Short",
      "NAM9\\Nose Up/Down",
      "NAM9\\Jaw Up/Down",
      "NAM9\\Jaw Narrow/Wide",
      "NAM9\\Jaw Farward/Back",
      "NAM9\\Cheeks Up/Down",
      "NAM9\\Cheeks Farward/Back",
      "NAM9\\Eyes Up/Down",
      "NAM9\\Eyes In/Out",
      "NAM9\\Brows Up/Down",
      "NAM9\\Brows In/Out",
      "NAM9\\Brows Farward/Back",
      "NAM9\\Lips Up/Down",
      "NAM9\\Lips In/Out",
      "NAM9\\Chin Narrow/Wide",
      "NAM9\\Chin Up/Down",
      "NAM9\\Chin Underbite/Overbite",
      "NAM9\\Eyes Farward/Back"
    ],
    TintLayers: "Tint Layers",
    TintLayer: (index) => `Tint Layers\\${index}`,
    TintLayerKeys: ["TINI", "TINC\\Red", "TINC\\Green", "TINC\\Blue", "TINC\\Alpha", "TINV", "TIAS"]
  };
  function Form(formID, plugin) {
    return "".concat(String(formID), ":", plugin);
  }
  var _SkyrimForms = class {
    static init(cb) {
      Object.keys(_SkyrimForms).forEach((v) => {
        const parts = _SkyrimForms[v].split(":");
        _SkyrimForms[v] = cb(parseInt(parts[0], 10), parts[1]);
      });
    }
  };
  var SkyrimForms = _SkyrimForms;
  SkyrimForms.armorStrongerLow = Form(1638, "Update.esm" /* Update */);
  SkyrimForms.armorStrongerMedium = Form(1639, "Update.esm" /* Update */);
  SkyrimForms.armorStrongerHigh = Form(1640, "Update.esm" /* Update */);
  SkyrimForms.armorWeakerLow = Form(1641, "Update.esm" /* Update */);
  SkyrimForms.armorWeakerMedium = Form(1642, "Update.esm" /* Update */);
  SkyrimForms.armorWeakerHigh = Form(1643, "Update.esm" /* Update */);
  SkyrimForms.weaponStrongerLow = Form(1632, "Update.esm" /* Update */);
  SkyrimForms.weaponStrongerMedium = Form(1633, "Update.esm" /* Update */);
  SkyrimForms.weaponStrongerHigh = Form(1634, "Update.esm" /* Update */);
  SkyrimForms.weaponWeakerLow = Form(1635, "Update.esm" /* Update */);
  SkyrimForms.weaponWeakerMedium = Form(1636, "Update.esm" /* Update */);
  SkyrimForms.weaponWeakerHigh = Form(1637, "Update.esm" /* Update */);
  SkyrimForms.excludeFromMeltdownRecipes = Form(1616, "Update.esm" /* Update */);
  SkyrimForms.expBarbed = Form(799777, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.expElementalFire = Form(69008, "Dawnguard.esm" /* Dawnguard */);
  SkyrimForms.expElementalFrost = Form(69009, "Dawnguard.esm" /* Dawnguard */);
  SkyrimForms.expElementalShock = Form(69010, "Dawnguard.esm" /* Dawnguard */);
  SkyrimForms.expExploding = Form(63826, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.expHeavyweight = Form(4059212, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.expNoisemaker = Form(238371, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.expNeuralgia = Form(4059215, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.expTimebomb = Form(63812, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.gmstArmorScalingFactor = Form(137842, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.gmstMaxArmorRating = Form(228843, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.ingotCorundum = Form(372115, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.ingotDwarven = Form(899234, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.ingotEbony = Form(372125, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.ingotGold = Form(372126, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.ingotIron = Form(371940, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.ingotMalachite = Form(372129, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.ingotMoonstone = Form(372127, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.ingotOrichalcum = Form(372121, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.ingotQuicksilver = Form(372128, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.ingotSilver = Form(371939, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.ingotSteel = Form(371941, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.ale = Form(216158, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.boneMeal = Form(216285, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.charcoal = Form(210784, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.chaurusChitin = Form(240983, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.chitinPlate = Form(176206, "Dragonborn.esm" /* Dragonborn */);
  SkyrimForms.deathBell = Form(333512, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.dragonbone = Form(241060, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.dragonscale = Form(241059, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.fireSalt = Form(240990, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.firewood = Form(457107, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.frostSalt = Form(240991, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.leather = Form(898514, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.leatherStrips = Form(524516, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.netchLeather = Form(118140, "Dragonborn.esm" /* Dragonborn */);
  SkyrimForms.oreStalhrim = Form(176235, "Dragonborn.esm" /* Dragonborn */);
  SkyrimForms.pettySoulGem = Form(189666, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.torchbugThorax = Form(318067, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.voidSalt = Form(240992, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwClothingHands = Form(1101075, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwClothingHead = Form(1101073, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwClothingFeet = Form(1101074, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwClothingBody = Form(689751, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorClothing = Form(441320, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorHeavy = Form(441298, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorLight = Form(441299, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorDreamcloth = Form(377540, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwArmorMaterialBlades = Form(2496, "Update.esm" /* Update */);
  SkyrimForms.kwArmorMaterialDaedric = Form(441300, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialDarkBrotherhood = Form(1113442, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialDawnguard = Form(77005, "Dawnguard.esm" /* Dawnguard */);
  SkyrimForms.kwArmorMaterialDragonplate = Form(441301, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialDragonscale = Form(441302, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialDwarven = Form(441303, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialEbony = Form(441304, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialElven = Form(441305, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialElvenGilded = Form(441306, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialFalmerHardened = Form(77006, "Dawnguard.esm" /* Dawnguard */);
  SkyrimForms.kwArmorMaterialFalmerHeavy = Form(77007, "Dawnguard.esm" /* Dawnguard */);
  SkyrimForms.kwArmorMaterialFalmerHeavyOriginal = Form(77008, "Dawnguard.esm" /* Dawnguard */);
  SkyrimForms.kwArmorMaterialForsworn = Form(2489, "Update.esm" /* Update */);
  SkyrimForms.kwArmorMaterialFur = Form(33364, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwArmorMaterialGlass = Form(441308, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialHide = Form(441309, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialHunter = Form(20676, "Dawnguard.esm" /* Dawnguard */);
  SkyrimForms.kwArmorMaterialImperialHeavy = Form(441314, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialImperialLight = Form(441312, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialImperialStudded = Form(441313, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialIron = Form(441315, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialIronBanded = Form(441316, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialLeather = Form(441307, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialNightingale = Form(1113441, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialNordicHeavy = Form(147717, "Dragonborn.esm" /* Dragonborn */);
  SkyrimForms.kwArmorMaterialOrcish = Form(441317, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialScaled = Form(441310, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialStalhrimHeavy = Form(147718, "Dragonborn.esm" /* Dragonborn */);
  SkyrimForms.kwArmorMaterialStalhrimLight = Form(147719, "Dragonborn.esm" /* Dragonborn */);
  SkyrimForms.kwArmorMaterialSteel = Form(441318, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialSteelPlate = Form(441319, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialStormcloak = Form(704826, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialStudded = Form(441311, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorMaterialThievesGuild = Form(2492, "Update.esm" /* Update */);
  SkyrimForms.kwArmorMaterialVampire = Form(83518, "Dawnguard.esm" /* Dawnguard */);
  SkyrimForms.kwDLC1ArmorMaterialDawnguard = Form(77005, "Dawnguard.esm" /* Dawnguard */);
  SkyrimForms.kwDLC1ArmorMaterialHunter = Form(20676, "Dawnguard.esm" /* Dawnguard */);
  SkyrimForms.kwDLC2ArmorMaterialChitinLight = Form(147714, "Dragonborn.esm" /* Dragonborn */);
  SkyrimForms.kwDLC2ArmorMaterialChitinHeavy = Form(147715, "Dragonborn.esm" /* Dragonborn */);
  SkyrimForms.kwDLC2ArmorMaterialBonemoldLight = Form(147712, "Dragonborn.esm" /* Dragonborn */);
  SkyrimForms.kwDLC2ArmorMaterialBonemoldHeavy = Form(147713, "Dragonborn.esm" /* Dragonborn */);
  SkyrimForms.kwWAF_ArmorMaterialDraugr = Form(11469109, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_ArmorMaterialGuard = Form(11469074, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_ArmorMaterialThalmor = Form(11469346, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_ArmorWolf = Form(11469063, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_DLC1ArmorDawnguardHeavy = Form(11469079, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_DLC1ArmorDawnguardLight = Form(11469080, "Update.esm" /* Update */);
  SkyrimForms.kwArmorShieldHeavy = Form(586341, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwArmorShieldLight = Form(586342, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwArmorSlotGauntlets = Form(442607, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorSlotHelmet = Form(442606, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorSlotBoots = Form(442605, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorSlotCuirass = Form(442604, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwArmorSlotShield = Form(615858, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwCraftingSmelter = Form(679118, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwCraftingSmithingArmorTable = Form(711544, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwCraftingSmithingForge = Form(557317, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwCraftingSmithingSharpeningWheel = Form(557320, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwCraftingTanningRack = Form(493162, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwJewelry = Form(588122, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwMasqueradeBandit = Form(239786, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwMasqueradeForsworn = Form(239785, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwMasqueradeImperial = Form(228657, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwMasqueradeStormcloak = Form(228655, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwMasqueradeThalmor = Form(228651, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwVendorItemClothing = Form(588123, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWAF_WeapMaterialBlades = Form(11469059, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_WeapMaterialForsworn = Form(11469060, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_DLC1WeapMaterialDawnguard = Form(11469078, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_TreatAsMaterialDaedric = Form(11469335, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_TreatAsMaterialDragon = Form(11469334, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_TreatAsMaterialDwarven = Form(11469329, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_TreatAsMaterialEbony = Form(11469333, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_TreatAsMaterialElven = Form(11469330, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_TreatAsMaterialGlass = Form(11469332, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_TreatAsMaterialIron = Form(11469321, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_TreatAsMaterialLeather = Form(11469337, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_TreatAsMaterialOrcish = Form(11469331, "Update.esm" /* Update */);
  SkyrimForms.kwWAF_TreatAsMaterialSteel = Form(11469328, "Update.esm" /* Update */);
  SkyrimForms.kwDLC2WeaponMaterialStalhrim = Form(156207, "Dragonborn.esm" /* Dragonborn */);
  SkyrimForms.kwWeapMaterialDaedric = Form(124703, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapMaterialDragonbone = Form(104482, "Dawnguard.esm" /* Dawnguard */);
  SkyrimForms.kwWeapMaterialDraugr = Form(809985, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapMaterialDraugrHoned = Form(809986, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapMaterialDwarven = Form(124698, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapMaterialEbony = Form(124702, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapMaterialElven = Form(124699, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapMaterialFalmer = Form(809987, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapMaterialFalmerHoned = Form(809988, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapMaterialGlass = Form(124701, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapMaterialImperial = Form(809984, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapMaterialIron = Form(124696, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapMaterialNordic = Form(156208, "Dragonborn.esm" /* Dragonborn */);
  SkyrimForms.kwWeapMaterialOrcish = Form(124700, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapMaterialSilver = Form(1092122, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapMaterialSilverRefined = Form(2423175, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapMaterialSteel = Form(124697, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapMaterialWood = Form(124695, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapTypeBastardSword = Form(348145, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeBattleaxe = Form(448818, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapTypeBattlestaff = Form(133207, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeBoundWeapon = Form(62433, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeBow = Form(124693, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapTypeBroadsword = Form(345375, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeClub = Form(637475, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeCrossbow = Form(455677, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapTypeDagger = Form(124691, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapTypeGlaive = Form(637504, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeGreatsword = Form(448817, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapTypeHalberd = Form(637502, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeHatchet = Form(3356278, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeKatana = Form(345379, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeLongbow = Form(455678, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapTypeLongmace = Form(657039, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeLongsword = Form(345376, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeMace = Form(124692, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapTypeMaul = Form(3356279, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeNodachi = Form(346760, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeSaber = Form(346759, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeScimitar = Form(346759, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeShortbow = Form(355167, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeShortspear = Form(1753785, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeShortsword = Form(544871, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeStaff = Form(124694, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapTypeSword = Form(124689, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapTypeTanto = Form(345378, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeUnarmed = Form(421730, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeWakizashi = Form(345377, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwWeapTypeWaraxe = Form(124690, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapTypeWarhammer = Form(448816, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwWeapTypeYari = Form(637503, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.kwDLC1CrossbowIsEnhanced = Form(14748, "Dawnguard.esm" /* Dawnguard */);
  SkyrimForms.kwMagicDisallowEnchanting = Form(796605, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwActivatorLever = Form(450221, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.lightLightsource = Form(238389, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkAlchemyFuse = Form(65242, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkAlchemyAdvancedExplosives = Form(65241, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkDreamclothBody = Form(380325, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkDreamclothHands = Form(380328, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkDreamclothHead = Form(380324, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkDreamclothFeet = Form(380327, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkEnchantingElementalBombard0 = Form(718425, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkEnchantingElementalBombard1 = Form(4059214, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkMarksmanshipAdvancedMissilecraft0 = Form(718448, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkMarksmanshipAdvancedMissilecraft1 = Form(718500, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkMarksmanshipAdvancedMissilecraft2 = Form(4059213, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkMarksmanshipArbalest = Form(718497, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkMarksmanshipBallistics = Form(718423, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkMarksmanshipEngineer = Form(718501, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkMarksmanshipLightweightConstruction = Form(718498, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkMarksmanshipRecurve = Form(718496, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkMarksmanshipSilencer = Form(718499, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkSilverPerk = Form(1103493, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.perkSmithingAdvanced = Form(832532, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.perkSmithingArcaneBlacksmith = Form(336270, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.perkSmithingDaedric = Form(832531, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.perkSmithingDragon = Form(336272, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.perkSmithingDwarven = Form(832526, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.perkSmithingEbony = Form(832530, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.perkSmithingElven = Form(832527, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.perkSmithingGlass = Form(832529, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.perkSmithingLeather = Form(1936358, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkSmithingMeltdown = Form(364405, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.perkSmithingOrcish = Form(832528, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.perkSmithingSilver = Form(360930, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.perkSmithingSilverRefined = Form(348149, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkSmithingSteel = Form(832525, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.perkSmithingWeavingMill = Form(378919, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkSneakThiefsToolbox0 = Form(228661, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkWeaponCrossbow = Form(2433314, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkWeaponCrossbowArbalest = Form(718502, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkWeaponCrossbowArbalestSilenced = Form(718504, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkWeaponCrossbowSilenced = Form(718503, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkWeaponShortspear = Form(1753786, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkWeaponSilverRefined = Form(355164, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.perkWeaponYari = Form(648739, "SkyRe_Main.esp" /* SkyRe */);
  SkyrimForms.itmCoinPouchUp = Form(563629, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.itmCoinPouchDown = Form(563630, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.itmMushroomUp = Form(765203, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.itmClampUp = Form(1049894, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.itmPotionUpSD = Form(257469, "Skyrim.esm" /* Skyrim */);
  SkyrimForms.kwdaWeapTypeAny1H = Form(127018, "Poulet - Main.esp" /* Poulet */);
  SkyrimForms.kwdaWeapTypeAny2H = Form(127019, "Poulet - Main.esp" /* Poulet */);
  SkyrimForms.kwCraftingClothingStation = Form(231780, "Poulet - Main.esp" /* Poulet */);

  // src/localization.ts
  var LocData = {
    weapon: {
      "crossbow": {
        "Arbalest": {
          "name": {
            "ru": "\u0414\u043E\u0432\u0435\u0434\u0435\u043D\u044B\u0439",
            "en": "Arbalest"
          },
          "desc": {
            "ru": " \u0421\u0442\u0440\u0435\u043B\u044F\u0435\u0442 \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u0435\u0435 \u043D\u043E \u043D\u0430\u043D\u043E\u0441\u0438\u0442 \u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0443\u0440\u043E\u043D \u0446\u0435\u043B\u044F\u043C \u0432 \u0431\u043B\u043E\u043A\u0435.",
            "en": " Deals double damage against blocking enemies but fires slower."
          }
        },
        "Classic": {
          "name": {
            "ru": "\u0410\u0440\u0431\u0430\u043B\u0435\u0442",
            "en": "Crossbow"
          },
          "desc": {
            "ru": "\u0418\u0433\u043D\u043E\u0440\u0438\u0440\u0443\u0435\u0442 50% \u0431\u0440\u043E\u043D\u0438.",
            "en": "Ignores 50% armor."
          }
        },
        "Lightweight": {
          "name": {
            "ru": "\u041E\u0431\u043B\u0435\u0433\u0447\u0435\u043D\u043D\u044B\u0439",
            "en": "Lightweight"
          },
          "desc": {
            "ru": " \u0418\u043C\u0435\u0435\u0442 \u0443\u0432\u0435\u043B\u0438\u0447\u0435\u043D\u043D\u0443\u044E \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u0441\u0442\u0440\u0435\u043B\u044C\u0431\u044B.",
            "en": " Has increased attack speed."
          }
        },
        "Recurve": {
          "name": {
            "ru": "\u0418\u0437\u043E\u0433\u043D\u0443\u0442\u044B\u0439",
            "en": "Recurve"
          },
          "desc": {
            "ru": " \u041D\u0430\u043D\u043E\u0441\u0438\u0442 \u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0443\u0440\u043E\u043D.",
            "en": " Deals additional damage."
          }
        },
        "Silenced": {
          "name": {
            "ru": "\u0422\u0438\u0445\u0438\u0439",
            "en": "Silenced"
          },
          "desc": {
            "ru": " \u041D\u0430\u043D\u043E\u0441\u0438\u0442 \u0443\u0432\u0435\u043B\u0438\u0447\u0435\u043D\u043D\u044B\u0439 \u0443\u0440\u043E\u043D \u0432 \u0440\u0435\u0436\u0438\u043C\u0435 \u0441\u043A\u0440\u044B\u0442\u043D\u043E\u0441\u0442\u0438.",
            "en": " Deals increased sneak attack damage."
          }
        }
      },
      "weapTypes": {
        "Bastard": {
          "ru": "\u041F\u043E\u043B\u0443\u0442\u043E\u0440\u043D\u044B\u0439",
          "en": "Bastard"
        },
        "Battlestaff": {
          "ru": "\u0411\u043E\u0435\u0432\u043E\u0439 \u043F\u043E\u0441\u043E\u0445",
          "en": "Battlestaff"
        },
        "Broadsword": {
          "ru": "\u041F\u0430\u043B\u0430\u0448",
          "en": "Broadsword"
        },
        "Club": {
          "ru": "\u0414\u0443\u0431\u0438\u043D\u043A\u0430",
          "en": "Club"
        },
        "Crossbow": {
          "ru": "\u0410\u0440\u0431\u0430\u043B\u0435\u0442",
          "en": "Crossbow"
        },
        "Glaive": {
          "ru": "\u0413\u043B\u0435\u0444\u0430",
          "en": "Glaive"
        },
        "Halberd": {
          "ru": "\u0410\u043B\u0435\u0431\u0430\u0440\u0434\u0430",
          "en": "Halberd"
        },
        "Hatchet": {
          "ru": "\u0422\u043E\u043F\u043E\u0440\u0438\u043A",
          "en": "Hatchet"
        },
        "Katana": {
          "ru": "\u041A\u0430\u0442\u0430\u043D\u0430",
          "en": "Katana"
        },
        "Longbow": {
          "ru": "\u0414\u043B\u0438\u043D\u043D\u044B\u0439",
          "en": "Longbow"
        },
        "Longmace": {
          "ru": "\u0414\u043B\u0438\u043D\u043D\u044B\u0439 \u043C\u043E\u043B\u043E\u0442",
          "en": "Longmace"
        },
        "Longsword": {
          "ru": "\u0414\u043B\u0438\u043D\u043D\u044B\u0439 \u043C\u0435\u0447",
          "en": "Longsword"
        },
        "Maul": {
          "ru": "\u041C\u043E\u043B\u043E\u0442",
          "en": "maul"
        },
        "Nodachi": {
          "ru": "\u041D\u043E\u0434\u0430\u0442\u0438",
          "en": "Nodachi"
        },
        "Saber": {
          "ru": "\u0421\u0430\u0431\u043B\u044F",
          "en": "Saber"
        },
        "Scimitar": {
          "ru": "\u0421\u043A\u0438\u043C\u043C\u0438\u0442\u0430\u0440",
          "en": "Scimitar"
        },
        "Shortbow": {
          "ru": "\u041A\u043E\u0440\u043E\u0442\u043A\u0438\u0439",
          "en": "Shortbow"
        },
        "Shortspear": {
          "ru": "\u041A\u043E\u0440\u043E\u0442\u043A\u043E\u0435 \u043A\u043E\u043F\u044C\u0451",
          "en": "Shortspear"
        },
        "Shortsword": {
          "ru": "\u041A\u043E\u0440\u043E\u0442\u043A\u0438\u0439 \u043C\u0435\u0447",
          "en": "Shortsword"
        },
        "Tanto": {
          "ru": "\u0422\u0430\u043D\u0442\u043E",
          "en": "Tanto"
        },
        "Unarmed": {
          "ru": "\u0411\u0435\u0437 \u043E\u0440\u0443\u0436\u0438\u044F",
          "en": "Unarmed"
        },
        "Wakizashi": {
          "ru": "\u0412\u0430\u043A\u0438\u0434\u0437\u0430\u0441\u0438",
          "en": "Wakizashi"
        },
        "Yari": {
          "ru": "\u042F\u0440\u0438",
          "en": "Yari"
        },
        "Battleaxe": {
          "ru": "\u0421\u0435\u043A\u0438\u0440\u0430",
          "en": "Battleaxe"
        },
        "Bow": {
          "ru": "\u041B\u0443\u043A",
          "en": "Bow"
        },
        "Dagger": {
          "ru": "\u041A\u0438\u043D\u0436\u0430\u043B",
          "en": "Dagger"
        },
        "Greatsword": {
          "ru": "\u0414\u0432\u0443\u0440\u0443\u0447\u043D\u044B\u0439 \u043C\u0435\u0447",
          "en": "Greatsword"
        },
        "Mace": {
          "ru": "\u0411\u0443\u043B\u0430\u0432\u0430",
          "en": "Mace"
        },
        "Sword": {
          "ru": "\u041C\u0435\u0447",
          "en": "Sword"
        },
        "Waraxe": {
          "ru": "\u0422\u043E\u043F\u043E\u0440",
          "en": "Waraxe"
        },
        "Warhammer": {
          "ru": "\u0411\u043E\u0435\u0432\u043E\u0439 \u043C\u043E\u043B\u043E\u0442",
          "en": "Warhammer"
        }
      },
      "silverRefined": {
        "name": {
          "ru": "\u0417\u0430\u043A\u0430\u043B\u0435\u043D\u043D\u043E\u0435",
          "en": "Refined"
        },
        "desc": {
          "ru": "\u042D\u0442\u043E \u0443\u0441\u0438\u043B\u0435\u043D\u043D\u043E\u0435 \u043E\u0440\u0443\u0436\u0438\u0435 \u0437\u0430\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 \u043D\u0435\u0436\u0438\u0442\u044C \u0433\u043E\u0440\u0435\u0442\u044C, \u043D\u0430\u043D\u043E\u0441\u044F \u043F\u0435\u0440\u0438\u043E\u0434\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043E\u0433\u043D\u0435\u043D\u043D\u044B\u0439 \u0443\u0440\u043E\u043D.",
          "en": "These supreme weapons set undead enemies ablaze, dealing extra damage."
        }
      },
      "shortbow": {
        "name": {
          "ru": "\u041A\u043E\u0440\u043E\u0442\u043A\u0438\u0439 \u043B\u0443\u043A",
          "en": "Shortbow"
        },
        "searchFor": {
          "ru": "\u041B\u0443\u043A",
          "en": "Bow"
        }
      },
      "longbow": {
        "name": {
          "en": "Longbow",
          "ru": "\u041A\u043E\u0440\u043E\u0442\u043A\u0438\u0439 \u043B\u0443\u043A"
        }
      }
    },
    armor: {
      "dreamcloth": {
        "ru": "\u0422\u043A\u0430\u043D\u044C \u0413\u0440\u0435\u0437",
        "en": "Dreamcloth"
      },
      "shield": {
        "heavy": {
          "ru": "\u0422\u044F\u0436\u0435\u043B\u044B\u0439",
          "en": "Heavy"
        },
        "light": {
          "en": "Light",
          "ru": "\u041B\u0435\u0433\u043A\u0438\u0439"
        },
        "name": {
          "en": "Shield",
          "ru": "\u0429\u0438\u0442"
        },
        "rule": {
          "en": "",
          "ru": ""
        }
      }
    },
    projectile: {
      "Barbed": {
        "name": {
          "ru": "\u041E\u0441\u043A\u043E\u043B\u043E\u0447\u043D\u044B\u0439",
          "en": "Barbed"
        },
        "desc": {
          "ru": "\u041D\u0430 \u043F\u0440\u043E\u0442\u044F\u0436\u0435\u043D\u0438\u0438 8 \u0441\u0435\u043A\u0443\u043D\u0434 \u0446\u0435\u043B\u044C \u0438\u0441\u0442\u0435\u043A\u0430\u0435\u0442 \u043A\u0440\u043E\u0432\u044C\u044E, \u043F\u043E\u043B\u0443\u0447\u0430\u044F 6 \u0435\u0434\u0438\u043D\u0438\u0446 \u0443\u0440\u043E\u043D\u0430 \u0438 \u0437\u0430\u043C\u0435\u0434\u043B\u044F\u044F\u0441\u044C \u043D\u0430 20%.",
          "en": "Deals 6 points of bleeding damag per second over 8 seconds, and slows the target down by 20%."
        }
      },
      "Explosive": {
        "name": {
          "ru": "\u0420\u0430\u0437\u0440\u044B\u0432\u043D\u043E\u0439",
          "en": "Explosive"
        },
        "desc": {
          "en": "Explodes upon impact, dealing 60 points of non-elemental damage.",
          "ru": "\u0412\u0437\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u0438 \u0441\u0442\u043E\u043B\u043A\u043D\u043E\u0432\u0435\u043D\u0438\u0438, \u043D\u0430\u043D\u043E\u0441\u0438\u0442 60 \u0435\u0434\u0438\u043D\u0438\u0446 \u0443\u0440\u043E\u043D\u0430."
        }
      },
      "Fire": {
        "name": {
          "ru": "\u041E\u0433\u043D\u0435\u043D\u043D\u044B\u0439",
          "en": "Fire"
        },
        "desc": {
          "ru": "\u0412\u0437\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u0438 \u0441\u0442\u043E\u043B\u043A\u043D\u043E\u0432\u0435\u043D\u0438\u0438, \u043D\u0430\u043D\u043E\u0441\u044F 30 \u0435\u0434\u0438\u043D\u0438\u0446 \u0443\u0440\u043E\u043D\u0430 \u043E\u0433\u043D\u0451\u043C.",
          "en": "Explodes upon impact, dealing 30 points of fire damage."
        }
      },
      "Frost": {
        "name": {
          "ru": "\u041C\u043E\u0440\u043E\u0437\u043D\u044B\u0439",
          "en": "Frost"
        },
        "desc": {
          "ru": "\u0412\u0437\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u0438 \u0441\u0442\u043E\u043B\u043A\u043D\u043E\u0432\u0435\u043D\u0438\u0438, \u043D\u0430\u043D\u043E\u0441\u044F 30 \u0435\u0434\u0438\u043D\u0438\u0446 \u0443\u0440\u043E\u043D\u0430 \u043B\u044C\u0434\u043E\u043C.",
          "en": "Explodes upon impact, dealing 30 points of frost damage."
        }
      },
      "Heavyweight": {
        "name": {
          "ru": "\u0423\u0442\u044F\u0436\u0435\u043B\u0435\u043D\u043D\u044B\u0439",
          "en": "Heavyweight"
        },
        "desc": {
          "en": "Has a 50% increased chance to stagger, and a 25% chance to strike the target down.",
          "ru": "\u0418\u043C\u0435\u0435\u0442 50% \u0448\u0430\u043D\u0441 \u043E\u0433\u043B\u0443\u0448\u0438\u0442\u044C \u0446\u0435\u043B\u044C \u0438 25% \u043E\u043F\u0440\u043E\u043A\u0438\u043D\u0443\u0442\u044C."
        }
      },
      "Lightsource": {
        "name": {
          "ru": "\u041E\u0441\u0432\u0435\u0442\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439",
          "en": "Lightsource"
        },
        "desc": {
          "ru": "\u041F\u043E\u0441\u043B\u0435 \u0432\u044B\u0441\u0442\u0440\u0435\u043B\u0430 \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u043E\u043C \u0441\u0432\u0435\u0442\u0430.",
          "en": "Emits light after being fired."
        }
      },
      "Neuralgia": {
        "name": {
          "ru": "\u0418\u0441\u0442\u043E\u0449\u0430\u044E\u0449\u0438\u0439",
          "en": "Neuralgia"
        },
        "desc": {
          "ru": "\u0423\u0434\u0432\u0430\u0438\u0432\u0430\u0435\u0442 \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C \u0437\u0430\u043A\u043B\u0438\u043D\u0430\u043D\u0438\u0439 \u0446\u0435\u043B\u0438 \u0438 \u0432\u044B\u0442\u044F\u0433\u0438\u0432\u0430\u0435\u0442 10 \u0441\u0435\u043A\u0443\u043D\u0434 \u043F\u043E 10 \u0435\u0434\u0438\u043D\u0438\u0446 \u043C\u0430\u0433\u0438\u0438.",
          "en": "Doubles spell casting cost and drains 10 points of Magicka per second for 10 seconds."
        }
      },
      "Noisemaker": {
        "name": {
          "ru": "\u0428\u0443\u043C\u043E\u0432\u043E\u0439",
          "en": "Noisemaker"
        },
        "desc": {
          "ru": "\u0421\u043E\u0437\u0434\u0430\u0451\u0442 \u0437\u0432\u0443\u043A\u043E\u0432\u0443\u044E \u0432\u043E\u043B\u043D\u0443 \u043F\u043E\u0441\u043B\u0435 \u0441\u0442\u043E\u043B\u043A\u043D\u043E\u0432\u0435\u043D\u0438\u044F \u0441 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C\u044E, \u043E\u0442\u0432\u043B\u0435\u043A\u0430\u044F \u0432\u0440\u0430\u0433\u043E\u0432.",
          "en": "Emits sound upon impact, distracting enemies."
        }
      },
      "Shock": {
        "name": {
          "ru": "\u041C\u043E\u043B\u043D\u0438\u0435\u0432\u044B\u0439",
          "en": "Shock"
        },
        "desc": {
          "ru": "\u0412\u0437\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u0438 \u0441\u0442\u043E\u043B\u043A\u043D\u043E\u0432\u0435\u043D\u0438\u0438, \u043D\u0430\u043D\u043E\u0441\u044F 30 \u0435\u0434\u0438\u043D\u0438\u0446 \u0443\u0440\u043E\u043D\u0430 \u044D\u043B\u0435\u043A\u0442\u0440\u0438\u0447\u0435\u0441\u0442\u0432\u043E\u043C.",
          "en": "Explodes upon impact, dealing 30 points of shock damage."
        }
      },
      "Strong": {
        "name": {
          "ru": "\u0423\u0442\u044F\u0436\u0435\u043B\u0435\u043D\u043D\u044B\u0439",
          "en": "Strong"
        }
      },
      "Strongest": {
        "name": {
          "ru": "\u041F\u0440\u043E\u0431\u0438\u0432\u043D\u043E\u0439",
          "en": "Strongest"
        }
      },
      "Timebomb": {
        "name": {
          "ru": "\u041E\u0442\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0439 \u0432\u0437\u0440\u044B\u0432",
          "en": "Timebomb"
        },
        "desc": {
          "ru": "\u0412\u0437\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0441\u043F\u0443\u0441\u0442\u044F 3 \u0441\u0435\u043A\u0443\u043D\u0434\u044B \u0432\u044B\u0441\u0442\u0440\u0435\u043B\u0430 \u0432 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C, \u043D\u0430\u043D\u043E\u0441\u044F 150 \u0443\u0440\u043E\u043D\u0430.",
          "en": "xplodes 3 seconds after being fired into a surface, dealing 150 points of non-elemental damage."
        }
      }
    },
    flora: {
      mushrooms: {
        "en": ["SPORE", "CAP", "CROWN"],
        "ru": ["\u0411\u0415\u041B\u042F\u041D\u041A\u0410", "\u0412\u0415\u041D\u0415\u0426"]
      },
      clams: {
        "en": ["CLAM"],
        "ru": ["\u0420\u0410\u041A\u0423\u0428\u041A"]
      },
      fill: {
        "en": ["FILL"],
        "ru": ["\u041D\u0410\u041F\u041E\u041B\u041D\u0418\u0422\u042C", "\u041F\u041E\u041F\u041E\u041B\u041D\u0418\u0422\u042C", "\u041D\u0410\u0411\u0420\u0410\u0422\u042C"]
      },
      barrel: {
        "en": ["BARREL", "CASK"],
        "ru": ["\u0411\u041E\u0427\u041A"]
      },
      coins: {
        "en": ["COIN"],
        "ru": ["\u041C\u041E\u041D\u0415\u0422"]
      }
    },
    activators: {
      search: {
        "en": ["SEARCH"],
        "ru": ["\u0418\u0421\u041A\u0410\u0422\u042C", "\u041F\u041E\u0418\u0421\u041A", "\u041E\u0421\u041C\u041E\u0422\u0420\u0415\u0422\u042C"]
      },
      grab: {
        "en": ["GRAB", "TOUCH"],
        "ru": ["\u0412\u0417\u042F\u0422\u042C", "\u041A\u041E\u0421\u041D\u0423\u0422"]
      },
      lever: {
        "en": ["LEVER"],
        "ru": ["\u0420\u042B\u0427\u0410\u0413"]
      },
      chain: {
        "en": ["CHAIN"],
        "ru": ["\u0426\u0415\u041F\u042C"]
      },
      mine: {
        "en": ["MINE"],
        "ru": ["\u0414\u041E\u0411\u042B\u0412\u0410\u0422\u042C"]
      },
      examine: {
        "en": ["EXAMINE", "PUSH", "INVESTIGATE"],
        "ru": ["\u0422\u041E\u041B\u041A\u041D\u0423\u0422\u042C", "\u0418\u0417\u0423\u0427\u0418\u0422\u042C"]
      },
      button: {
        "en": ["BUTTON"],
        "ru": ["\u041A\u041D\u041E\u041F\u041A\u0410"]
      },
      catch: {
        "en": ["CATCH"],
        "ru": ["\u041F\u041E\u0419\u041C\u0410\u0422\u042C"]
      },
      harvest: {
        "en": ["HARVEST"],
        "ru": ["\u0412\u042B\u0420\u0412\u0410\u0422\u042C"]
      },
      read: {
        "en": ["READ"],
        "ru": ["\u041F\u0420\u041E\u0427\u0415\u0421\u0422\u042C"]
      },
      write: {
        "en": ["WRITE"],
        "ru": ["\u041F\u0418\u0421\u0410\u0422\u042C"]
      },
      shrine: {
        "en": ["SHRINE", "ALTAR", "PRAY", "WORSHIP"],
        "ru": ["\u0421\u0412\u042F\u0422\u0418\u041B\u0418\u0429\u0415", "\u0410\u041B\u0422\u0410\u0420\u042C", "\u041C\u041E\u041B\u0418\u0422\u042C\u0421\u042F"]
      },
      drink: {
        "en": ["DRINK"],
        "ru": [""]
      },
      eat: {
        "en": ["EAT"],
        "ru": [""]
      },
      drop: {
        "en": ["DROP", "PLACE"],
        "ru": [""]
      },
      pickup: {
        "en": ["PICK UP"],
        "ru": [""]
      },
      take: {
        "en": ["TAKE"],
        "ru": [""]
      },
      talk: {
        "en": ["TALK"],
        "ru": [""]
      },
      sit: {
        "en": ["SIT"],
        "ru": [""]
      },
      open: {
        "en": ["CHEST", "OPEN"],
        "ru": [""]
      },
      activate: {
        "en": ["ACTIVATE"],
        "ru": [""]
      },
      unlock: {
        "en": ["UNLOCK"],
        "ru": [""]
      },
      sleep: {
        "en": ["SLEEP", "BED", "HAMMOCK", "COFFIN"],
        "ru": ["\u0421\u041F\u0410\u0422\u042C", "\u041E\u0422\u0414\u042B\u0425\u0410\u0422\u042C", "\u0413\u0420\u041E\u0411", "\u041A\u0420\u041E\u0412\u0410\u0422\u042C"]
      },
      steal: {
        "en": ["STEAL"],
        "ru": ["\u0423\u041A\u0420\u0410\u0421\u0422\u042C"]
      },
      stealFrom: {
        "en": ["STEAL FROM"],
        "ru": [""]
      },
      pickpocket: {
        "en": ["PICKPOCKET"],
        "ru": [""]
      },
      close: {
        "en": ["CLOSE"],
        "ru": [""]
      }
    }
  };
  var LanguageKeyCodes = {
    "ABKHAZ": "ab",
    "AFAR": "aa",
    "AFRIKAANS": "af",
    "AKAN": "ak",
    "ALBANIAN": "sq",
    "AMHARIC": "am",
    "ARABIC": "ar",
    "ARAGONESE": "an",
    "ARMENIAN": "hy",
    "ASSAMESE": "as",
    "AVARIC": "av",
    "AVESTAN": "ae",
    "AYMARA": "ay",
    "AZERBAIJANI": "az",
    "BAMBARA": "bm",
    "BASHKIR": "ba",
    "BASQUE": "eu",
    "BELARUSIAN": "be",
    "BENGALI": "bn",
    "BIHARI": "bh",
    "BISLAMA": "bi",
    "BOSNIAN": "bs",
    "BRETON": "br",
    "BULGARIAN": "bg",
    "BURMESE": "my",
    "CATALAN": "ca",
    "VALENCIAN": "ca",
    "CHAMORRO": "ch",
    "CHECHEN": "ce",
    "CHICHEWA": "ny",
    "NYANJA": "ny",
    "CHEWA": "ny",
    "CHINESE": "zh",
    "CHUVASH": "cv",
    "CORNISH": "kw",
    "CORSICAN": "co",
    "CREE": "cr",
    "CROATIAN": "hr",
    "CZECH": "cs",
    "DANISH": "da",
    "DIVEHI": "dv",
    "MALDIVIAN": "dv",
    "DHIVEHI": "dv",
    "DUTCH": "nl",
    "ENGLISH": "en",
    "ESPERANTO": "eo",
    "ESTONIAN": "et",
    "EWE": "ee",
    "FAROESE": "fo",
    "FIJIAN": "fj",
    "FINNISH": "fi",
    "FRENCH": "fr",
    "FULA": "ff",
    "FULAH": "ff",
    "PULAR": "ff",
    "PULAAR": "ff",
    "GALICIAN": "gl",
    "GEORGIAN": "ka",
    "GERMAN": "de",
    "GREEK": "el",
    "MODERN": "el",
    "GUARAN\xCD": "gn",
    "GUJARATI": "gu",
    "HAITIAN": "ht",
    "HAUSA": "ha",
    "HERERO": "hz",
    "HINDI": "hi",
    "HIRI MOTU": "ho",
    "HUNGARIAN": "hu",
    "INTERLINGUA": "ia",
    "INDONESIAN": "id",
    "INTERLINGUE": "ie",
    "IRISH": "ga",
    "IGBO": "ig",
    "INUPIAQ": "ik",
    "IDO": "io",
    "ICELANDIC": "is",
    "ITALIAN": "it",
    "INUKTITUT": "iu",
    "JAPANESE": "ja",
    "JAVANESE": "jv",
    "KALAALLISUT": "kl",
    "GREENLANDIC": "kl",
    "KANNADA": "kn",
    "KANURI": "kr",
    "KASHMIRI": "ks",
    "KAZAKH": "kk",
    "KHMER": "km",
    "KIKUYU": "ki",
    "GIKUYU": "ki",
    "KINYARWANDA": "rw",
    "KIRGHIZ": "ky",
    "KYRGYZ": "kv",
    "KOMI": "kv",
    "KONGO": "kg",
    "KOREAN": "ko",
    "KURDISH": "ku",
    "KWANYAMA": "kj",
    "KUANYAMA": "kj",
    "LATIN": "la",
    "LUXEMBOURGISH": "lb",
    "LETZEBURGESCH": "lb",
    "LUGANDA": "lg",
    "LIMBURGISH": "li",
    "LIMBURGAN": "li",
    "LIMBURGER": "li",
    "LINGALA": "ln",
    "LAO": "lo",
    "LITHUANIAN": "lt",
    "LATVIAN": "lv",
    "MANX": "gv",
    "MACEDONIAN": "mk",
    "MALAGASY": "mg",
    "MALAY": "ms",
    "MALAYALAM": "ml",
    "MALTESE": "mt",
    "M\u0100ORI": "mi",
    "MARSHALLESE": "mh",
    "MONGOLIAN": "mn",
    "NAURU": "na",
    "NAVAJO": "nv",
    "NAVAHO": "nv",
    "NORWEGIAN BOKM\xC5L": "nb",
    "NEPALI": "ne",
    "NDONGA": "ng",
    "NORWEGIAN NYNORSK": "nn",
    "NORWEGIAN": "no",
    "NUOSU": "ii",
    "OCCITAN": "oc",
    "OJIBWE": "oj",
    "OJIBWA": "oj",
    "OROMO": "om",
    "ORIYA": "or",
    "OSSETIAN": "os",
    "OSSETIC": "os",
    "PANJABI": "pa",
    "PUNJABI": "pa",
    "P\u0100LI": "pi",
    "PERSIAN": "fa",
    "POLISH": "pl",
    "PASHTO": "ps",
    "PUSHTO": "ps",
    "PORTUGUESE": "pt",
    "QUECHUA": "qu",
    "ROMANSH": "rm",
    "KIRUNDI": "rn",
    "ROMANIAN": "ro",
    "MOLDAVIAN": "ro",
    "MOLDOVAN": "ro",
    "RUSSIAN": "ru",
    "SANSKRIT": "sa",
    "SARDINIAN": "sc",
    "SINDHI": "sd",
    "SAMOAN": "sm",
    "SANGO": "sg",
    "SERBIAN": "sr",
    "GAELIC": "gd",
    "SHONA": "sn",
    "SINHALA": "si",
    "SINHALESE": "si",
    "SLOVAK": "sk",
    "SLOVENE": "sl",
    "SOMALI": "so",
    "SPANISH": "es",
    "Castilian": "es",
    "SUNDANESE": "su",
    "SWAHILI": "sw",
    "SWATI": "ss",
    "SWEDISH": "sv",
    "TAMIL": "ta",
    "TELUGU": "te",
    "TAJIK": "tg",
    "THAI": "th",
    "TIGRINYA": "ti",
    "TURKMEN": "tk",
    "TAGALOG": "tl",
    "TSWANA": "tn",
    "TONGA": "to",
    "TURKISH": "tr",
    "TSONGA": "ts",
    "TATAR": "tt",
    "TWI": "tw",
    "TAHITIAN": "ty",
    "UKRAINIAN": "uk",
    "URDU": "ur",
    "UZBEK": "uz",
    "VENDA": "ve",
    "VIETNAMESE": "vi",
    "VOLAP\xDCK": "vo",
    "WALLOON": "wa",
    "WELSH": "cy",
    "WOLOF": "wo",
    "XHOSA": "xh",
    "YIDDISH": "yi",
    "YORUBA": "yo"
  };
  function getLanguageCode(lang) {
    return LanguageKeyCodes[lang.toUpperCase()];
  }

  // src/settingsController.ts
  function SettingsController($scope, patcherService) {
    let updateFiles = function() {
      $scope.settings.reproccerReborn.npc.plugins = $scope.plugins.map((item) => item.filename);
    };
    $scope.addPlugin = function() {
      $scope.plugins.push({ filename: "Plugin.esp" });
      $scope.onChange();
    };
    $scope.removePlugin = function(index) {
      $scope.plugins.splice(index, 1);
      $scope.onChange();
    };
    $scope.onChange = function() {
      updateFiles();
    };
    $scope.plugins = $scope.settings.reproccerReborn.npc.plugins.map((filename) => ({ filename }));
  }

  // src/alchemy.ts
  var AlchemyPatcher = class {
    constructor(helpers, locals, patch, settings) {
      this.baseStats = settings.alchemy.baseStats;
      this.helpers = helpers;
      this.locals = locals;
      this.rules = locals.rules.alchemy;
      this.settings = settings;
      this.load = {
        filter: this.filterFunc.bind(this),
        signature: "INGR"
      };
      this.patch = this.patchFunc.bind(this);
    }
    clampValue(record) {
      if (!this.baseStats.usePriceLimits) {
        return;
      }
      var newValue = clamp(this.baseStats.priceLimits.lower, parseInt(xelib.GetValue(record, "DATA\\Value"), 10), this.baseStats.priceLimits.upper);
      xelib.SetFlag(record, "ENIT\\Flags", "No auto-calculation", true);
      xelib.SetUIntValue(record, "DATA\\Value", newValue);
    }
    updateEffects(record) {
      xelib.GetElements(record, "Effects").forEach(this.updateEffect.bind(this));
    }
    updateEffect(effectsHandle) {
      var mgef = getWinningLinksTo(effectsHandle, "EFID");
      if (!mgef)
        return;
      var name = xelib.FullName(mgef);
      var edid = xelib.EditorID(mgef);
      if (this.rules.excludedEffects.includes(name))
        return;
      var newDuration = xelib.GetIntValue(effectsHandle, "EFIT\\Duration");
      var newMagnitude = xelib.GetFloatValue(effectsHandle, "EFIT\\Magnitude");
      this.rules.effects.some((effect) => {
        if (name.includes(effect.name) || edid.includes(effect.name) || effect.edid && edid.includes(effect.edid)) {
          newDuration = this.baseStats.duration + effect.bonus;
          newMagnitude *= effect.magnitudeFactor;
          return true;
        }
      });
      if (safeHasFlag(mgef, "Magic Effect Data\\DATA\\Flags", "No Duration"))
        xelib.SetUIntValue(effectsHandle, "EFIT\\Duration", newDuration);
      if (safeHasFlag(mgef, "Magic Effect Data\\DATA\\Flags", "No Magnitude")) {
        newMagnitude = Math.max(1, newMagnitude);
        xelib.SetFloatValue(effectsHandle, "EFIT\\Magnitude", newMagnitude);
      }
    }
    filterFunc(record) {
      if (!this.settings.alchemy.enabled)
        return false;
      return true;
    }
    patchFunc(record) {
      this.updateEffects(record);
      this.clampValue(record);
    }
  };

  // src/projectile.ts
  var ProjectilePatcher = class {
    constructor(helpers, locals, pf, settings) {
      this.names = {};
      this.editorIds = {};
      this.helpers = helpers;
      this.patchFile = pf;
      this.rules = locals.rules.projectiles;
      this.settings = settings;
      this.lang = settings.lang;
      this.load = {
        filter: this.filterFunc.bind(this),
        signature: "AMMO"
      };
      this.patch = this.patchFunc.bind(this);
    }
    newEditorId(id) {
      if (this.editorIds[id] === void 0)
        this.editorIds[id] = 0;
      this.editorIds[id] += 1;
      return "".concat(id).concat(String(this.editorIds[id]));
    }
    filterFunc(record) {
      if (!this.settings.projectiles.enabled)
        return false;
      var name = xelib.FullName(record);
      if (!name)
        return false;
      var edid = xelib.EditorID(record);
      if (this.rules.excludedAmmunition.find((ex) => {
        return name.includes(ex) || edid.includes(ex);
      }))
        return false;
      if (!this.rules.baseStats.find((bs) => {
        return name.includes(bs.identifier) || edid.includes(bs.identifier);
      }))
        return false;
      return true;
    }
    patchFunc(record) {
      this.names[record] = xelib.FullName(record);
      this.patchStats(record);
      if (!xelib.GetFlag(record, "DATA\\Flags", "Non-Playable"))
        this.addVariants(record);
    }
    createStrongAmmo(ammo) {
      const tag = "Strong";
      var newName = "".concat(this.names[ammo], " - ", LocData.projectile[tag].name[this.lang]);
      var newEditorId = this.newEditorId("REP_STRONG_AMMO_".concat(xelib.EditorID(ammo)));
      var strongAmmo = xelib.CopyElement(ammo, this.patchFile, true);
      this.names[strongAmmo] = newName;
      xelib.AddElementValue(strongAmmo, "EDID", newEditorId);
      xelib.AddElementValue(strongAmmo, "FULL", newName);
      this.patchStats(strongAmmo);
      this.helpers.cacheRecord(strongAmmo, newEditorId);
      return strongAmmo;
    }
    createStrongestAmmo(ammo) {
      const tag = "Strongest";
      var newName = "".concat(this.names[ammo], " - ", LocData.projectile[tag].name[this.lang]);
      var newEditorId = this.newEditorId("REP_STRONGEST_AMMO_".concat(xelib.EditorID(ammo)));
      var strongestAmmo = xelib.CopyElement(ammo, this.patchFile, true);
      this.names[strongestAmmo] = newName;
      xelib.AddElementValue(strongestAmmo, "EDID", newEditorId);
      xelib.AddElementValue(strongestAmmo, "FULL", newName);
      this.patchStats(strongestAmmo);
      this.helpers.cacheRecord(strongestAmmo, newEditorId);
      return strongestAmmo;
    }
    createExplosiveAmmo(ammo, explosion, type, desc) {
      var newName = "".concat(this.names[ammo], " - ", LocData.projectile[type].name[this.lang]);
      var newEditorId = this.newEditorId("REP_EXP_".concat(xelib.EditorID(ammo)));
      var newAmmo = xelib.CopyElement(ammo, this.patchFile, true);
      this.names[newAmmo] = newName;
      xelib.AddElementValue(newAmmo, "EDID", newEditorId);
      xelib.AddElementValue(newAmmo, "FULL", newName);
      xelib.AddElementValue(newAmmo, "DESC", desc);
      this.patchStats(newAmmo);
      var projectile = xelib.GetLinksTo(newAmmo, "DATA\\Projectile");
      xelib.SetFlag(projectile, "DATA\\Flags", "Explosion", true);
      xelib.SetFlag(projectile, "DATA\\Flags", "Alt. Trigger", false);
      xelib.SetValue(projectile, "DATA\\Explosion", explosion);
      this.helpers.cacheRecord(newAmmo, newEditorId);
      return newAmmo;
    }
    createExplodingAmmo(ammo) {
      const tag = "Explosive";
      var desc = LocData.projectile[tag].desc[this.lang];
      return this.createExplosiveAmmo(ammo, SkyrimForms.expExploding, tag, desc);
    }
    createTimebombAmmo(ammo) {
      const tag = "Timebomb";
      var timer = 3;
      var newName = "".concat(this.names[ammo], " - ", LocData.projectile[tag].name[this.lang]);
      var newEditorId = this.newEditorId("REP_TIMEBOMB_".concat(xelib.EditorID(ammo)));
      var timebombAmmo = xelib.CopyElement(ammo, this.patchFile, true);
      this.names[timebombAmmo] = newName;
      xelib.AddElementValue(timebombAmmo, "EDID", newEditorId);
      xelib.AddElementValue(timebombAmmo, "FULL", newName);
      xelib.AddElementValue(timebombAmmo, "DESC", LocData.projectile[tag].desc[this.lang]);
      this.patchStats(timebombAmmo);
      var projectile = getWinningLinksTo(timebombAmmo, "DATA\\Projectile");
      if (!projectile)
        return timebombAmmo;
      xelib.SetFlag(projectile, "DATA\\Flags", "Explosion", true);
      xelib.SetFlag(projectile, "DATA\\Flags", "Alt. Trigger", true);
      xelib.SetFloatValue(projectile, "DATA\\Explosion - Alt. Trigger - Timer", timer);
      xelib.SetValue(projectile, "DATA\\Explosion", SkyrimForms.expTimebomb);
      this.helpers.cacheRecord(timebombAmmo, newEditorId);
      return timebombAmmo;
    }
    createFrostAmmo(ammo) {
      const tag = "Frost";
      var desc = LocData.projectile[tag].desc[this.lang];
      return this.createExplosiveAmmo(ammo, SkyrimForms.expElementalFrost, tag, desc);
    }
    createFireAmmo(ammo) {
      const tag = "Fire";
      var desc = LocData.projectile[tag].desc[this.lang];
      return this.createExplosiveAmmo(ammo, SkyrimForms.expElementalFire, tag, desc);
    }
    createShockAmmo(ammo) {
      const tag = "Shock";
      var desc = LocData.projectile[tag].desc[this.lang];
      return this.createExplosiveAmmo(ammo, SkyrimForms.expElementalShock, tag, desc);
    }
    createBarbedAmmo(ammo) {
      const tag = "Barbed";
      var desc = LocData.projectile[tag].desc[this.lang];
      return this.createExplosiveAmmo(ammo, SkyrimForms.expBarbed, tag, desc);
    }
    createHeavyweightAmmo(ammo) {
      const tag = "Heavyweight";
      var desc = LocData.projectile[tag].desc[this.lang];
      return this.createExplosiveAmmo(ammo, SkyrimForms.expHeavyweight, tag, desc);
    }
    createLightsourceAmmo(ammo) {
      const tag = "Lightsource";
      var newName = "".concat(this.names[ammo], " - ", LocData.projectile[tag].name[this.lang]);
      var newEditorId = this.newEditorId("REP_LIGHTSOURCE_".concat(xelib.EditorID(ammo)));
      var lightsourceAmmo = xelib.CopyElement(ammo, this.patchFile, true);
      this.names[lightsourceAmmo] = newName;
      xelib.AddElementValue(lightsourceAmmo, "EDID", newEditorId);
      xelib.AddElementValue(lightsourceAmmo, "FULL", newName);
      xelib.AddElementValue(lightsourceAmmo, "DESC", LocData.projectile[tag].desc[this.lang]);
      this.patchStats(lightsourceAmmo);
      var projectile = xelib.GetWinningOverride(xelib.GetLinksTo(lightsourceAmmo, "DATA\\Projectile"));
      xelib.SetValue(projectile, "DATA\\Light", SkyrimForms.lightLightsource);
      this.helpers.cacheRecord(lightsourceAmmo, newEditorId);
      return lightsourceAmmo;
    }
    createNoisemakerAmmo(ammo) {
      const tag = "Noisemaker";
      var desc = LocData.projectile[tag].desc[this.lang];
      return this.createExplosiveAmmo(ammo, SkyrimForms.expNoisemaker, tag, desc);
    }
    createNeuralgiaAmmo(ammo) {
      const tag = "Neuralgia";
      var desc = LocData.projectile[tag].desc[this.lang];
      return this.createExplosiveAmmo(ammo, SkyrimForms.expNeuralgia, tag, desc);
    }
    addCraftingRecipe(baseAmmo, newAmmo, secondaryIngredients, requiredPerks) {
      var ammoReforgeInputCount = 10;
      var ammoReforgeOutputCount = 10;
      var secondaryIngredientInputCount = 1;
      var newRecipe = xelib.AddElement(this.patchFile, "Constructible Object\\COBJ");
      xelib.AddElementValue(newRecipe, "EDID", "REP_CRAFT_AMMO_".concat(xelib.EditorID(newAmmo)));
      xelib.AddElement(newRecipe, "Items");
      var baseItem = xelib.GetElement(newRecipe, "Items\\[0]");
      xelib.SetValue(baseItem, "CNTO\\Item", xelib.GetHexFormID(baseAmmo));
      xelib.SetUIntValue(baseItem, "CNTO\\Count", ammoReforgeInputCount);
      secondaryIngredients.forEach((ingredient) => {
        var secondaryItem = xelib.AddElement(newRecipe, "Items\\.");
        xelib.SetValue(secondaryItem, "CNTO\\Item", ingredient);
        xelib.SetUIntValue(secondaryItem, "CNTO\\Count", secondaryIngredientInputCount);
      });
      xelib.AddElementValue(newRecipe, "BNAM", SkyrimForms.kwCraftingSmithingForge);
      xelib.AddElementValue(newRecipe, "NAM1", "".concat(String(ammoReforgeOutputCount)));
      xelib.AddElementValue(newRecipe, "CNAM", xelib.GetHexFormID(newAmmo));
      xelib.AddElement(newRecipe, "Conditions");
      requiredPerks.forEach((perk, index) => {
        var condition;
        if (index === 0) {
          condition = xelib.GetElement(newRecipe, "Conditions\\[0]");
        } else {
          condition = xelib.AddElement(newRecipe, "Conditions\\.");
        }
        updateHasPerkCondition(newRecipe, condition, 1e7, 1, perk);
      });
      createGetItemCountCondition(newRecipe, 11e6, ammoReforgeInputCount, baseAmmo);
    }
    createCrossbowOnlyVariants(ammo) {
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
    createVariants(ammo) {
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
      var found = this.rules.baseStats.find((bs) => {
        return edid.includes(bs.identifier) && bs.type !== "ARROW";
      });
      if (found) {
        this.createCrossbowOnlyVariants(ammo);
      }
    }
    addVariants(ammo) {
      var name = this.names[ammo];
      var edid = xelib.EditorID(ammo).toUpperCase();
      if (this.rules.excludedAmmunitionVariants.find((v) => {
        return name.includes(v) || edid.includes(v.toUpperCase());
      })) {
        return;
      }
      this.createVariants(ammo);
      this.multiplyBolts(ammo);
    }
    multiplyBolts(ammo) {
      var edid = xelib.EditorID(ammo);
      var found = this.rules.baseStats.find((bs) => {
        return edid.includes(bs.identifier) && bs.type !== "BOLT";
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
    patchStats(ammo) {
      var calculateProjec = this.calculateProjectileStats(ammo);
      var newGravity = calculateProjec.gravity;
      var newSpeed = calculateProjec.speed;
      var newRange = calculateProjec.range;
      var newDamage = calculateProjec.damage;
      var failed = calculateProjec.failed;
      if (failed) {
        return;
      }
      var oldProjectile = getWinningLinksTo(ammo, "DATA\\Projectile");
      if (!oldProjectile)
        return;
      var newEditorId = this.newEditorId("REP_PROJ_".concat(xelib.EditorID(ammo)));
      var newProjectile = xelib.CopyElement(oldProjectile, this.patchFile, true);
      xelib.AddElementValue(newProjectile, "EDID", newEditorId);
      xelib.SetFloatValue(newProjectile, "DATA\\Gravity", newGravity);
      xelib.SetFloatValue(newProjectile, "DATA\\Speed", newSpeed);
      xelib.SetFloatValue(newProjectile, "DATA\\Range", newRange);
      this.helpers.cacheRecord(newProjectile, newEditorId);
      xelib.SetValue(ammo, "DATA\\Projectile", xelib.GetHexFormID(newProjectile));
      xelib.SetUIntValue(ammo, "DATA\\Damage", newDamage);
    }
    calculateProjectileStats(ammo) {
      var name = this.names[ammo];
      var edid = xelib.EditorID(ammo);
      var newGravity = 0;
      var newSpeed = 0;
      var newRange = 0;
      var newDamage = 0;
      var failed = false;
      this.rules.baseStats.some((bs) => {
        if (!edid.includes(bs.identifier))
          return false;
        newGravity = bs.gravity;
        newSpeed = bs.speed;
        newRange = bs.range;
        newDamage = bs.damage;
        return true;
      });
      this.rules.materialStats.some((ms) => {
        if (edid.includes(ms.name) || ms.edid && ms.edid !== null && edid.includes(ms.edid)) {
          newGravity += ms.gravity;
          newSpeed += ms.speed;
          newDamage += ms.damage;
          return true;
        } else
          return false;
      });
      this.rules.modifierStats.some((ms) => {
        if (name.includes(ms.name) || edid.includes(ms.name)) {
          newGravity += ms.gravity;
          newSpeed += ms.speed;
          newDamage += ms.damage;
          return true;
        } else
          return false;
      });
      failed = newGravity <= 0 || newSpeed <= 0 || newRange <= 0 || newDamage <= 0;
      return {
        gravity: newGravity,
        speed: newSpeed,
        range: newRange,
        damage: newDamage,
        failed
      };
    }
  };

  // src/armor.ts
  var ArmorPatcher = class {
    constructor(helpers, locals, patch, settings) {
      this.names = {};
      this.editorIds = {};
      this.baseStats = settings.armor.baseStats;
      this.cobj = locals.cobj;
      this.helpers = helpers;
      this.locals = locals;
      this.modifiers = settings.armor.modifiers;
      this.patchFile = patch;
      this.rules = locals.rules.armor;
      this.settings = settings;
      this.lang = settings.lang;
      if (this.settings.armor.enabled) {
        this.updateGameSettings();
      }
      this.createKeywordMaps();
      this.load = {
        filter: this.filterFunc.bind(this),
        signature: "ARMO"
      };
      this.patch = this.patchFunc.bind(this);
    }
    newEditorId(id) {
      if (this.editorIds[id] === void 0) {
        this.editorIds[id] = 0;
      }
      this.editorIds[id] += 1;
      return "".concat(id).concat(String(this.editorIds[id]));
    }
    updateGameSettings() {
      var hexFormId = parseInt(SkyrimForms.gmstArmorScalingFactor, 16);
      var protectionPerArmorBaseRecord = xelib.GetRecord(0, hexFormId);
      var protectionPerArmor = xelib.CopyElement(protectionPerArmorBaseRecord, this.patchFile);
      xelib.SetFloatValue(protectionPerArmor, "DATA\\Float", this.settings.armor.baseStats.protectionPerArmor);
      hexFormId = parseInt(SkyrimForms.gmstMaxArmorRating, 16);
      var maxProtectionBaseRecord = xelib.GetRecord(0, hexFormId);
      var maxProtection = xelib.CopyElement(maxProtectionBaseRecord, this.patchFile);
      xelib.SetFloatValue(maxProtection, "DATA\\Float", this.settings.armor.baseStats.maxProtection);
    }
    filterFunc(record) {
      if (!this.settings.armor.enabled) {
        return false;
      }
      var name = xelib.FullName(record);
      var edid = xelib.EditorID(record);
      if (name && this.rules.excludedArmor.find((e) => {
        if (e.edid && e.edid !== null)
          return edid.includes(e.edid);
        else
          return name.includes(e.name);
      })) {
        return false;
      }
      if (xelib.HasElement(record, "TNAM")) {
        return true;
      }
      if (!xelib.FullName(record) || !xelib.HasElement(record, "KWDA")) {
        return false;
      }
      if (xelib.HasArrayItem(record, "KWDA", "", SkyrimForms.kwVendorItemClothing)) {
        return true;
      }
      if (xelib.HasArrayItem(record, "KWDA", "", SkyrimForms.kwJewelry)) {
        return false;
      }
      var keywords = [SkyrimForms.kwArmorHeavy, SkyrimForms.kwArmorLight, SkyrimForms.kwArmorSlotShield];
      if (!keywords.some((kwda) => {
        return xelib.HasArrayItem(record, "KWDA", "", kwda);
      })) {
        return false;
      }
      return true;
    }
    getFactionArray(armor) {
      var faction = [];
      var name = this.names[armor];
      var edid = xelib.EditorID(armor);
      this.rules.masquerade.filter((e) => {
        if (e.edid && e.edid !== null) {
          if (!edid.includes(e.edid))
            return false;
        }
        if (!edid.includes(e.substring) || !name.includes(e.substring))
          return false;
        return faction.push(e.faction);
      });
      return faction;
    }
    addMeltdownRecipe(armor) {
      let override = this.getArmorMaterialOverride(armor);
      var name = this.names[armor];
      var edid = xelib.EditorID(armor);
      var kwda = getKwda(armor);
      var excluded = this.rules.excludedFromRecipes.find((e) => {
        if (e.edid && e.edid !== null)
          return edid.includes(e.edid);
        else
          return name.includes(e.name);
      });
      if (xelib.HasArrayItem(armor, "KWDA", "", SkyrimForms.excludeFromMeltdownRecipes) || excluded)
        return;
      if (xelib.HasElement(armor, "EITM"))
        return;
      var outputQuantity = 1;
      var inputQuantity = 1;
      var input;
      var perk;
      var bnam;
      if (kwda(SkyrimForms.kwArmorSlotCuirass) || kwda(SkyrimForms.kwArmorSlotShield)) {
        outputQuantity += 1;
      }
      if (kwda(SkyrimForms.kwWAF_ArmorMaterialDraugr)) {
        input = SkyrimForms.dragonscale;
        bnam = SkyrimForms.kwCraftingSmelter;
        perk = SkyrimForms.perkSmithingSteel;
        inputQuantity += 1;
      } else {
        this.armorMaterialsMap.some((e) => {
          if (!kwda(e.kwda)) {
            return false;
          }
          bnam = e.bnam;
          input = e.input;
          perk = e.perk;
          if (e.func) {
            outputQuantity += 1;
          }
          return true;
        });
      }
      if (!input) {
        if (!override)
          this.log(armor, "Couldn't determine material - no meltdown recipe generated.");
        return;
      }
      var recipe = xelib.AddElement(this.patchFile, "Constructible Object\\COBJ");
      xelib.AddElementValue(recipe, "EDID", "REP_MELTDOWN_".concat(xelib.EditorID(armor)));
      xelib.AddElementValue(recipe, "BNAM", bnam);
      xelib.AddElementValue(recipe, "CNAM", input);
      xelib.AddElementValue(recipe, "NAM1", "".concat(String(outputQuantity)));
      xelib.AddElement(recipe, "Items");
      var baseItem = xelib.GetElement(recipe, "Items\\[0]");
      xelib.SetValue(baseItem, "CNTO\\Item", xelib.GetHexFormID(armor));
      xelib.SetUIntValue(baseItem, "CNTO\\Count", inputQuantity);
      xelib.AddElement(recipe, "Conditions");
      var condition = xelib.GetElement(recipe, "Conditions\\[0]");
      updateHasPerkCondition(recipe, condition, 1e7, 1, SkyrimForms.perkSmithingMeltdown);
      if (perk) {
        createHasPerkCondition(recipe, 1e7, 1, perk);
      }
      createGetItemCountCondition(recipe, 11e6, 1, armor);
      createGetEquippedCondition(recipe, 1e7, 0, armor);
    }
    modifyLeatherCraftingRecipe(armor, armorFormID, armorHasLeatherKwda, armorHasThievesGuildKwda, excluded, recipe) {
      var cnamv = recipe.cnamv;
      if (!armorHasLeatherKwda && !armorHasThievesGuildKwda || excluded || !cnamv.includes(armorFormID)) {
        return;
      }
      var newRecipe = xelib.CopyElement(recipe.handle, this.patchFile);
      createHasPerkCondition(newRecipe, 1e7, 1, SkyrimForms.perkSmithingLeather);
    }
    temperingPerkFromKeyword(armor) {
      var perk;
      var kwda;
      this.armorMaterialsMap.some((e) => {
        if (!xelib.HasArrayItem(armor, "KWDA", "", e.kwda)) {
          return false;
        }
        perk = e.perk;
        kwda = e.kwda;
        return true;
      });
      if (!kwda && !perk && this.getArmorMaterialOverride(armor) === null) {
        this.log(armor, "Couldn't determine material - tempering recipe not modified.");
      }
      return perk;
    }
    modifyTemperingRecipe(armor, armorFormID, excluded, recipe) {
      var bnam = recipe.bnam;
      var cnamv = recipe.cnamv;
      var bench = parseInt(SkyrimForms.kwCraftingSmithingArmorTable, 16);
      if (bnam !== bench || excluded || !cnamv.includes(armorFormID)) {
        return;
      }
      var perk = this.temperingPerkFromKeyword(armor);
      if (!perk) {
        return;
      }
      var newRecipe = xelib.CopyElement(recipe.handle, this.patchFile);
      var condition = removeTemperingConditions(newRecipe, this.armorMaterialsMap, perk);
      var newCondition;
      if (!condition && !xelib.HasArrayItem(newRecipe, "Conditions", "CTDA\\Parameter #1", perk)) {
        newCondition = xelib.AddArrayItem(newRecipe, "Conditions", "", "");
        updateHasPerkCondition(newRecipe, newCondition, 1e7, 1, perk);
        xelib.MoveArrayItem(newCondition, 0);
      }
      if (!xelib.HasArrayItem(newRecipe, "Conditions", "CTDA\\Function", "EPTemperingItemIsEnchanted") && !xelib.HasArrayItem(newRecipe, "Conditions", "CTDA\\Parameter #1", SkyrimForms.perkSmithingArcaneBlacksmith)) {
        newCondition = xelib.AddArrayItem(newRecipe, "Conditions", "", "");
        updateHasPerkCondition(newRecipe, newCondition, "00010000", 1, "", "EPTemperingItemIsEnchanted");
        newCondition = xelib.AddArrayItem(newRecipe, "Conditions", "", "");
        updateHasPerkCondition(newRecipe, newCondition, 1e7, 1, SkyrimForms.perkSmithingArcaneBlacksmith);
      }
    }
    modifyRecipes(armor) {
      var armorFormID = xelib.GetHexFormID(armor);
      var armorHasLeatherKwda = xelib.HasArrayItem(armor, "KWDA", "", SkyrimForms.kwArmorMaterialLeather);
      var armorHasThievesGuildKwda = xelib.HasArrayItem(armor, "KWDA", "", SkyrimForms.kwArmorMaterialThievesGuild);
      var name = this.names[armor];
      var edid = xelib.EditorID(armor);
      var excluded = this.rules.excludedFromRecipes.find((e) => {
        if (e.edid && e.edid !== null)
          return edid.includes(e.edid);
        else
          return name.includes(e.name);
      });
      if (!excluded)
        excluded = this.rules.excludedFromRecipes.find((e) => {
          return edid.includes(e.name);
        });
      this.cobj.forEach((recipe) => {
        this.modifyTemperingRecipe(armor, armorFormID, excluded, recipe);
        this.modifyLeatherCraftingRecipe(armor, armorFormID, armorHasLeatherKwda, armorHasThievesGuildKwda, excluded, recipe);
      });
    }
    patchShieldWeight(armor) {
      if (!xelib.HasElement(armor, "KWDA") || !xelib.HasArrayItem(armor, "KWDA", "", SkyrimForms.kwArmorSlotShield)) {
        return;
      }
      var name = this.names[armor];
      var type = xelib.GetIntValue(armor, "BOD2\\Armor Type");
      var weightName = "";
      var searchName = LocData.armor.shield.name[this.lang];
      if (type === 1) {
        weightName = LocData.armor.shield.heavy[this.lang];
        if (!xelib.HasElement(armor, "TNAM")) {
          xelib.AddElementValue(armor, "KWDA\\.", SkyrimForms.kwArmorShieldHeavy);
          xelib.AddElementValue(armor, "BIDS", "WPNBashShieldHeavyImpactSet [IPDS:000183FE]");
          xelib.AddElementValue(armor, "BAMT", "MaterialShieldHeavy [MATT:00016979]");
        }
      }
      if (type === 0) {
        weightName = LocData.armor.shield.light[this.lang];
        if (!xelib.HasElement(armor, "TNAM")) {
          xelib.AddElementValue(armor, "KWDA\\.", SkyrimForms.kwArmorShieldLight);
          xelib.AddElementValue(armor, "BIDS", "WPNBashShieldLightImpactSet [IPDS:000183FB]");
          xelib.AddElementValue(armor, "BAMT", "MaterialShieldLight [MATT:00016978]");
        }
      }
      if (weightName.length > 0 && !name.toUpperCase().includes(weightName.toUpperCase())) {
        var data = name.split(searchName);
        data[0] = "".concat(data[0], weightName, " ", searchName);
        this.names[armor] = data.join("");
        xelib.AddElementValue(armor, "FULL", this.names[armor]);
      }
    }
    patchMasqueradeKeywords(armor) {
      var faction = this.getFactionArray(armor);
      if (!faction) {
        return;
      }
      if (faction.includes("THALMOR") && !xelib.HasArrayItem(armor, "KWDA", "", SkyrimForms.kwMasqueradeThalmor)) {
        xelib.AddElementValue(armor, "KWDA\\.", SkyrimForms.kwMasqueradeThalmor);
      }
      if (faction.includes("BANDIT") && !xelib.HasArrayItem(armor, "KWDA", "", SkyrimForms.kwMasqueradeBandit)) {
        xelib.AddElementValue(armor, "KWDA\\.", SkyrimForms.kwMasqueradeBandit);
      }
      if (faction.includes("IMPERIAL") && !xelib.HasArrayItem(armor, "KWDA", "", SkyrimForms.kwMasqueradeImperial)) {
        xelib.AddElementValue(armor, "KWDA\\.", SkyrimForms.kwMasqueradeImperial);
      }
      if (faction.includes("STORMCLOAK") && !xelib.HasArrayItem(armor, "KWDA", "", SkyrimForms.kwMasqueradeStormcloak)) {
        xelib.AddElementValue(armor, "KWDA\\.", SkyrimForms.kwMasqueradeStormcloak);
      }
      if (faction.includes("FORSWORN") && !xelib.HasArrayItem(armor, "KWDA", "", SkyrimForms.kwMasqueradeForsworn)) {
        xelib.AddElementValue(armor, "KWDA\\.", SkyrimForms.kwMasqueradeForsworn);
      }
    }
    createDreamcloth(armor) {
      var kwda = getKwda(armor);
      var dreamclothPerk;
      if (kwda(SkyrimForms.kwClothingBody)) {
        dreamclothPerk = SkyrimForms.perkDreamclothBody;
      } else if (kwda(SkyrimForms.kwClothingHands)) {
        dreamclothPerk = SkyrimForms.perkDreamclothHands;
      } else if (kwda(SkyrimForms.kwClothingHead)) {
        dreamclothPerk = SkyrimForms.perkDreamclothHead;
      } else if (kwda(SkyrimForms.kwClothingFeet)) {
        dreamclothPerk = SkyrimForms.perkDreamclothFeet;
      }
      if (!dreamclothPerk) {
        return null;
      }
      var dreamClothName = LocData.armor.dreamcloth[this.lang];
      var newName = "".concat(this.names[armor], " [", dreamClothName, "]");
      var newEditorId = this.newEditorId("REP_DREAMCLOTH_".concat(xelib.EditorID(armor)));
      var newDreamcloth = xelib.CopyElement(armor, this.patchFile, true);
      xelib.AddElementValue(newDreamcloth, "EDID", newEditorId);
      xelib.AddElementValue(newDreamcloth, "FULL", newName);
      this.names[newDreamcloth] = newName;
      xelib.RemoveElement(newDreamcloth, "EITM");
      xelib.RemoveElement(newDreamcloth, "DESC");
      xelib.AddElementValue(newDreamcloth, "KWDA\\.", SkyrimForms.kwArmorDreamcloth);
      addPerkScript(newDreamcloth, "xxxDreamCloth", "pDream", dreamclothPerk);
      this.helpers.cacheRecord(newDreamcloth, newEditorId);
      return newDreamcloth;
    }
    getArmorSlotMultiplier(armor) {
      var kwda = getKwda(armor);
      if (kwda(SkyrimForms.kwArmorSlotBoots)) {
        return this.settings.armor.baseStats.multipliers.boots;
      }
      if (kwda(SkyrimForms.kwArmorSlotCuirass)) {
        return this.settings.armor.baseStats.multipliers.cuirass;
      }
      if (kwda(SkyrimForms.kwArmorSlotGauntlets)) {
        return this.settings.armor.baseStats.multipliers.gauntlets;
      }
      if (kwda(SkyrimForms.kwArmorSlotHelmet)) {
        return this.settings.armor.baseStats.multipliers.helmet;
      }
      if (kwda(SkyrimForms.kwArmorSlotShield)) {
        return this.settings.armor.baseStats.multipliers.shield;
      }
      if (!xelib.GetFlag(armor, "Record Header\\Record Flags", "Non-Playable")) {
        this.log(armor, "Couldn't find armor slot keyword.");
      }
      return 0;
    }
    getKeywordArmorModifier(armor) {
      var kwda = getKwda(armor);
      var modifier = getValueFromName(this.rules.modifierOverrides, this.names[armor], "name", "multiplier");
      if (!modifier)
        modifier = getValueFromName(this.rules.modifierOverrides, xelib.EditorID(armor), "name", "multiplier");
      if (!modifier) {
        if (kwda(SkyrimForms.armorStrongerLow)) {
          modifier = this.modifiers.armorStrongerLow;
        } else if (kwda(SkyrimForms.armorStrongerMedium)) {
          modifier = this.modifiers.armorStrongerMedium;
        } else if (kwda(SkyrimForms.armorStrongerHigh)) {
          modifier = this.modifiers.armorStrongerHigh;
        } else if (kwda(SkyrimForms.armorWeakerLow)) {
          modifier = this.modifiers.armorWeakerLow;
        } else if (kwda(SkyrimForms.armorWeakerMedium)) {
          modifier = this.modifiers.armorWeakerMedium;
        } else if (kwda(SkyrimForms.armorWeakerHigh)) {
          modifier = this.modifiers.armorWeakerHigh;
        } else {
          modifier = 1;
        }
      }
      return modifier;
    }
    getMaterialArmorModifier(armor) {
      var armorRating = getValueFromName(this.rules.materials, this.names[armor], "name", "armor");
      if (armorRating !== null)
        return armorRating;
      armorRating = getValueFromName(this.rules.materials, xelib.EditorID(armor), "name", "armor");
      if (armorRating !== null)
        return armorRating;
      this.armorMaterialsMap.some((e) => {
        if (!xelib.HasArrayItem(armor, "KWDA", "", e.kwda)) {
          return false;
        }
        armorRating = getValueFromName(this.rules.materials, e.name, "name", "armor");
        return true;
      });
      if (armorRating !== null) {
        return armorRating;
      }
      if (!xelib.GetFlag(armor, "Record Header\\Record Flags", "Non-Playable")) {
        this.log(armor, "Couldn't find material keyword nor relevant rule.");
      }
      return 0;
    }
    patchArmorRating(armor) {
      var rating = Math.floor(this.getArmorSlotMultiplier(armor) * this.getMaterialArmorModifier(armor) * this.getKeywordArmorModifier(armor));
      const armorType = xelib.GetIntValue(armor, "BOD2\\Armor Type");
      if (armorType === 1) {
        rating = rating * 1.5;
      }
      if (rating > 0) {
        xelib.SetValue(armor, "DNAM", "".concat(String(rating)));
      } else if (rating === 0 && !xelib.GetFlag(armor, "Record Header\\Record Flags", "Non-Playable")) {
        this.log(armor, "New armor rating calculation result is zero, armor rating not modified!");
      }
    }
    removeMaterialKeywords(armor) {
      this.armorMaterialsMap.find((e) => {
        if (!xelib.HasArrayItem(armor, "KWDA", "", e.kwda)) {
          return false;
        }
        xelib.RemoveArrayItem(armor, "KWDA", "", e.kwda);
        return false;
      });
    }
    overrideMaterialKeywords(armor) {
      var override = this.getArmorMaterialOverride(armor);
      var input;
      var perk;
      if (!override) {
        return;
      } else {
        override.replace("_", " ");
      }
      this.removeMaterialKeywords(armor);
      this.armorMaterialsMap.some((e) => {
        if (e.name) {
          if (override !== e.name && override !== e.name.toUpperCase()) {
            return false;
          }
        }
        xelib.AddElementValue(armor, "KWDA\\.", e.kwda);
        input = e.input;
        perk = e.perk;
        return false;
      });
      var bench = parseInt(SkyrimForms.kwCraftingSmithingArmorTable, 16);
      overrideCraftingRecipes(this.cobj, armor, bench, perk, input, this.patchFile);
    }
    getArmorMaterialOverride(armor) {
      var full = this.names[armor];
      var edid = xelib.EditorID(armor);
      var override = this.rules.materialOverrides.find((o) => {
        if (o.edid)
          return edid.includes(o.edid);
        else
          return full.includes(o.substring);
      });
      return override ? override.material : null;
    }
    addClothingCraftingRecipe(armor, isDreamCloth) {
      var kwda = getKwda(armor);
      var newRecipe = xelib.AddElement(this.patchFile, "Constructible Object\\COBJ");
      xelib.AddElementValue(newRecipe, "EDID", "REP_CRAFT_CLOTHING_".concat(xelib.EditorID(armor)));
      var quantityIngredient1 = 2;
      if (kwda(SkyrimForms.kwClothingBody)) {
        quantityIngredient1 += 2;
      } else if (kwda(SkyrimForms.kwClothingHead)) {
        quantityIngredient1 += 1;
      }
      xelib.AddElement(newRecipe, "Items");
      var ingredient = xelib.AddElement(newRecipe, "Items\\[0]");
      xelib.SetValue(ingredient, "CNTO\\Item", SkyrimForms.leather);
      xelib.SetUIntValue(ingredient, "CNTO\\Count", quantityIngredient1);
      xelib.AddElementValue(newRecipe, "NAM1", "1");
      xelib.AddElementValue(newRecipe, "CNAM", xelib.GetHexFormID(armor));
      xelib.AddElementValue(newRecipe, "BNAM", SkyrimForms.kwCraftingClothingStation);
      var secondaryIngredients = [];
      secondaryIngredients.push(SkyrimForms.leatherStrips);
      if (isDreamCloth) {
        secondaryIngredients.push(SkyrimForms.pettySoulGem);
        xelib.AddElement(newRecipe, "Conditions");
        var condition = xelib.AddElement(newRecipe, "Conditions\\[0]");
        updateHasPerkCondition(newRecipe, condition, 1e7, 1, SkyrimForms.perkSmithingWeavingMill);
      }
      secondaryIngredients.forEach((hexcode) => {
        var ingr = xelib.AddElement(newRecipe, "Items\\.");
        xelib.SetValue(ingr, "CNTO\\Item", hexcode);
        xelib.SetUIntValue(ingr, "CNTO\\Count", 1);
      });
    }
    addClothingMeltdownRecipe(armor, isDreamCloth) {
      var kwda = getKwda(armor);
      var returnQuantity = 1;
      var inputQuantity = 1;
      if (xelib.HasArrayItem(armor, "KWDA", "", SkyrimForms.excludeFromMeltdownRecipes)) {
        return;
      }
      if (xelib.HasElement(armor, "EITM"))
        return;
      if (kwda(SkyrimForms.kwClothingBody)) {
        returnQuantity += 2;
      } else if (kwda(SkyrimForms.kwClothingHands) || kwda(SkyrimForms.kwClothingHead) || kwda(SkyrimForms.kwClothingFeet)) {
        returnQuantity += 1;
      }
      var newRecipe = xelib.AddElement(this.patchFile, "Constructible Object\\COBJ");
      xelib.AddElementValue(newRecipe, "EDID", "REP_MELTDOWN_CLOTHING_".concat(xelib.EditorID(armor)));
      xelib.AddElement(newRecipe, "Items");
      var ingredient = xelib.GetElement(newRecipe, "Items\\[0]");
      xelib.SetValue(ingredient, "CNTO\\Item", xelib.GetHexFormID(armor));
      xelib.SetUIntValue(ingredient, "CNTO\\Count", inputQuantity);
      xelib.AddElementValue(newRecipe, "NAM1", "".concat(String(returnQuantity)));
      xelib.AddElementValue(newRecipe, "CNAM", SkyrimForms.leatherStrips);
      xelib.AddElementValue(newRecipe, "BNAM", SkyrimForms.kwCraftingClothingStation);
      xelib.AddElement(newRecipe, "Conditions");
      var condition = xelib.GetElement(newRecipe, "Conditions\\[0]");
      updateHasPerkCondition(newRecipe, condition, 1e7, 1, SkyrimForms.perkSmithingMeltdown);
      if (isDreamCloth) {
        createHasPerkCondition(newRecipe, 1e7, 1, SkyrimForms.perkSmithingWeavingMill);
      }
      createGetItemCountCondition(newRecipe, 11e6, 1, armor);
      createGetEquippedCondition(newRecipe, 1e7, 0, armor);
    }
    processClothing(armor) {
      this.addClothingMeltdownRecipe(armor);
      var name = this.names[armor];
      var edid = xelib.EditorID(armor);
      if (this.rules.excludedDreamcloth.find((ed) => {
        if (ed.edid && ed.edid !== null)
          return edid.includes(ed.edid);
        else
          return name.includes(ed.name);
      })) {
        return;
      }
      if (xelib.HasElement(armor, "EITM")) {
        return;
      }
      var dreamcloth = this.createDreamcloth(armor);
      if (!dreamcloth) {
        return;
      }
      this.addClothingCraftingRecipe(dreamcloth, true);
      this.addClothingMeltdownRecipe(dreamcloth, true);
    }
    patchFunc(armor) {
      this.names[armor] = xelib.FullName(armor);
      if (xelib.HasElement(armor, "TNAM")) {
        this.patchShieldWeight(armor);
        return;
      } else if (xelib.HasElement(armor, "KWDA") && xelib.HasArrayItem(armor, "KWDA", "", SkyrimForms.kwVendorItemClothing) && !xelib.GetFlag(armor, "Record Header\\Record Flags", "Non-Playable")) {
        this.patchMasqueradeKeywords(armor);
        this.processClothing(armor);
        return;
      }
      this.overrideMaterialKeywords(armor);
      if (!xelib.HasElement(armor, "TNAM") && !xelib.GetFlag(armor, "Record Header\\Record Flags", "Non-Playable")) {
        this.patchMasqueradeKeywords(armor);
      }
      if (!xelib.HasArrayItem(armor, "KWDA", "", SkyrimForms.kwVendorItemClothing)) {
        this.patchArmorRating(armor);
      }
      this.patchShieldWeight(armor);
      if (!xelib.GetFlag(armor, "Record Header\\Record Flags", "Non-Playable")) {
        this.modifyRecipes(armor);
        this.addMeltdownRecipe(armor);
      }
    }
    createKeywordMaps() {
      this.heavyMaterialsMap = [{
        name: "Blades",
        kwda: SkyrimForms.kwArmorMaterialBlades,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingSteel,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Daedric",
        kwda: SkyrimForms.kwArmorMaterialDaedric,
        input: SkyrimForms.ingotEbony,
        perk: SkyrimForms.perkSmithingDaedric,
        bnam: SkyrimForms.kwCraftingSmelter,
        func: "incr"
      }, {
        name: "Dragonplate",
        kwda: SkyrimForms.kwArmorMaterialDragonplate,
        input: SkyrimForms.dragonbone,
        perk: SkyrimForms.perkSmithingDragon,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Dwarven",
        kwda: SkyrimForms.kwArmorMaterialDwarven,
        input: SkyrimForms.ingotDwarven,
        perk: SkyrimForms.perkSmithingDwarven,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Ebony",
        kwda: SkyrimForms.kwArmorMaterialEbony,
        input: SkyrimForms.ingotEbony,
        perk: SkyrimForms.perkSmithingEbony,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Falmer Hardened",
        kwda: SkyrimForms.kwArmorMaterialFalmerHardened,
        input: SkyrimForms.chaurusChitin,
        perk: SkyrimForms.perkSmithingElven,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Falmer Heavy",
        kwda: SkyrimForms.kwArmorMaterialFalmerHeavy,
        input: SkyrimForms.chaurusChitin,
        perk: SkyrimForms.perkSmithingElven,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Falmer",
        kwda: SkyrimForms.kwArmorMaterialFalmerHeavyOriginal,
        input: SkyrimForms.chaurusChitin,
        perk: SkyrimForms.perkSmithingElven,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Imperial Heavy",
        kwda: SkyrimForms.kwArmorMaterialImperialHeavy,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingSteel,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Iron",
        kwda: SkyrimForms.kwArmorMaterialIron,
        input: SkyrimForms.ingotIron,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Iron Banded",
        kwda: SkyrimForms.kwArmorMaterialIronBanded,
        input: SkyrimForms.ingotIron,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Nordic",
        kwda: SkyrimForms.kwArmorMaterialNordicHeavy,
        input: SkyrimForms.ingotQuicksilver,
        perk: SkyrimForms.perkSmithingAdvanced,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Orcish",
        kwda: SkyrimForms.kwArmorMaterialOrcish,
        input: SkyrimForms.ingotOrichalcum,
        perk: SkyrimForms.perkSmithingOrcish,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Stalhrim Heavy",
        kwda: SkyrimForms.kwArmorMaterialStalhrimHeavy,
        input: SkyrimForms.oreStalhrim,
        perk: SkyrimForms.perkSmithingAdvanced,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Steel",
        kwda: SkyrimForms.kwArmorMaterialSteel,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingSteel,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Steel Plate",
        kwda: SkyrimForms.kwArmorMaterialSteelPlate,
        input: SkyrimForms.ingotCorundum,
        perk: SkyrimForms.perkSmithingAdvanced,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Dawnguard",
        kwda: SkyrimForms.kwDLC1ArmorMaterialDawnguard,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingSteel,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Dawnguard Hunter",
        kwda: SkyrimForms.kwDLC1ArmorMaterialHunter,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingSteel,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Bonemold Heavy",
        kwda: SkyrimForms.kwDLC2ArmorMaterialBonemoldHeavy,
        input: SkyrimForms.netchLeather,
        perk: SkyrimForms.perkSmithingAdvanced,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Chitin Heavy",
        kwda: SkyrimForms.kwDLC2ArmorMaterialChitinHeavy,
        input: SkyrimForms.chitinPlate,
        perk: SkyrimForms.perkSmithingElven,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Ancient Nord",
        kwda: SkyrimForms.kwWAF_ArmorMaterialDraugr,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingSteel,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Wolf",
        kwda: SkyrimForms.kwWAF_ArmorWolf,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingSteel,
        bnam: SkyrimForms.kwCraftingSmelter
      }];
      this.lightMaterialsMap = [{
        name: "Shrouded",
        kwda: SkyrimForms.kwArmorMaterialDarkBrotherhood,
        input: SkyrimForms.leatherStrips,
        perk: SkyrimForms.perkSmithingLeather,
        bnam: SkyrimForms.kwCraftingTanningRack,
        func: "incr"
      }, {
        name: "Dragonscale",
        kwda: SkyrimForms.kwArmorMaterialDragonscale,
        input: SkyrimForms.dragonscale,
        perk: SkyrimForms.perkSmithingDragon,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Elven",
        kwda: SkyrimForms.kwArmorMaterialElven,
        input: SkyrimForms.ingotMoonstone,
        perk: SkyrimForms.perkSmithingElven,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Elven Gilded",
        kwda: SkyrimForms.kwArmorMaterialElvenGilded,
        input: SkyrimForms.ingotMoonstone,
        perk: SkyrimForms.perkSmithingElven,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Forsworn",
        kwda: SkyrimForms.kwArmorMaterialForsworn,
        input: SkyrimForms.leatherStrips,
        bnam: SkyrimForms.kwCraftingTanningRack
      }, {
        name: "Glass",
        kwda: SkyrimForms.kwArmorMaterialGlass,
        input: SkyrimForms.ingotMalachite,
        perk: SkyrimForms.perkSmithingGlass,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Hide",
        kwda: SkyrimForms.kwArmorMaterialHide,
        input: SkyrimForms.leatherStrips,
        bnam: SkyrimForms.kwCraftingTanningRack
      }, {
        name: "Imperial Light",
        kwda: SkyrimForms.kwArmorMaterialImperialLight,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingSteel,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Imperial Studded",
        kwda: SkyrimForms.kwArmorMaterialImperialStudded,
        input: SkyrimForms.leatherStrips,
        perk: SkyrimForms.perkSmithingLeather,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Leather",
        kwda: SkyrimForms.kwArmorMaterialLeather,
        input: SkyrimForms.leatherStrips,
        perk: SkyrimForms.perkSmithingLeather,
        bnam: SkyrimForms.kwCraftingTanningRack,
        func: "incr"
      }, {
        name: "Nightingale",
        kwda: SkyrimForms.kwArmorMaterialNightingale,
        input: SkyrimForms.leatherStrips,
        perk: SkyrimForms.perkSmithingLeather,
        bnam: SkyrimForms.kwCraftingTanningRack,
        func: "incr"
      }, {
        name: "Scaled",
        kwda: SkyrimForms.kwArmorMaterialScaled,
        input: SkyrimForms.ingotCorundum,
        perk: SkyrimForms.perkSmithingAdvanced,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Stalhrim Light",
        kwda: SkyrimForms.kwArmorMaterialStalhrimLight,
        input: SkyrimForms.oreStalhrim,
        perk: SkyrimForms.perkSmithingAdvanced,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Stormcloak",
        kwda: SkyrimForms.kwArmorMaterialStormcloak,
        input: SkyrimForms.ingotIron,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Studded",
        kwda: SkyrimForms.kwArmorMaterialStudded,
        input: SkyrimForms.leatherStrips,
        perk: SkyrimForms.perkSmithingLeather,
        bnam: SkyrimForms.kwCraftingTanningRack,
        func: "incr"
      }, {
        name: "Thieves Guild",
        kwda: SkyrimForms.kwArmorMaterialThievesGuild,
        input: SkyrimForms.leatherStrips,
        perk: SkyrimForms.perkSmithingLeather,
        bnam: SkyrimForms.kwCraftingTanningRack,
        func: "incr"
      }, {
        name: "Vampire",
        kwda: SkyrimForms.kwArmorMaterialVampire,
        input: SkyrimForms.leatherStrips,
        perk: SkyrimForms.perkSmithingLeather,
        bnam: SkyrimForms.kwCraftingTanningRack,
        func: "incr"
      }, {
        name: "Bonemold",
        kwda: SkyrimForms.kwDLC2ArmorMaterialBonemoldLight,
        input: SkyrimForms.netchLeather,
        perk: SkyrimForms.perkSmithingAdvanced,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Chitin",
        kwda: SkyrimForms.kwDLC2ArmorMaterialChitinLight,
        input: SkyrimForms.chitinPlate,
        perk: SkyrimForms.perkSmithingElven,
        bnam: SkyrimForms.kwCraftingSmelter
      }, {
        name: "Guard",
        kwda: SkyrimForms.kwWAF_ArmorMaterialGuard,
        input: SkyrimForms.ingotIron,
        bnam: SkyrimForms.kwCraftingSmelter
      }];
      this.armorMaterialsMap = this.lightMaterialsMap.concat(this.heavyMaterialsMap);
    }
    log(armor, message) {
      var name = this.names[armor];
      var formId = xelib.GetHexFormID(armor);
      this.helpers.logMessage("--> ".concat(name, "(").concat(formId, "): ").concat(message));
    }
  };

  // src/weapons.ts
  var WeaponPatcher = class {
    constructor(helpers, locals, pf, settings) {
      this.names = {};
      this.editorIds = {};
      this.baseStats = settings.weapons.baseStats;
      this.cobj = locals.cobj;
      this.helpers = helpers;
      this.locals = locals;
      this.modifiers = settings.weapons.modifiers;
      this.patchFile = pf;
      this.rules = locals.rules.weapons;
      this.settings = settings;
      this.lang = settings.lang;
      this.createKeywordMaps();
      Object.keys(this.modifiers).map((k) => {
        if (this.modifiers[k] < 0) {
          this.modifiers[k] = 0;
        }
        return this.modifiers[k];
      });
      this.load = {
        filter: this.filterFunc.bind(this),
        signature: "WEAP"
      };
      this.patch = this.patchFunc.bind(this);
    }
    newEditorId(id) {
      if (this.editorIds[id] === void 0) {
        this.editorIds[id] = 0;
      }
      this.editorIds[id] += 1;
      return "".concat(id).concat(String(this.editorIds[id]));
    }
    filterFunc(record) {
      if (!this.settings.weapons.enabled) {
        return false;
      }
      var name = xelib.FullName(record);
      if (name && this.rules.excludedWeapons.find((e) => {
        return name.includes(e);
      })) {
        return false;
      }
      if (safeHasArrayItem(record, "KWDA", "", SkyrimForms.kwWeapTypeStaff)) {
        return false;
      }
      if (xelib.HasElement(record, "CNAM")) {
        return true;
      }
      if (xelib.GetFlag(record, "DNAM\\Flags", "Non-playable") && !xelib.GetFlag(record, "DNAM\\Flags2", "Bound Weapon")) {
        return false;
      }
      if (!name) {
        return false;
      }
      return true;
    }
    getWeaponMaterialOverrideString(name) {
      var override = this.rules.materialOverrides.find((o) => {
        if (o.edid && o.edid !== null)
          return name.includes(o.edid);
        else
          return name.includes(o.substring);
      });
      return override ? override.material : null;
    }
    getWeaponTypeOverride(name, edid) {
      var override = this.rules.typeOverrides.find((t) => {
        if (t.edid && t.edid !== null) {
          return edid.includes(t.edid);
        } else {
          return name === t.name;
        }
      });
      return override ? override.type : null;
    }
    removeMaterialKeywords(weapon) {
      this.keywordMaterialMap.find((e) => {
        if (!xelib.HasArrayItem(weapon, "KWDA", "", e.kwda)) {
          return false;
        }
        if (e.name === "Silver" && xelib.HasScript(weapon, "SilverSwordScript")) {
          xelib.RemoveScript(weapon, "SilverSwordScript");
          if (!xelib.HasElement(weapon, "scriptName")) {
            xelib.RemoveElement(weapon, "VMAD");
          }
        }
        xelib.RemoveArrayItem(weapon, "KWDA", "", e.kwda);
        return false;
      });
    }
    checkOverrides(weapon) {
      var type = this.getWeaponTypeOverride(this.names[weapon], xelib.EditorID(weapon));
      var input;
      var perk;
      if (type) {
        var name = LocData.weapon.weapTypes[type][this.lang];
        this.names[weapon] = "".concat(this.names[weapon], " [").concat(name, "]");
        xelib.AddElementValue(weapon, "FULL", this.names[weapon]);
      }
      var override = this.getWeaponMaterialOverrideString(this.names[weapon]);
      if (!override)
        override = this.getWeaponMaterialOverrideString(xelib.EditorID(weapon));
      if (!override) {
        return;
      } else {
        override.replace("_", " ");
      }
      this.removeMaterialKeywords(weapon);
      this.keywordMaterialMap.some((e) => {
        if (e.name) {
          if (override !== e.name && override !== e.name.toUpperCase()) {
            return false;
          }
        }
        if (e.name === "Silver" && !xelib.HasScript(weapon, "SilverSwordScript") && !xelib.HasArrayItem(weapon, "KWDA", "", SkyrimForms.kwWeapTypeBow)) {
          addPerkScript(weapon, "SilverSwordScript", "SilverPerk", e.perk);
        }
        xelib.AddElementValue(weapon, "KWDA\\.", e.kwda);
        input = e.input;
        perk = e.perk;
        return false;
      });
      var bench = parseInt(SkyrimForms.kwCraftingSmithingSharpeningWheel, 16);
      overrideCraftingRecipes(this.cobj, weapon, bench, perk, input, this.patchFile);
    }
    patchBowType(weapon, enchanted) {
      var kwda = getKwda(weapon);
      if (!kwda(SkyrimForms.kwWeapTypeBow) || kwda(SkyrimForms.kwWeapTypeCrossbow)) {
        return;
      }
      if (kwda(SkyrimForms.kwWeapTypeLongbow) || kwda(SkyrimForms.kwWeapTypeShortbow)) {
        return;
      }
      const name = xelib.FullName(weapon).toLocaleUpperCase();
      const edid = xelib.EditorID(weapon).toLowerCase();
      const shortbowName = LocData.weapon.shortbow.name[this.lang];
      const longbowName = LocData.weapon.longbow.name[this.lang].toLocaleUpperCase();
      const crossbowName = LocData.weapon.crossbow.Classic.name[this.lang].toLocaleUpperCase();
      const searchName = LocData.weapon.shortbow.searchFor[this.lang];
      if (name.includes(shortbowName) || name.includes(longbowName) || name.includes(crossbowName) || edid.includes("longbow") || edid.includes("longbow") || edid.includes("crossbow")) {
        return;
      }
      if (enchanted && (name.includes(longbowName) || edid.includes("longbow"))) {
        return;
      }
      xelib.AddElementValue(weapon, "KWDA\\.", SkyrimForms.kwWeapTypeShortbow);
      if (name.includes(searchName.toLocaleUpperCase())) {
        this.names[weapon] = this.names[weapon].replace(new RegExp(searchName, "i"), shortbowName);
        xelib.AddElementValue(weapon, "FULL", this.names[weapon]);
      }
    }
    checkBroadswordName(weapon, enchanted) {
      if (enchanted && !xelib.HasArrayItem(weapon, "KWDA", "", SkyrimForms.kwWeapTypeSword)) {
        return;
      }
      var broadswordName = LocData.weapon.weapTypes.Broadsword[this.lang];
      if (this.names[weapon].includes(broadswordName)) {
        return;
      }
      this.names[weapon] = this.names[weapon].replace(LocData.weapon.weapTypes.Sword[this.lang], broadswordName);
      xelib.AddElementValue(weapon, "FULL", this.names[weapon]);
    }
    patchWeaponKeywords(weapon) {
      var typeString = getValueFromName(this.rules.typeOverrides, this.names[weapon], "name", "type");
      if (typeString === null)
        typeString = getValueFromName(this.rules.typeOverrides, xelib.EditorID(weapon), "name", "type");
      if (!typeString && xelib.HasArrayItem(weapon, "KWDA", "", SkyrimForms.kwWeapTypeSword)) {
        this.checkBroadswordName(weapon);
      }
      this.skyreTypesMap.some((e) => {
        if (xelib.HasArrayItem(weapon, "KWDA", "", e.kwda))
          return false;
        if (xelib.EditorID(weapon).toLowerCase().includes(e.name.toLowerCase()) || xelib.FullName(weapon).includes(e.name)) {
          xelib.AddArrayItem(weapon, "KWDA", "", e.kwda);
          if (e.kwda === SkyrimForms.kwWeapTypeYari && !xelib.HasScript(weapon, "xxxPassiveYari")) {
            addPerkScript(weapon, "xxxPassiveYari", "xxxPassiveYariEffect", SkyrimForms.perkWeaponYari);
          } else if (e.kwda === SkyrimForms.kwWeapTypeShortspear && !xelib.HasScript(weapon, "xxxPassiveShortspear")) {
            addPerkScript(weapon, "xxxPassiveShortspear", "xxxPassiveShortspearEffect", SkyrimForms.perkWeaponShortspear);
          }
          return true;
        }
      });
      this.patchBowType(weapon);
    }
    getBaseDamage(weapon) {
      var kwda = getKwda(weapon);
      var base;
      if (kwda(SkyrimForms.kwWeapTypeSword) || kwda(SkyrimForms.kwWeapTypeWaraxe) || kwda(SkyrimForms.kwWeapTypeMace) || kwda(SkyrimForms.kwWeapTypeDagger) || kwda(SkyrimForms.kwdaWeapTypeAny1H)) {
        base = this.baseStats.damage.oneHanded;
      }
      if (kwda(SkyrimForms.kwWeapTypeGreatsword) || kwda(SkyrimForms.kwWeapTypeWarhammer) || kwda(SkyrimForms.kwWeapTypeBattleaxe) || kwda(SkyrimForms.kwdaWeapTypeAny1H)) {
        base = this.baseStats.damage.twoHanded;
      }
      if (kwda(SkyrimForms.kwWeapTypeCrossbow)) {
        base = this.baseStats.damage.crossbow;
      }
      if (kwda(SkyrimForms.kwWeapTypeBow)) {
        base = this.baseStats.damage.bow;
      }
      if (base === null) {
        this.log(weapon, "Couldn't set base weapon damage.");
      }
      return base;
    }
    getWeaponMaterialDamageModifier(weapon) {
      var modifier;
      var edid = xelib.EditorID(weapon);
      if (xelib.GetFlag(weapon, "DNAM\\Flags2", "Bound Weapon")) {
        modifier = 0;
      } else {
        modifier = getValueFromName(this.rules.materials, this.names[weapon], "name", "damage");
      }
      if (modifier !== null) {
        return modifier;
      } else {
        modifier = getValueFromName(this.rules.materials, edid, "name", "damage");
      }
      modifier = getModifierFromMap(this.keywordMaterialMap, this.rules.materials, weapon, "name", "damage");
      if (modifier === null) {
        this.log(weapon, "Couldn't find material damage modifier for weapon.");
      }
      return modifier;
    }
    getWeaponTypeDamageModifier(weapon) {
      var modifier = getModifierFromMap(this.keywordTypesMap, this.rules.types, weapon, "name", "damage", false);
      if (modifier === null) {
        this.log(weapon, "Couldn't find type damage modifier for weapon.");
      }
      return modifier;
    }
    getKeywordWeaponDamageModifier(weapon) {
      var kwda = getKwda(weapon);
      var modifier = getValueFromName(this.rules.modifierOverrides, this.names[weapon], "name", "multiplier");
      if (modifier === null)
        modifier = getValueFromName(this.rules.modifierOverrides, xelib.EditorID(weapon), "name", "multiplier");
      if (!modifier) {
        if (kwda(SkyrimForms.weaponStrongerLow)) {
          modifier = this.modifiers.weaponStrongerLow;
        } else if (kwda(SkyrimForms.weaponStrongerMedium)) {
          modifier = this.modifiers.weaponStrongerMedium;
        } else if (kwda(SkyrimForms.weaponStrongerHigh)) {
          modifier = this.modifiers.weaponStrongerHigh;
        } else if (kwda(SkyrimForms.weaponWeakerLow)) {
          modifier = this.modifiers.weaponWeakerLow;
        } else if (kwda(SkyrimForms.weaponWeakerMedium)) {
          modifier = this.modifiers.weaponWeakerMedium;
        } else if (kwda(SkyrimForms.weaponWeakerHigh)) {
          modifier = this.modifiers.weaponWeakerHigh;
        } else {
          modifier = 1;
        }
      }
      return modifier;
    }
    patchWeaponDamage(weapon) {
      var baseDamage = this.getBaseDamage(weapon);
      var materialDamage = this.getWeaponMaterialDamageModifier(weapon);
      var typeDamage = this.getWeaponTypeDamageModifier(weapon);
      var modifier = this.getKeywordWeaponDamageModifier(weapon);
      var damage = (baseDamage + materialDamage + typeDamage) * modifier;
      if (damage < 0) {
        damage = 0;
      }
      if (baseDamage === null || materialDamage === null || typeDamage === null) {
        this.log(weapon, "Base: ".concat(String(baseDamage), " Material: ").concat(String(materialDamage), " Type: ").concat(String(typeDamage)));
      }
      xelib.SetUIntValue(weapon, "DATA\\Damage", damage);
      xelib.SetUIntValue(weapon, "CRDT\\Damage", damage / 2);
    }
    addTemperingRecipe(weapon) {
      var input;
      var perk;
      this.keywordMaterialMap.some((e) => {
        if (!xelib.HasArrayItem(weapon, "KWDA", "", e.kwda)) {
          return false;
        }
        input = e.input;
        perk = e.perk;
        return true;
      });
      if (!input) {
        this.log(weapon, "Couldn't determine material - no tempering recipe generated.");
        return;
      }
      var newRecipe = xelib.AddElement(this.patchFile, "Constructible Object\\COBJ");
      xelib.AddElementValue(newRecipe, "EDID", "REP_TEMPER_".concat(xelib.EditorID(weapon)));
      xelib.AddElement(newRecipe, "Items");
      var ingredient = xelib.GetElement(newRecipe, "Items\\[0]");
      xelib.SetValue(ingredient, "CNTO\\Item", input);
      xelib.SetUIntValue(ingredient, "CNTO\\Count", 1);
      xelib.AddElementValue(newRecipe, "NAM1", "1");
      xelib.AddElementValue(newRecipe, "CNAM", xelib.GetHexFormID(weapon));
      xelib.AddElementValue(newRecipe, "BNAM", SkyrimForms.kwCraftingSmithingSharpeningWheel);
      if (perk) {
        xelib.AddElement(newRecipe, "Conditions");
        var condition = xelib.GetElement(newRecipe, "Conditions\\[0]");
        updateHasPerkCondition(newRecipe, condition, 1e7, 1, perk);
      }
    }
    getWeaponTypeFloatValueModifier(weapon, field2) {
      var modifier = getModifierFromMap(this.skyreTypesMap, this.rules.types, weapon, "name", field2, false);
      if (modifier) {
        return modifier;
      }
      modifier = getValueFromName(this.rules.types, this.names[weapon], "name", field2, false);
      if (modifier === null)
        modifier = getValueFromName(this.rules.types, xelib.EditorID(weapon), "name", field2, false);
      if (modifier) {
        return modifier;
      }
      modifier = getModifierFromMap(this.vanillaTypesMap, this.rules.types, weapon, "name", field2, false);
      if (modifier === null) {
        this.log(weapon, "Couldn't find type ".concat(field2, " modifier for weapon."));
      }
      return modifier === null ? 0 : modifier;
    }
    patchWeaponReach(weapon) {
      var reach = this.getWeaponTypeFloatValueModifier(weapon, "reach");
      xelib.SetFloatValue(weapon, "DNAM\\Reach", reach);
    }
    patchWeaponSpeed(weapon) {
      var speed = this.getWeaponTypeFloatValueModifier(weapon, "speed");
      xelib.SetFloatValue(weapon, "DNAM\\Speed", speed);
    }
    applyRecurveCrossbowChanges(weapon) {
      var baseDamage = this.getBaseDamage(weapon);
      var materialDamage = this.getWeaponMaterialDamageModifier(weapon);
      var typeDamage = this.getWeaponTypeDamageModifier(weapon);
      var recurveDamage = this.baseStats.damageBonuses.recurveCrossbow;
      var modifier = this.getKeywordWeaponDamageModifier(weapon);
      var desc = xelib.GetValue(weapon, "DESC");
      var damage = (baseDamage + materialDamage + typeDamage + recurveDamage) * modifier;
      if (damage < 0) {
        damage = 0;
      }
      if (baseDamage === null || materialDamage === null || typeDamage === null) {
        this.log(weapon, "Base: ".concat(String(baseDamage), " Material: ").concat(String(materialDamage), " Type: ").concat(String(typeDamage)));
      }
      xelib.SetUIntValue(weapon, "DATA\\Damage", damage);
      xelib.AddElementValue(weapon, "DESC", "".concat(desc, LocData.weapon.crossbow.Recurve.desc[this.lang]));
    }
    applyArbalestCrossbowChanges(weapon) {
      var speed = xelib.GetIntValue(weapon, "DNAM\\Speed");
      var weight = xelib.GetIntValue(weapon, "DATA\\Weight");
      var desc = xelib.GetValue(weapon, "DESC");
      xelib.SetFloatValue(weapon, "DNAM\\Speed", speed + this.baseStats.speedBonuses.arbalestCrossbow);
      xelib.SetFloatValue(weapon, "DATA\\Weight", weight * this.baseStats.weightMultipliers.arbalestCrossbow);
      xelib.AddElementValue(weapon, "DESC", "".concat(desc, LocData.weapon.crossbow.Arbalest.desc[this.lang]));
    }
    applyLightweightCrossbowChanges(weapon) {
      var speed = xelib.GetIntValue(weapon, "DNAM\\Speed");
      var weight = xelib.GetIntValue(weapon, "DATA\\Weight");
      var desc = xelib.GetValue(weapon, "DESC");
      xelib.SetFloatValue(weapon, "DNAM\\Speed", speed + this.baseStats.speedBonuses.lightweightCrossbow);
      xelib.SetFloatValue(weapon, "DATA\\Weight", weight * this.baseStats.weightMultipliers.lightweightCrossbow);
      xelib.AddElementValue(weapon, "DESC", "".concat(desc, LocData.weapon.crossbow.Lightweight.desc[this.lang]));
    }
    applySilencedCrossbowChanges(weapon) {
      var desc = xelib.GetValue(weapon, "DESC");
      xelib.AddElementValue(weapon, "DESC", "".concat(desc, LocData.weapon.crossbow.Silenced.desc[this.lang]));
    }
    processCrossbow(weapon) {
      if (!xelib.HasArrayItem(weapon, "KWDA", "", SkyrimForms.kwWeapTypeCrossbow)) {
        return;
      }
      if (xelib.HasScript(weapon, "DLC1EnhancedCrossBowAddPerkScript")) {
        xelib.RemoveScript(weapon, "DLC1EnhancedCrossBowAddPerkScript");
        addPerkScript(weapon, "xxxAddPerkWhileEquipped", "p", SkyrimForms.perkWeaponCrossbow);
        xelib.AddElementValue(weapon, "DESC", LocData.weapon.crossbow.Classic.desc[this.lang]);
        xelib.AddArrayItem(weapon, "KWDA", "", SkyrimForms.kwMagicDisallowEnchanting);
      }
      if (this.rules.excludedCrossbows.find((e) => {
        if (this.names[weapon].includes(e))
          return true;
        else if (xelib.EditorID(weapon).toLowerCase().includes(e.toLowerCase()))
          return true;
        return false;
      })) {
        return;
      }
      var crossbowDesc = LocData.weapon.crossbow.Classic.desc[this.lang];
      var requiredPerks = [];
      var secondaryIngredients = [];
      var recurveName = LocData.weapon.crossbow.Recurve.name[this.lang];
      var newName = "".concat(recurveName, " ", this.names[weapon]);
      var newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
      var newRecurveCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
      this.helpers.cacheRecord(newRecurveCrossbow, newEditorId);
      xelib.AddElementValue(newRecurveCrossbow, "EDID", newEditorId);
      xelib.AddElementValue(newRecurveCrossbow, "FULL", newName);
      xelib.AddElementValue(newRecurveCrossbow, "DESC", crossbowDesc);
      xelib.AddArrayItem(newRecurveCrossbow, "KWDA", "", SkyrimForms.kwDLC1CrossbowIsEnhanced);
      xelib.AddArrayItem(newRecurveCrossbow, "KWDA", "", SkyrimForms.kwMagicDisallowEnchanting);
      this.names[newRecurveCrossbow] = newName;
      this.applyRecurveCrossbowChanges(newRecurveCrossbow);
      addPerkScript(newRecurveCrossbow, "xxxAddPerkWhileEquipped", "p", SkyrimForms.perkWeaponCrossbow);
      this.addTemperingRecipe(newRecurveCrossbow);
      this.addMeltdownRecipe(newRecurveCrossbow);
      requiredPerks.push(SkyrimForms.perkMarksmanshipBallistics);
      requiredPerks.push(SkyrimForms.perkMarksmanshipRecurve);
      secondaryIngredients.push(SkyrimForms.leatherStrips);
      secondaryIngredients.push(SkyrimForms.firewood);
      secondaryIngredients.push(xelib.GetHexFormID(weapon));
      this.addCraftingRecipe(newRecurveCrossbow, requiredPerks, secondaryIngredients);
      requiredPerks = [];
      secondaryIngredients = [];
      var arbalestName = LocData.weapon.crossbow.Arbalest.name[this.lang];
      newName = "".concat(arbalestName, " ", this.names[weapon]);
      newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
      var newArbalestCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
      this.helpers.cacheRecord(newArbalestCrossbow, newEditorId);
      xelib.AddElementValue(newArbalestCrossbow, "EDID", newEditorId);
      xelib.AddElementValue(newArbalestCrossbow, "FULL", newName);
      xelib.AddElementValue(newArbalestCrossbow, "DESC", crossbowDesc);
      xelib.AddArrayItem(newArbalestCrossbow, "KWDA", "", SkyrimForms.kwDLC1CrossbowIsEnhanced);
      xelib.AddArrayItem(newArbalestCrossbow, "KWDA", "", SkyrimForms.kwMagicDisallowEnchanting);
      this.names[newArbalestCrossbow] = newName;
      this.applyArbalestCrossbowChanges(newArbalestCrossbow);
      addPerkScript(newArbalestCrossbow, "xxxAddPerkWhileEquipped", "p", SkyrimForms.perkWeaponCrossbowArbalest);
      this.addTemperingRecipe(newArbalestCrossbow);
      this.addMeltdownRecipe(newArbalestCrossbow);
      requiredPerks.push(SkyrimForms.perkMarksmanshipBallistics);
      requiredPerks.push(SkyrimForms.perkMarksmanshipArbalest);
      secondaryIngredients.push(SkyrimForms.leatherStrips);
      secondaryIngredients.push(SkyrimForms.firewood);
      secondaryIngredients.push(xelib.GetHexFormID(weapon));
      this.addCraftingRecipe(newArbalestCrossbow, requiredPerks, secondaryIngredients);
      requiredPerks = [];
      secondaryIngredients = [];
      var lightweightName = LocData.weapon.crossbow.Lightweight.name[this.lang];
      newName = "".concat(lightweightName, " ", this.names[weapon]);
      newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
      var newLightweightCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
      this.helpers.cacheRecord(newLightweightCrossbow, newEditorId);
      xelib.AddElementValue(newLightweightCrossbow, "EDID", newEditorId);
      xelib.AddElementValue(newLightweightCrossbow, "FULL", newName);
      xelib.AddElementValue(newLightweightCrossbow, "DESC", crossbowDesc);
      xelib.AddArrayItem(newLightweightCrossbow, "KWDA", "", SkyrimForms.kwDLC1CrossbowIsEnhanced);
      xelib.AddArrayItem(newLightweightCrossbow, "KWDA", "", SkyrimForms.kwMagicDisallowEnchanting);
      this.names[newLightweightCrossbow] = newName;
      this.applyLightweightCrossbowChanges(newLightweightCrossbow);
      addPerkScript(newLightweightCrossbow, "xxxAddPerkWhileEquipped", "p", SkyrimForms.perkWeaponCrossbow);
      this.addTemperingRecipe(newLightweightCrossbow);
      this.addMeltdownRecipe(newLightweightCrossbow);
      requiredPerks.push(SkyrimForms.perkMarksmanshipBallistics);
      requiredPerks.push(SkyrimForms.perkMarksmanshipLightweightConstruction);
      secondaryIngredients.push(SkyrimForms.leatherStrips);
      secondaryIngredients.push(SkyrimForms.firewood);
      secondaryIngredients.push(xelib.GetHexFormID(weapon));
      this.addCraftingRecipe(newLightweightCrossbow, requiredPerks, secondaryIngredients);
      requiredPerks = [];
      secondaryIngredients = [];
      var silencedName = LocData.weapon.crossbow.Silenced.name[this.lang];
      newName = "".concat(silencedName, " ", this.names[weapon]);
      newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
      var newSilencedCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
      this.helpers.cacheRecord(newSilencedCrossbow, newEditorId);
      xelib.AddElementValue(newSilencedCrossbow, "EDID", newEditorId);
      xelib.AddElementValue(newSilencedCrossbow, "FULL", newName);
      xelib.AddElementValue(newSilencedCrossbow, "DESC", crossbowDesc);
      xelib.AddArrayItem(newSilencedCrossbow, "KWDA", "", SkyrimForms.kwDLC1CrossbowIsEnhanced);
      xelib.AddArrayItem(newSilencedCrossbow, "KWDA", "", SkyrimForms.kwMagicDisallowEnchanting);
      this.names[newSilencedCrossbow] = newName;
      this.applySilencedCrossbowChanges(newSilencedCrossbow);
      addPerkScript(newSilencedCrossbow, "xxxAddPerkWhileEquipped", "p", SkyrimForms.perkWeaponCrossbowSilenced);
      this.addTemperingRecipe(newSilencedCrossbow);
      this.addMeltdownRecipe(newSilencedCrossbow);
      requiredPerks.push(SkyrimForms.perkMarksmanshipBallistics);
      requiredPerks.push(SkyrimForms.perkMarksmanshipSilencer);
      secondaryIngredients.push(SkyrimForms.leatherStrips);
      secondaryIngredients.push(SkyrimForms.firewood);
      secondaryIngredients.push(xelib.GetHexFormID(weapon));
      this.addCraftingRecipe(newSilencedCrossbow, requiredPerks, secondaryIngredients);
      requiredPerks = [];
      secondaryIngredients = [];
      newName = "".concat(recurveName, " ", arbalestName.toLowerCase(), " ", this.names[weapon]);
      newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
      var newRecurveArbalestCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
      this.helpers.cacheRecord(newRecurveArbalestCrossbow, newEditorId);
      xelib.AddElementValue(newRecurveArbalestCrossbow, "EDID", newEditorId);
      xelib.AddElementValue(newRecurveArbalestCrossbow, "FULL", newName);
      xelib.AddElementValue(newRecurveArbalestCrossbow, "DESC", crossbowDesc);
      xelib.AddArrayItem(newRecurveArbalestCrossbow, "KWDA", "", SkyrimForms.kwDLC1CrossbowIsEnhanced);
      xelib.AddArrayItem(newRecurveArbalestCrossbow, "KWDA", "", SkyrimForms.kwMagicDisallowEnchanting);
      this.names[newRecurveArbalestCrossbow] = newName;
      this.applyRecurveCrossbowChanges(newRecurveArbalestCrossbow);
      this.applyArbalestCrossbowChanges(newRecurveArbalestCrossbow);
      addPerkScript(newRecurveArbalestCrossbow, "xxxAddPerkWhileEquipped", "p", SkyrimForms.perkWeaponCrossbowArbalest);
      this.addTemperingRecipe(newRecurveArbalestCrossbow);
      this.addMeltdownRecipe(newRecurveArbalestCrossbow);
      requiredPerks.push(SkyrimForms.perkMarksmanshipBallistics);
      requiredPerks.push(SkyrimForms.perkMarksmanshipRecurve);
      requiredPerks.push(SkyrimForms.perkMarksmanshipArbalest);
      requiredPerks.push(SkyrimForms.perkMarksmanshipEngineer);
      secondaryIngredients.push(SkyrimForms.leatherStrips);
      secondaryIngredients.push(SkyrimForms.firewood);
      secondaryIngredients.push(xelib.GetHexFormID(weapon));
      this.addCraftingRecipe(newRecurveArbalestCrossbow, requiredPerks, secondaryIngredients);
      requiredPerks = [];
      secondaryIngredients = [];
      newName = "".concat(recurveName, " ", lightweightName.toLowerCase(), " ", this.names[weapon]);
      newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
      var newRecurveLightweightCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
      this.helpers.cacheRecord(newRecurveLightweightCrossbow, newEditorId);
      xelib.AddElementValue(newRecurveLightweightCrossbow, "EDID", newEditorId);
      xelib.AddElementValue(newRecurveLightweightCrossbow, "FULL", newName);
      xelib.AddElementValue(newRecurveLightweightCrossbow, "DESC", crossbowDesc);
      xelib.AddArrayItem(newRecurveLightweightCrossbow, "KWDA", "", SkyrimForms.kwDLC1CrossbowIsEnhanced);
      xelib.AddArrayItem(newRecurveLightweightCrossbow, "KWDA", "", SkyrimForms.kwMagicDisallowEnchanting);
      this.names[newRecurveLightweightCrossbow] = newName;
      this.applyRecurveCrossbowChanges(newRecurveLightweightCrossbow);
      this.applyLightweightCrossbowChanges(newRecurveLightweightCrossbow);
      addPerkScript(newRecurveLightweightCrossbow, "xxxAddPerkWhileEquipped", "p", SkyrimForms.perkWeaponCrossbowArbalest);
      this.addTemperingRecipe(newRecurveLightweightCrossbow);
      this.addMeltdownRecipe(newRecurveLightweightCrossbow);
      requiredPerks.push(SkyrimForms.perkMarksmanshipBallistics);
      requiredPerks.push(SkyrimForms.perkMarksmanshipRecurve);
      requiredPerks.push(SkyrimForms.perkMarksmanshipLightweightConstruction);
      requiredPerks.push(SkyrimForms.perkMarksmanshipEngineer);
      secondaryIngredients.push(SkyrimForms.leatherStrips);
      secondaryIngredients.push(SkyrimForms.firewood);
      secondaryIngredients.push(xelib.GetHexFormID(weapon));
      this.addCraftingRecipe(newRecurveLightweightCrossbow, requiredPerks, secondaryIngredients);
      requiredPerks = [];
      secondaryIngredients = [];
      newName = "".concat(recurveName, " ", silencedName, " ", this.names[weapon]);
      newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
      var newRecurveSilencedCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
      this.helpers.cacheRecord(newRecurveSilencedCrossbow, newEditorId);
      xelib.AddElementValue(newRecurveSilencedCrossbow, "EDID", newEditorId);
      xelib.AddElementValue(newRecurveSilencedCrossbow, "FULL", newName);
      xelib.AddElementValue(newRecurveSilencedCrossbow, "DESC", crossbowDesc);
      xelib.AddArrayItem(newRecurveSilencedCrossbow, "KWDA", "", SkyrimForms.kwDLC1CrossbowIsEnhanced);
      xelib.AddArrayItem(newRecurveSilencedCrossbow, "KWDA", "", SkyrimForms.kwMagicDisallowEnchanting);
      this.names[newRecurveSilencedCrossbow] = newName;
      this.applyRecurveCrossbowChanges(newRecurveSilencedCrossbow);
      this.applySilencedCrossbowChanges(newRecurveSilencedCrossbow);
      addPerkScript(newRecurveSilencedCrossbow, "xxxAddPerkWhileEquipped", "p", SkyrimForms.perkWeaponCrossbowSilenced);
      this.addTemperingRecipe(newRecurveSilencedCrossbow);
      this.addMeltdownRecipe(newRecurveSilencedCrossbow);
      requiredPerks.push(SkyrimForms.perkMarksmanshipBallistics);
      requiredPerks.push(SkyrimForms.perkMarksmanshipRecurve);
      requiredPerks.push(SkyrimForms.perkMarksmanshipSilencer);
      requiredPerks.push(SkyrimForms.perkMarksmanshipEngineer);
      secondaryIngredients.push(SkyrimForms.leatherStrips);
      secondaryIngredients.push(SkyrimForms.firewood);
      secondaryIngredients.push(xelib.GetHexFormID(weapon));
      this.addCraftingRecipe(newRecurveSilencedCrossbow, requiredPerks, secondaryIngredients);
      requiredPerks = [];
      secondaryIngredients = [];
      newName = "".concat(lightweightName, " ", arbalestName.toLowerCase(), " ", this.names[weapon]);
      newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
      var newLightweightArbalestCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
      this.helpers.cacheRecord(newLightweightArbalestCrossbow, newEditorId);
      xelib.AddElementValue(newLightweightArbalestCrossbow, "EDID", newEditorId);
      xelib.AddElementValue(newLightweightArbalestCrossbow, "FULL", newName);
      xelib.AddElementValue(newLightweightArbalestCrossbow, "DESC", crossbowDesc);
      xelib.AddArrayItem(newLightweightArbalestCrossbow, "KWDA", "", SkyrimForms.kwDLC1CrossbowIsEnhanced);
      xelib.AddArrayItem(newLightweightArbalestCrossbow, "KWDA", "", SkyrimForms.kwMagicDisallowEnchanting);
      this.names[newLightweightArbalestCrossbow] = newName;
      this.applyArbalestCrossbowChanges(newLightweightArbalestCrossbow);
      this.applyLightweightCrossbowChanges(newLightweightArbalestCrossbow);
      addPerkScript(newLightweightArbalestCrossbow, "xxxAddPerkWhileEquipped", "p", SkyrimForms.perkWeaponCrossbowArbalest);
      this.addTemperingRecipe(newLightweightArbalestCrossbow);
      this.addMeltdownRecipe(newLightweightArbalestCrossbow);
      requiredPerks.push(SkyrimForms.perkMarksmanshipBallistics);
      requiredPerks.push(SkyrimForms.perkMarksmanshipLightweightConstruction);
      requiredPerks.push(SkyrimForms.perkMarksmanshipArbalest);
      requiredPerks.push(SkyrimForms.perkMarksmanshipEngineer);
      secondaryIngredients.push(SkyrimForms.leatherStrips);
      secondaryIngredients.push(SkyrimForms.firewood);
      secondaryIngredients.push(xelib.GetHexFormID(weapon));
      this.addCraftingRecipe(newLightweightArbalestCrossbow, requiredPerks, secondaryIngredients);
      requiredPerks = [];
      secondaryIngredients = [];
      newName = "".concat(silencedName, " ", arbalestName, " ", this.names[weapon]);
      newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
      var newSilencedArbalestCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
      this.helpers.cacheRecord(newSilencedArbalestCrossbow, newEditorId);
      xelib.AddElementValue(newSilencedArbalestCrossbow, "EDID", newEditorId);
      xelib.AddElementValue(newSilencedArbalestCrossbow, "FULL", newName);
      xelib.AddElementValue(newSilencedArbalestCrossbow, "DESC", crossbowDesc);
      xelib.AddArrayItem(newSilencedArbalestCrossbow, "KWDA", "", SkyrimForms.kwDLC1CrossbowIsEnhanced);
      xelib.AddArrayItem(newSilencedArbalestCrossbow, "KWDA", "", SkyrimForms.kwMagicDisallowEnchanting);
      this.names[newSilencedArbalestCrossbow] = newName;
      this.applyArbalestCrossbowChanges(newSilencedArbalestCrossbow);
      this.applySilencedCrossbowChanges(newSilencedArbalestCrossbow);
      addPerkScript(newSilencedArbalestCrossbow, "xxxAddPerkWhileEquipped", "p", SkyrimForms.perkWeaponCrossbowArbalestSilenced);
      this.addTemperingRecipe(newSilencedArbalestCrossbow);
      this.addMeltdownRecipe(newSilencedArbalestCrossbow);
      requiredPerks.push(SkyrimForms.perkMarksmanshipBallistics);
      requiredPerks.push(SkyrimForms.perkMarksmanshipSilencer);
      requiredPerks.push(SkyrimForms.perkMarksmanshipArbalest);
      requiredPerks.push(SkyrimForms.perkMarksmanshipEngineer);
      secondaryIngredients.push(SkyrimForms.leatherStrips);
      secondaryIngredients.push(SkyrimForms.firewood);
      secondaryIngredients.push(xelib.GetHexFormID(weapon));
      this.addCraftingRecipe(newSilencedArbalestCrossbow, requiredPerks, secondaryIngredients);
      requiredPerks = [];
      secondaryIngredients = [];
      newName = "".concat(lightweightName, " ", silencedName, " ", this.names[weapon]);
      newEditorId = this.newEditorId("REP_WEAPON_".concat(xelib.EditorID(weapon)));
      var newLightweightSilencedCrossbow = xelib.CopyElement(weapon, this.patchFile, true);
      this.helpers.cacheRecord(newLightweightSilencedCrossbow, newEditorId);
      xelib.AddElementValue(newLightweightSilencedCrossbow, "EDID", newEditorId);
      xelib.AddElementValue(newLightweightSilencedCrossbow, "FULL", newName);
      xelib.AddElementValue(newLightweightSilencedCrossbow, "DESC", crossbowDesc);
      xelib.AddArrayItem(newLightweightSilencedCrossbow, "KWDA", "", SkyrimForms.kwDLC1CrossbowIsEnhanced);
      xelib.AddArrayItem(newLightweightSilencedCrossbow, "KWDA", "", SkyrimForms.kwMagicDisallowEnchanting);
      this.names[newLightweightSilencedCrossbow] = newName;
      this.applyLightweightCrossbowChanges(newLightweightSilencedCrossbow);
      this.applySilencedCrossbowChanges(newLightweightSilencedCrossbow);
      addPerkScript(newLightweightSilencedCrossbow, "xxxAddPerkWhileEquipped", "p", SkyrimForms.perkWeaponCrossbowSilenced);
      this.addTemperingRecipe(newLightweightSilencedCrossbow);
      this.addMeltdownRecipe(newLightweightSilencedCrossbow);
      requiredPerks.push(SkyrimForms.perkMarksmanshipBallistics);
      requiredPerks.push(SkyrimForms.perkMarksmanshipLightweightConstruction);
      requiredPerks.push(SkyrimForms.perkMarksmanshipSilencer);
      requiredPerks.push(SkyrimForms.perkMarksmanshipEngineer);
      secondaryIngredients.push(SkyrimForms.leatherStrips);
      secondaryIngredients.push(SkyrimForms.firewood);
      secondaryIngredients.push(xelib.GetHexFormID(weapon));
      this.addCraftingRecipe(newLightweightSilencedCrossbow, requiredPerks, secondaryIngredients);
      requiredPerks = [];
      secondaryIngredients = [];
    }
    temperingPerkFromKeyword(weapon) {
      var kwda = getKwda(weapon);
      var perk;
      this.keywordMaterialMap.some((e) => {
        if (!xelib.HasArrayItem(weapon, "KWDA", "", e.kwda)) {
          return false;
        }
        perk = e.perk;
        return true;
      });
      if (!perk && !kwda(SkyrimForms.kwWeapMaterialIron) && !kwda(SkyrimForms.kwWAF_TreatAsMaterialIron) && !kwda(SkyrimForms.kwWeapMaterialWood) && !kwda(SkyrimForms.kwWAF_WeapMaterialForsworn)) {
        this.log(weapon, "Couldn't determine material - tempering recipe not modified.");
      }
      return perk;
    }
    modifyTemperingRecipe(weapon, weaponFormID, excluded, recipe) {
      var bnam = recipe.bnam;
      var cnamv = recipe.cnamv;
      var bench = parseInt(SkyrimForms.kwCraftingSmithingSharpeningWheel, 16);
      var isRefers = cnamv.includes(weaponFormID);
      if (bnam !== bench || !isRefers || excluded) {
        return;
      }
      var perk = this.temperingPerkFromKeyword(weapon);
      if (!perk) {
        return;
      }
      var newRecipe = xelib.CopyElement(recipe.handle, this.patchFile);
      var condition = removeTemperingConditions(newRecipe, this.keywordMaterialMap, perk);
      var newCond;
      if (!condition && !xelib.HasArrayItem(newRecipe, "Conditions", "CTDA\\Parameter #1", perk)) {
        newCond = xelib.AddArrayItem(newRecipe, "Conditions", "", "");
        updateHasPerkCondition(newRecipe, newCond, 1e7, 1, perk);
        xelib.MoveArrayItem(newCond, 0);
      }
      if (!xelib.HasArrayItem(newRecipe, "Conditions", "CTDA\\Function", "EPTemperingItemIsEnchanted") && !xelib.HasArrayItem(newRecipe, "Conditions", "CTDA\\Parameter #1", SkyrimForms.perkSmithingArcaneBlacksmith)) {
        newCond = xelib.AddArrayItem(newRecipe, "Conditions", "", "");
        updateHasPerkCondition(newRecipe, newCond, "00010000", 1, "", "EPTemperingItemIsEnchanted");
        newCond = xelib.AddArrayItem(newRecipe, "Conditions", "", "");
        updateHasPerkCondition(newRecipe, newCond, 1e7, 1, SkyrimForms.perkSmithingArcaneBlacksmith);
      }
    }
    modifyCrossbowCraftingRecipe(weapon, weaponFormID, weaponIsCrossbow, excluded, recipe) {
      var cnamv = recipe.cnamv;
      var isRefers = cnamv.includes(weaponFormID);
      if (!weaponIsCrossbow || excluded || !isRefers) {
        return;
      }
      var bench = parseInt(SkyrimForms.kwCraftingSmithingSharpeningWheel, 16);
      var newRecipe = xelib.CopyElement(recipe.handle, this.patchFile);
      if (recipe.bnam !== bench) {
        xelib.AddElementValue(newRecipe, "BNAM", SkyrimForms.kwCraftingSmithingForge);
      }
      var perk = this.temperingPerkFromKeyword(weapon);
      if (!perk) {
        return;
      }
      xelib.RemoveElement(newRecipe, "Conditions");
      var condition = xelib.AddArrayItem(newRecipe, "Conditions", "", "");
      updateHasPerkCondition(newRecipe, condition, 1e7, 1, perk);
      condition = xelib.AddArrayItem(newRecipe, "Conditions", "", "");
      updateHasPerkCondition(newRecipe, condition, 1e7, 1, SkyrimForms.perkMarksmanshipBallistics);
    }
    modifyRecipes(weapon) {
      var name = this.names[weapon];
      var edid = xelib.EditorID(weapon);
      var weaponFormID = xelib.GetHexFormID(weapon);
      var weaponIsCrossbow = xelib.HasArrayItem(weapon, "KWDA", "", SkyrimForms.kwWeapTypeCrossbow);
      var excluded = this.rules.excludedFromRecipes.find((e) => {
        if (e.edid && e.edid !== null)
          return edid.includes(e.edid);
        else
          return name.includes(e.name);
      });
      this.cobj.forEach((recipe) => {
        this.modifyCrossbowCraftingRecipe(weapon, weaponFormID, weaponIsCrossbow, excluded, recipe);
        this.modifyTemperingRecipe(weapon, weaponFormID, excluded, recipe);
      });
    }
    processSilverWeapon(weapon) {
      if (!xelib.HasArrayItem(weapon, "KWDA", "", SkyrimForms.kwWeapMaterialSilver) || xelib.HasArrayItem(weapon, "KWDA", "", SkyrimForms.kwWeapTypeBow)) {
        return;
      }
      var newName = "".concat(this.names[weapon], " - ", LocData.weapon.silverRefined.name[this.lang]);
      var newEditorId = this.newEditorId("REP_WEAPON_REFINED_".concat(xelib.EditorID(weapon)));
      var desc = LocData.weapon.silverRefined.desc[this.lang];
      var newRefinedSilverWeapon = xelib.CopyElement(weapon, this.patchFile, true);
      this.helpers.cacheRecord(newRefinedSilverWeapon, newEditorId);
      xelib.AddElementValue(newRefinedSilverWeapon, "EDID", newEditorId);
      xelib.AddElementValue(newRefinedSilverWeapon, "FULL", newName);
      this.names[newRefinedSilverWeapon] = newName;
      xelib.AddElementValue(newRefinedSilverWeapon, "DESC", desc);
      xelib.AddElementValue(newRefinedSilverWeapon, "KWDA\\.", SkyrimForms.kwWeapMaterialSilverRefined);
      this.patchWeaponDamage(newRefinedSilverWeapon);
      this.patchWeaponReach(newRefinedSilverWeapon);
      this.patchWeaponSpeed(newRefinedSilverWeapon);
      var vmad;
      if (!xelib.HasElement(newRefinedSilverWeapon, "VMAD")) {
        vmad = xelib.AddElement(weapon, "VMAD");
        xelib.SetIntValue(vmad, "Version", 5);
        xelib.SetIntValue(vmad, "Object Format", 2);
      } else {
        vmad = xelib.GetElement(newRefinedSilverWeapon, "VMAD");
      }
      if (xelib.HasScript(newRefinedSilverWeapon, "SilverSwordScript")) {
        xelib.RemoveScript(newRefinedSilverWeapon, "SilverSwordScript");
      }
      var script = xelib.AddElement(vmad, "Scripts\\.");
      xelib.SetValue(script, "scriptName", "SilverSwordScript");
      var property = xelib.AddElement(script, "Properties\\.");
      xelib.SetValue(property, "propertyName", "SilverPerk");
      xelib.SetValue(property, "Type", "Object");
      xelib.SetValue(property, "Flags", "Edited");
      xelib.SetValue(property, "Value\\Object Union\\Object v2\\FormID", SkyrimForms.perkWeaponSilverRefined);
      xelib.SetValue(property, "Value\\Object Union\\Object v2\\Alias", "None");
      this.addTemperingRecipe(newRefinedSilverWeapon);
      var ingredients = [SkyrimForms.ingotGold, SkyrimForms.ingotQuicksilver, xelib.GetHexFormID(weapon)];
      this.addCraftingRecipe(newRefinedSilverWeapon, [SkyrimForms.perkSmithingSilverRefined], ingredients);
      this.addMeltdownRecipe(newRefinedSilverWeapon);
    }
    addMeltdownRecipe(weapon) {
      var kwda = getKwda(weapon);
      var outputQuantity = 1;
      var inputQuantity = 1;
      var input;
      var perk;
      var name = this.names[weapon];
      var edid = xelib.EditorID(weapon);
      var excluded = this.rules.excludedFromRecipes.find((e) => {
        if (e.edid && e.edid !== null)
          return edid.includes(e.edid);
        else
          return name.includes(e.name);
      });
      if (xelib.HasElement(weapon, "EITM"))
        return;
      if (xelib.HasArrayItem(weapon, "KWDA", "", SkyrimForms.excludeFromMeltdownRecipes) || xelib.GetFlag(weapon, "DNAM\\Flags2", "Bound Weapon") || excluded) {
        return;
      }
      if (kwda(SkyrimForms.kwWeapTypeBattleaxe) || kwda(SkyrimForms.kwWeapTypeGreatsword) || kwda(SkyrimForms.kwWeapTypeWarhammer) || kwda(SkyrimForms.kwWeapTypeBow)) {
        outputQuantity += 1;
      } else if (kwda(SkyrimForms.kwWeapTypeDagger)) {
        inputQuantity += 1;
      }
      this.keywordMaterialMap.some((e) => {
        if (!xelib.HasArrayItem(weapon, "KWDA", "", e.kwda)) {
          return false;
        }
        input = e.input;
        perk = e.perk;
        return true;
      });
      if (kwda(SkyrimForms.kwWeapMaterialDaedric)) {
        outputQuantity += 1;
      } else if (kwda(SkyrimForms.kwWeapMaterialDraugr) || kwda(SkyrimForms.kwWeapMaterialDraugrHoned)) {
        inputQuantity += 1;
      }
      if (!input) {
        var nName = this.names[weapon];
        var edEdit = xelib.EditorID(weapon).toUpperCase();
        var isInIgnore = this.rules.ignoreLog.find((elem) => {
          if (elem.edid && elem.edid !== null)
            return edEdit.includes(elem.edid.toUpperCase());
          else
            return nName.includes(elem.name);
        });
        if (!isInIgnore) {
          this.log(weapon, "Couldn't determine material - no meltdown recipe generated.");
        }
        return;
      }
      var newRecipe = xelib.AddElement(this.patchFile, "Constructible Object\\COBJ");
      xelib.AddElementValue(newRecipe, "EDID", "REP_MELTDOWN_".concat(xelib.EditorID(weapon)));
      xelib.AddElement(newRecipe, "Items");
      var ingredient = xelib.GetElement(newRecipe, "Items\\[0]");
      xelib.SetValue(ingredient, "CNTO\\Item", xelib.GetHexFormID(weapon));
      xelib.SetUIntValue(ingredient, "CNTO\\Count", inputQuantity);
      xelib.AddElementValue(newRecipe, "NAM1", "".concat(String(outputQuantity)));
      xelib.AddElementValue(newRecipe, "CNAM", input);
      xelib.AddElementValue(newRecipe, "BNAM", SkyrimForms.kwCraftingSmelter);
      xelib.AddElement(newRecipe, "Conditions");
      var condition = xelib.GetElement(newRecipe, "Conditions\\[0]");
      updateHasPerkCondition(newRecipe, condition, 1e7, 1, SkyrimForms.perkSmithingMeltdown);
      if (perk) {
        createHasPerkCondition(newRecipe, 1e7, 1, perk);
      }
      createGetItemCountCondition(newRecipe, 11e6, 1, weapon);
      createGetEquippedCondition(newRecipe, 1e7, 0, weapon);
    }
    addCraftingRecipe(weapon, requiredPerks, secondaryIngredients) {
      var input;
      var perk;
      this.keywordMaterialMap.some((e) => {
        if (!xelib.HasArrayItem(weapon, "KWDA", "", e.kwda)) {
          return false;
        }
        input = e.input;
        perk = e.perk;
        return true;
      });
      if (!input) {
        return;
      }
      var newRecipe = xelib.AddElement(this.patchFile, "Constructible Object\\COBJ");
      xelib.AddElementValue(newRecipe, "EDID", "REP_CRAFT_WEAPON_".concat(xelib.EditorID(weapon)));
      xelib.AddElement(newRecipe, "Items");
      var baseItem = xelib.GetElement(newRecipe, "Items\\[0]");
      xelib.SetValue(baseItem, "CNTO\\Item", input);
      xelib.SetUIntValue(baseItem, "CNTO\\Count", 2);
      secondaryIngredients.forEach((ingredient) => {
        var secondaryItem = xelib.AddElement(newRecipe, "Items\\.");
        xelib.SetValue(secondaryItem, "CNTO\\Item", ingredient);
        xelib.SetUIntValue(secondaryItem, "CNTO\\Count", 1);
      });
      xelib.AddElementValue(newRecipe, "BNAM", SkyrimForms.kwCraftingSmithingForge);
      xelib.AddElementValue(newRecipe, "NAM1", "1");
      xelib.AddElementValue(newRecipe, "CNAM", xelib.GetHexFormID(weapon));
      xelib.AddElement(newRecipe, "Conditions");
      requiredPerks.forEach((p, index) => {
        var condition;
        if (index === 0) {
          condition = xelib.GetElement(newRecipe, "Conditions\\[0]");
        } else {
          condition = xelib.AddElement(newRecipe, "Conditions\\.");
        }
        updateHasPerkCondition(newRecipe, condition, 1e7, 1, p);
      });
      if (perk) {
        createHasPerkCondition(newRecipe, 1e7, 1, perk);
      }
    }
    patchBoundWeapon(weapon) {
      var kwda = getKwda(weapon);
      if (xelib.GetFlag(weapon, "DNAM\\Flags2", "Bound Weapon") && !kwda(SkyrimForms.kwWeapTypeBoundWeapon)) {
        xelib.AddElementValue(weapon, "KWDA\\.", SkyrimForms.kwWeapTypeBoundWeapon);
      }
    }
    patchWeaponType(weapon) {
      const weapTypeIndex = findKeyword(weapon, "WeapType");
      var weapType;
      if (xelib.GetValue(weapon, Records.DataSkill).toUpperCase().includes("ONE"))
        weapType = SkyrimForms.kwdaWeapTypeAny1H;
      else
        weapType = SkyrimForms.kwdaWeapTypeAny2H;
      if (weapTypeIndex !== null) {
        xelib.RemoveElement(weapon, weapTypeIndex);
        xelib.AddArrayItem(weapon, Records.Keywords, "", weapType);
      }
    }
    patchFunc(weapon) {
      this.names[weapon] = xelib.FullName(weapon) || "";
      if (xelib.HasElement(weapon, "CNAM")) {
        this.checkBroadswordName(weapon, true);
        this.patchBowType(weapon, true);
        return;
      }
      this.checkOverrides(weapon);
      this.patchWeaponKeywords(weapon);
      this.patchWeaponDamage(weapon);
      this.patchWeaponReach(weapon);
      this.patchWeaponSpeed(weapon);
      this.processCrossbow(weapon);
      this.processSilverWeapon(weapon);
      this.addMeltdownRecipe(weapon);
      this.modifyRecipes(weapon);
      this.patchBoundWeapon(weapon);
    }
    createKeywordMaps() {
      this.skyreTypesMap = [{
        kwda: SkyrimForms.kwWeapTypeBastardSword,
        name: "Bastard"
      }, {
        kwda: SkyrimForms.kwWeapTypeBattlestaff,
        name: "Battlestaff"
      }, {
        kwda: SkyrimForms.kwWeapTypeBroadsword,
        name: "Broadsword"
      }, {
        kwda: SkyrimForms.kwWeapTypeClub,
        name: "Club"
      }, {
        kwda: SkyrimForms.kwWeapTypeCrossbow,
        name: "Crossbow"
      }, {
        kwda: SkyrimForms.kwWeapTypeGlaive,
        name: "Glaive"
      }, {
        kwda: SkyrimForms.kwWeapTypeHalberd,
        name: "Halberd"
      }, {
        kwda: SkyrimForms.kwWeapTypeHatchet,
        name: "Hatchet"
      }, {
        kwda: SkyrimForms.kwWeapTypeKatana,
        name: "Katana"
      }, {
        kwda: SkyrimForms.kwWeapTypeLongbow,
        name: "Longbow"
      }, {
        kwda: SkyrimForms.kwWeapTypeLongmace,
        name: "Longmace"
      }, {
        kwda: SkyrimForms.kwWeapTypeLongsword,
        name: "Longsword"
      }, {
        kwda: SkyrimForms.kwWeapTypeMaul,
        name: "Maul"
      }, {
        kwda: SkyrimForms.kwWeapTypeNodachi,
        name: "Nodachi"
      }, {
        kwda: SkyrimForms.kwWeapTypeSaber,
        name: "Saber"
      }, {
        kwda: SkyrimForms.kwWeapTypeScimitar,
        name: "Scimitar"
      }, {
        kwda: SkyrimForms.kwWeapTypeShortbow,
        name: "Shortbow"
      }, {
        kwda: SkyrimForms.kwWeapTypeShortspear,
        name: "Shortspear"
      }, {
        kwda: SkyrimForms.kwWeapTypeShortsword,
        name: "Shortsword"
      }, {
        kwda: SkyrimForms.kwWeapTypeTanto,
        name: "Tanto"
      }, {
        kwda: SkyrimForms.kwWeapTypeUnarmed,
        name: "Unarmed"
      }, {
        kwda: SkyrimForms.kwWeapTypeWakizashi,
        name: "Wakizashi"
      }, {
        kwda: SkyrimForms.kwWeapTypeYari,
        name: "Yari"
      }];
      this.vanillaTypesMap = [{
        kwda: SkyrimForms.kwWeapTypeBattleaxe,
        name: "Battleaxe"
      }, {
        kwda: SkyrimForms.kwWeapTypeBow,
        name: "Bow"
      }, {
        kwda: SkyrimForms.kwWeapTypeSword,
        name: "Broadsword"
      }, {
        kwda: SkyrimForms.kwWeapTypeDagger,
        name: "Dagger"
      }, {
        kwda: SkyrimForms.kwWeapTypeGreatsword,
        name: "Greatsword"
      }, {
        kwda: SkyrimForms.kwWeapTypeMace,
        name: "Mace"
      }, {
        kwda: SkyrimForms.kwWeapTypeWaraxe,
        name: "Waraxe"
      }, {
        kwda: SkyrimForms.kwWeapTypeWarhammer,
        name: "Warhammer"
      }];
      this.keywordTypesMap = this.skyreTypesMap.concat(this.vanillaTypesMap);
      this.keywordMaterialMap = [{
        name: "Dawnguard",
        kwda: SkyrimForms.kwWAF_DLC1WeapMaterialDawnguard,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingSteel
      }, {
        name: "Daedric",
        kwda: SkyrimForms.kwWAF_TreatAsMaterialDaedric,
        input: SkyrimForms.ingotEbony,
        perk: SkyrimForms.perkSmithingDaedric
      }, {
        name: "Dragonbone",
        kwda: SkyrimForms.kwWAF_TreatAsMaterialDragon,
        input: SkyrimForms.dragonbone,
        perk: SkyrimForms.perkSmithingDragon
      }, {
        name: "Dwarven",
        kwda: SkyrimForms.kwWAF_TreatAsMaterialDwarven,
        input: SkyrimForms.ingotDwarven,
        perk: SkyrimForms.perkSmithingDwarven
      }, {
        name: "Ebony",
        kwda: SkyrimForms.kwWAF_TreatAsMaterialEbony,
        input: SkyrimForms.ingotEbony,
        perk: SkyrimForms.perkSmithingEbony
      }, {
        name: "Elven",
        kwda: SkyrimForms.kwWAF_TreatAsMaterialElven,
        input: SkyrimForms.ingotMoonstone,
        perk: SkyrimForms.perkSmithingElven
      }, {
        name: "Glass",
        kwda: SkyrimForms.kwWAF_TreatAsMaterialGlass,
        input: SkyrimForms.ingotMalachite,
        perk: SkyrimForms.perkSmithingGlass
      }, {
        name: "Iron",
        kwda: SkyrimForms.kwWAF_TreatAsMaterialIron,
        input: SkyrimForms.ingotIron
      }, {
        name: "Orcish",
        kwda: SkyrimForms.kwWAF_TreatAsMaterialOrcish,
        input: SkyrimForms.ingotOrichalcum,
        perk: SkyrimForms.perkSmithingOrcish
      }, {
        name: "Steel",
        kwda: SkyrimForms.kwWAF_TreatAsMaterialSteel,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingSteel
      }, {
        name: "Blades",
        kwda: SkyrimForms.kwWAF_WeapMaterialBlades,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingSteel
      }, {
        name: "Forsworn",
        kwda: SkyrimForms.kwWAF_WeapMaterialForsworn,
        input: SkyrimForms.charcoal
      }, {
        name: "Daedric",
        kwda: SkyrimForms.kwWeapMaterialDaedric,
        input: SkyrimForms.ingotEbony,
        perk: SkyrimForms.perkSmithingDaedric
      }, {
        name: "Dragonbone",
        kwda: SkyrimForms.kwWeapMaterialDragonbone,
        input: SkyrimForms.dragonbone,
        perk: SkyrimForms.perkSmithingDragon
      }, {
        name: "Draugr",
        kwda: SkyrimForms.kwWeapMaterialDraugr,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingAdvanced
      }, {
        name: "Draugr Honed",
        kwda: SkyrimForms.kwWeapMaterialDraugrHoned,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingAdvanced
      }, {
        name: "Dwarven",
        kwda: SkyrimForms.kwWeapMaterialDwarven,
        input: SkyrimForms.ingotDwarven,
        perk: SkyrimForms.perkSmithingDwarven
      }, {
        name: "Ebony",
        kwda: SkyrimForms.kwWeapMaterialEbony,
        input: SkyrimForms.ingotEbony,
        perk: SkyrimForms.perkSmithingEbony
      }, {
        name: "Elven",
        kwda: SkyrimForms.kwWeapMaterialElven,
        input: SkyrimForms.ingotMoonstone,
        perk: SkyrimForms.perkSmithingElven
      }, {
        name: "Falmer",
        kwda: SkyrimForms.kwWeapMaterialFalmer,
        input: SkyrimForms.chaurusChitin,
        perk: SkyrimForms.perkSmithingElven
      }, {
        name: "Falmer Honed",
        kwda: SkyrimForms.kwWeapMaterialFalmerHoned,
        input: SkyrimForms.chaurusChitin,
        perk: SkyrimForms.perkSmithingElven
      }, {
        name: "Glass",
        kwda: SkyrimForms.kwWeapMaterialGlass,
        input: SkyrimForms.ingotMalachite,
        perk: SkyrimForms.perkSmithingGlass
      }, {
        name: "Imperial",
        kwda: SkyrimForms.kwWeapMaterialImperial,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingSteel
      }, {
        name: "Iron",
        kwda: SkyrimForms.kwWeapMaterialIron,
        input: SkyrimForms.ingotIron
      }, {
        name: "Orcish",
        kwda: SkyrimForms.kwWeapMaterialOrcish,
        input: SkyrimForms.ingotOrichalcum,
        perk: SkyrimForms.perkSmithingOrcish
      }, {
        name: "Silver",
        kwda: SkyrimForms.kwWeapMaterialSilver,
        input: SkyrimForms.ingotSilver,
        perk: SkyrimForms.perkSmithingSilver
      }, {
        name: "Silver Refined",
        kwda: SkyrimForms.kwWeapMaterialSilverRefined,
        input: SkyrimForms.ingotSilver,
        perk: SkyrimForms.perkSmithingSilver
      }, {
        name: "Steel",
        kwda: SkyrimForms.kwWeapMaterialSteel,
        input: SkyrimForms.ingotSteel,
        perk: SkyrimForms.perkSmithingSteel
      }, {
        name: "Wood",
        kwda: SkyrimForms.kwWeapMaterialWood,
        input: SkyrimForms.charcoal
      }, {
        name: "Stalhrim",
        kwda: SkyrimForms.kwDLC2WeaponMaterialStalhrim,
        input: SkyrimForms.oreStalhrim,
        perk: SkyrimForms.perkSmithingAdvanced
      }, {
        name: "Nordic",
        kwda: SkyrimForms.kwWeapMaterialNordic,
        input: SkyrimForms.ingotQuicksilver,
        perk: SkyrimForms.perkSmithingAdvanced
      }];
    }
    log(weapon, message) {
      var name = this.names[weapon];
      var formId = xelib.GetHexFormID(weapon);
      this.helpers.logMessage("--> ".concat(name, "(").concat(formId, "): ").concat(message));
    }
  };

  // src/icons.ts
  function fontIconFor(name, color = "") {
    var result = "".concat("<font face='Iconographia'>", name, "</font>");
    if (color.length > 0)
      result = "".concat("<font color='", color, "'>", result, "</font>");
    return result;
  }
  function hasWord(list, name) {
    return list.some((e) => name.includes(e));
  }
  var InteractionIconsFloraPatcher = class {
    constructor(helpers, locals, filePatch, settings) {
      this.helpers = helpers;
      this.settings = settings;
      this.lang = settings.lang;
      this.load = {
        filter: this.filterFunc.bind(this),
        signature: "FLOR"
      };
      this.patch = this.patchFunc.bind(this);
    }
    filterFunc(record) {
      if (!this.settings.icons.enabled)
        return false;
      return true;
    }
    patchFunc(flora) {
      const edid = xelib.EditorID(flora).toUpperCase();
      const full = xelib.FullName(flora).toLocaleUpperCase(this.lang);
      const rnam = xelib.GetValue(flora, "RNAM");
      const soundv = xelib.GetValue(flora, "SNAM");
      if (soundv.includes(SkyrimForms.itmMushroomUp) || edid.includes("SHROOM") || full && hasWord(LocData.flora.mushrooms[this.lang], full))
        xelib.AddElementValue(flora, "RNAM", fontIconFor("A"));
      else if (soundv.includes(SkyrimForms.itmClampUp) || edid.includes("CLAM") || full && hasWord(LocData.flora.clams[this.lang], full))
        xelib.AddElementValue(flora, "RNAM", fontIconFor("b"));
      else if (soundv.includes(SkyrimForms.itmPotionUpSD) || rnam && hasWord(LocData.flora.fill[this.lang], rnam))
        xelib.AddElementValue(flora, "RNAM", fontIconFor("L"));
      else if (hasWord(["BARREL", "CASK"], edid) || full && hasWord(LocData.flora.barrel[this.lang], full))
        xelib.AddElementValue(flora, "RNAM", fontIconFor("L"));
      else if (soundv.includes(SkyrimForms.itmCoinPouchUp) || soundv.includes(SkyrimForms.itmCoinPouchDown) || edid.includes("COIN") || full && hasWord(LocData.flora.coins[this.lang], full))
        xelib.AddElementValue(flora, "RNAM", fontIconFor("S"));
      else
        xelib.AddElementValue(flora, "RNAM", fontIconFor("Q"));
    }
    log(message) {
      this.helpers.logMessage("---->".concat(message));
    }
  };
  var InteractionIconsActivatorPatcher = class {
    constructor(helpers, locals, filePatch, settings) {
      this.helpers = helpers;
      this.locals = locals;
      this.settings = settings;
      this.lang = settings.lang;
      this.load = {
        filter: this.filterFunc.bind(this),
        signature: "ACTI"
      };
      this.patch = this.patchFunc.bind(this);
    }
    filterFunc(record) {
      if (!this.settings.icons.enabled)
        return false;
      const edid = xelib.EditorID(record).toUpperCase();
      if (edid.includes("TRIGGER") || edid.includes("FX"))
        return false;
      return true;
    }
    patchFunc(activator) {
      const full = xelib.FullName(activator).toLocaleUpperCase(this.lang);
      const edid = xelib.EditorID(activator).toUpperCase();
      const masterRecord = xelib.GetMasterRecord(activator);
      const rnam = xelib.GetValue(masterRecord, "RNAM").toLocaleUpperCase(this.lang);
      if (edid.includes("CWMAP"))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("F"));
      if (rnam && hasWord(LocData.activators.search[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("V"));
      if (rnam && hasWord(LocData.activators.grab[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("S"));
      if (safeHasArrayItem(activator, "KWDA", "", SkyrimForms.kwActivatorLever) || edid.includes("PULLBAR") || full && hasWord(LocData.activators.lever[this.lang], full))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("D"));
      if (full && hasWord(LocData.activators.chain[this.lang], full))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("E"));
      if (rnam && hasWord(LocData.activators.mine[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("G"));
      if (rnam && hasWord(LocData.activators.examine[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("F"));
      if (full && hasWord(LocData.activators.button[this.lang], full))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("F"));
      if (rnam && hasWord(LocData.activators.write[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("H"));
      if (full && hasWord(LocData.activators.shrine[this.lang], full) || edid.includes("DLC2STANDINGSTONE"))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("C"));
      if (rnam && hasWord(LocData.activators.shrine[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("C"));
      if (rnam && hasWord(LocData.activators.drink[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("C"));
      if (rnam && hasWord(LocData.activators.eat[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("K"));
      if (rnam && hasWord(LocData.activators.drop[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("K"));
      if (rnam && hasWord(LocData.activators.pickup[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("O"));
      if (rnam && hasWord(LocData.activators.read[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("P"));
      if (rnam && hasWord(LocData.activators.harvest[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("Q"));
      if (rnam && hasWord(LocData.activators.take[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("S"));
      if (rnam && hasWord(LocData.activators.talk[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("T"));
      if (rnam && hasWord(LocData.activators.sit[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("U"));
      if (rnam && hasWord(LocData.activators.open[this.lang], rnam) && (full && hasWord(LocData.activators.open[this.lang], full)))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("V"));
      if (rnam && hasWord(LocData.activators.open[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("X"));
      if (rnam && hasWord(LocData.activators.activate[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("Y"));
      if (rnam && hasWord(LocData.activators.unlock[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("Z"));
      if (rnam && hasWord(LocData.activators.sleep[this.lang], rnam) || full && hasWord(LocData.activators.sleep[this.lang], full))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("a"));
      if (rnam && hasWord(LocData.activators.stealFrom[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("V", "ff0000"));
      if (rnam && hasWord(LocData.activators.steal[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("S", "ff0000"));
      if (rnam && hasWord(LocData.activators.pickpocket[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("b", "ff0000"));
      if (rnam && hasWord(LocData.activators.close[this.lang], rnam))
        return xelib.AddElementValue(activator, "RNAM", fontIconFor("X", "dddddd"));
      return xelib.AddElementValue(activator, "RNAM", fontIconFor("W"));
    }
    log(message) {
      this.helpers.logMessage("---->".concat(message));
    }
  };

  // src/npc.ts
  var NPCPatcher = class {
    constructor(helpers, locals, patchFile, settings) {
      this.helpers = helpers;
      this.settings = settings;
      this.patchFile = patchFile;
      this.load = {
        filter: this.filterFunc.bind(this),
        signature: "NPC_"
      };
      this.patch = this.patchFunc.bind(this);
    }
    isElementArraysEquals(masterRecord, compareRecord, short) {
      var masterList = [];
      if (xelib.HasElement(masterRecord, short))
        masterList = xelib.GetElements(masterRecord, short, false);
      var secondList = [];
      if (xelib.HasElement(compareRecord, short))
        secondList = xelib.GetElements(compareRecord, short, false);
      if (masterList.length !== secondList.length)
        return false;
      var result = secondList.map((_, index) => {
        var val = xelib.GetValue(compareRecord, `${short}\\[${index}]`);
        return +xelib.HasArrayItem(masterRecord, short, "", val);
      });
      return secondList.length === result.reduce((v1, v2) => {
        return v1 + v2;
      }, 0);
    }
    isRecordsEquals(master, to, list) {
      var valMaster;
      var valTo;
      var result = list.map((el) => {
        if (xelib.HasElement(master, el))
          valMaster = xelib.GetValue(master, el);
        if (xelib.HasElement(to, el))
          valTo = xelib.GetValue(to, el);
        return +(valMaster === valTo);
      });
      return list.length === result.reduce((v1, v2) => {
        return v1 + v2;
      }, 0);
    }
    copyElements(from, to, path, subkeys = []) {
      var partsHandles = xelib.GetElements(from, path, false);
      xelib.RemoveElement(to, path);
      partsHandles.forEach((_, index) => {
        var tintPatch = `${path}\\[${index}]`;
        var newEntry = xelib.AddArrayItem(to, path, "", xelib.GetValue(from, tintPatch));
        if (subkeys.length > 0) {
          subkeys.forEach((key) => {
            var tintElementPath = `${tintPatch}\\${key}`;
            if (!xelib.HasElement(newEntry, key))
              xelib.AddElement(newEntry, key);
            xelib.SetValue(newEntry, key, xelib.GetValue(from, tintElementPath));
          });
        }
      });
    }
    copyRecord(from, to, path) {
      if (!xelib.HasElement(from, path)) {
        xelib.RemoveElement(to, path);
        return;
      }
      if (!xelib.HasElement(to, path))
        xelib.AddElement(to, path);
      xelib.SetValue(to, path, xelib.GetValue(from, path));
    }
    filterFunc(record) {
      if (!this.settings.npc.enabled)
        return false;
      if (!xelib.IsWinningOverride(record))
        return false;
      if (xelib.GetOverrides(record).length < 2)
        return false;
      const npc = xelib.GetValue(record, Records.AttackRace).toUpperCase();
      if (npc.includes("DRAGON") || npc.includes("HORSE"))
        return false;
      return true;
    }
    patchFunc(npc) {
      var overrides = xelib.GetOverrides(npc).reverse();
      overrides.some((patchRecord) => {
        var formID = xelib.ElementToJSON(xelib.GetElement(patchRecord, "Record Header\\FormID"));
        if (!this.settings.npc.plugins.find((val) => {
          return formID.includes(val);
        }))
          return false;
        if (xelib.IsWinningOverride(patchRecord))
          return true;
        if (xelib.HasElement(patchRecord, Records.HeadParts))
          this.copyElements(patchRecord, npc, Records.HeadParts);
        xelib.SetFlag(npc, Records.ConfigurationFlags, Flags.OppositeGenderAnim, xelib.GetFlag(patchRecord, Records.ConfigurationFlags, Flags.OppositeGenderAnim));
        [Records.HairColor, Records.Weight, Records.Height, Records.FaceTexture].forEach((p) => this.copyRecord(patchRecord, npc, p));
        [Records.FacePartEyes, Records.FacePartMouth, Records.FacePartNose, Records.FacePathOther].forEach((p) => this.copyRecord(patchRecord, npc, p));
        Records.TextureLightList.forEach((p) => this.copyRecord(patchRecord, npc, p));
        Records.FaceMorphsList.forEach((p) => this.copyRecord(patchRecord, npc, p));
        if (!xelib.HasElement(patchRecord, Records.TintLayers))
          xelib.RemoveElement(npc, Records.TintLayers);
        else
          this.copyElements(patchRecord, npc, Records.TintLayers, Records.TintLayerKeys);
        return true;
      });
    }
    log(message) {
      this.helpers.logMessage("NPCPatcher ----> ".concat(message));
    }
  };

  // src/reproccer.ts
  var alchemySettings = {
    baseStats: {
      duration: 2,
      priceLimits: {
        lower: 5,
        upper: 150
      },
      usePriceLimits: true
    },
    enabled: true
  };
  var armorSettings = {
    baseStats: {
      maxProtection: 95,
      multipliers: {
        boots: 1,
        cuirass: 3,
        gauntlets: 1,
        helmet: 1.5,
        shield: 1.5
      },
      protectionPerArmor: 0.1
    },
    enabled: true,
    modifiers: {
      armorStrongerLow: 1.1,
      armorStrongerMedium: 1.2,
      armorStrongerHigh: 1.3,
      armorWeakerLow: 0.9,
      armorWeakerMedium: 0.8,
      armorWeakerHigh: 0.7
    }
  };
  var projectileSettings = {
    enabled: true
  };
  var weaponSettings = {
    baseStats: {
      damage: {
        bow: 22,
        crossbow: 30,
        oneHanded: 12,
        twoHanded: 23
      },
      damageBonuses: {
        recurveCrossbow: 8
      },
      speedBonuses: {
        arbalestCrossbow: -0.2,
        lightweightCrossbow: 0.25
      },
      weightMultipliers: {
        arbalestCrossbow: 1.25,
        lightweightCrossbow: 0.75
      }
    },
    enabled: true,
    modifiers: {
      weaponStrongerLow: 1.1,
      weaponStrongerMedium: 1.2,
      weaponStrongerHigh: 1.3,
      weaponWeakerLow: 0.9,
      weaponWeakerMedium: 0.8,
      weaponWeakerHigh: 0.7
    }
  };
  var iconSettings = {
    enabled: true
  };
  var npcSettings = {
    enabled: true,
    plugins: ["Modpocalypse NPCs (v3) SSE.esp", "PAN_NPCs.esp", "PAN_NPCs_Males.esp"]
  };
  var mainSettings = {
    label: "Reproccer Reborn",
    templateUrl: `${patcherUrl}/partials/settings.html`,
    controller: SettingsController,
    defaultSettings: {
      patchFileName: "ReProccer.esp",
      alchemy: alchemySettings,
      armor: armorSettings,
      projectiles: projectileSettings,
      weapons: weaponSettings,
      npc: npcSettings,
      lang: "en",
      icons: iconSettings,
      ignoredFiles: [
        "Apocalypse - Magic of Skyrim.esp",
        "Bashed Patch, 0.esp",
        "Chesko_WearableLantern.esp",
        "Convenient Horses.esp",
        "Dr_Bandolier.esp",
        "Dr_BandolierDG.esp",
        "Growl - Werebeasts of Skyrim.esp"
      ]
    }
  };
  var ReproccerReborn = class {
    constructor() {
      mainSettings.defaultSettings.lang = getLanguageCode(xelib.GetGameLanguage(xelib.gmSSE));
      this.gameModes = [xelib.gmSSE];
      this.settings = mainSettings;
      this.info = info;
    }
    execute(patch, helpers, settings, locals) {
      var skyRePatchers = [AlchemyPatcher, ArmorPatcher, ProjectilePatcher, WeaponPatcher];
      var patchers = [];
      patchers = patchers.concat(skyRePatchers);
      patchers = patchers.concat([InteractionIconsFloraPatcher, InteractionIconsActivatorPatcher]);
      patchers = patchers.concat([NPCPatcher]);
      return {
        initialize: function initialize() {
          ReproccerReborn.buildRules(locals);
          ReproccerReborn.loadStatics(locals);
          locals.cobj = helpers.loadRecords("COBJ").map((h) => {
            return {
              handle: xelib.GetWinningOverride(h),
              cnamv: xelib.GetValue(h, "CNAM"),
              cnam: xelib.GetUIntValue(h, "CNAM"),
              bnam: xelib.GetUIntValue(h, "BNAM")
            };
          });
          for (var i = 0; i < patchers.length; i += 1) {
            patchers[i] = new patchers[i](helpers, locals, patch, settings);
          }
        },
        process: patchers,
        finalize: function finalize() {
        }
      };
    }
    getFilesToPatch(filenames) {
      return filenames.subtract(["ReProccer.esp"]);
    }
    requiredFiles() {
      return ["SkyRe_Main.esp" /* SkyRe */, "Poulet - Main.esp" /* Poulet */];
    }
    static buildRules(locals) {
      var rules = {};
      var last = fh.loadJsonFile("".concat(patcherPath, "/data/last.json"), null);
      rules = deepmerge(rules, last);
      xelib.GetLoadedFileNames().forEach((plugin) => {
        var data = fh.loadJsonFile("".concat(patcherPath, "/data/").concat(plugin.slice(0, -4), ".json"), null);
        if (data) {
          rules = deepmerge(rules, data);
        }
      });
      var first = fh.loadJsonFile("".concat(patcherPath, "/data/first.json"), null);
      rules = deepmerge(rules, first);
      locals.rules = rules;
    }
    static loadStatics(locals) {
      var files = {};
      var loadOrders = {};
      function GetHex(formId, filename) {
        var loadOrder = getLoadOrder(getFile(filename));
        return xelib.Hex(loadOrder * Math.pow(2, 24) + formId);
      }
      function getLoadOrder(file) {
        if (!loadOrders[file]) {
          loadOrders[file] = xelib.GetFileLoadOrder(file);
        }
        return loadOrders[file];
      }
      function getFile(filename) {
        if (!files[filename]) {
          files[filename] = xelib.FileByName(filename);
        }
        return files[filename];
      }
      SkyrimForms.init(GetHex);
    }
  };

  // src/init.ts
  registerPatcher(new ReproccerReborn());
})();
