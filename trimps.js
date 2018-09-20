let pauseBot = false;
let jobsBot = true;
let pauseBuild = false;
let lvl = game.global.world;
let uniqueMaps = [];
let targetMapCycle = 0;
let nextChallenge = undefined;
let mapsPerRound = 10;

for (let i = 0; i < game.global.mapsOwnedArray.length; i++) {
  if (uniqueMaps.indexOf(game.global.mapsOwnedArray[i].id) == -1 && game.global.mapsOwnedArray[i].level < game.global.world + 2) {
    if (game.global.mapsOwnedArray[i].noRecycle) {
      uniqueMaps.push(game.global.mapsOwnedArray[i].id);
    }
  }
}

let target = 30 + game.global.totalPortals;
let challengeSelection = Array(40).fill(0);
let Balance = Array(40).fill('Balance');
challengeSelection = challengeSelection.concat(Balance);
let Electricity = Array(50).fill('Electricity');
challengeSelection = challengeSelection.concat(Electricity);
let Crushed = Array(50).fill('Crushed');
challengeSelection = challengeSelection.concat(Crushed);

challengeSelection[32] = 'Discipline';
challengeSelection[33] = 'Metal';
challengeSelection[35] = 'Size';
challengeSelection[41] = 'Scientist';
challengeSelection[45] = 'Meditate';
challengeSelection[55] = 'Scientist';
challengeSelection[63] = 'Trimp';
challengeSelection[70] = 'Trapper';
challengeSelection[91] = 'Scientist';
challengeSelection[101] = 'Frugal';
challengeSelection[121] = 'Coordinate';
challengeSelection[131] = 'Scientist';
challengeSelection[132] = 'Slow';

function autoTrapToggled() {
  if (game.global.trapBuildToggled) {
    return (game.global.buildingsQueue.length > 1 || game.global.buildingsQueue.indexOf("Trap.1") == -1);
  } else {
    return (game.global.buildingsQueue.length > 0);
  }
}

function reordenar() {
  let resources = [];
  resources.push({label: "food", valor: game.resources.food.owned});
  resources.push({label: "wood", valor: game.resources.wood.owned});
  resources.push({label: "metal", valor: game.resources.metal.owned});
  resources.push({label: "science", valor: game.resources.science.owned});
  resources.sort(function (a, b) {
    return a.valor - b.valor
  });
  return resources[0].label;
}

function cursorMe() {
  if (!game.upgrades.Miners.done || game.global.world < 9 || !game.upgrades.Bloodlust.done) {
    if (game.resources.food.owned < 10) {
      setGather('food');
    } else if (game.resources.wood.owned < 10) {
      setGather('wood');
    } else {
      if (game.global.challengeActive == 'Trapper' && game.resources.trimps.owned < game.resources.trimps.realMax()) {
        if (game.buildings.Trap.owned < 1) {
          buyBuilding('Trap');
        }
        if (game.buildings.Trap.owned > 0) {
          setGather('trimps');
        }
      } else {
        if (game.resources.trimps.owned < game.resources.trimps.realMax() && (game.resources.trimps.realMax() < 40 || (game.resources.trimps.owned < (game.resources.trimps.realMax() / 4 * 3)))) {
          if (game.global.buildingsQueue.length > 0) {
            setGather('buildings');
          } else {
            if (game.buildings.Trap.owned < 1) {
              buyBuilding('Trap');
            }
            if (game.buildings.Trap.owned > 0) {
              setGather('trimps');
            }
          }
        } else {
          if (autoTrapToggled()) {
            setGather('buildings')
          } else {
            setGather(reordenar());
          }
        }
      }
    }
  } else {
    if (game.global.challengeActive == 'Trapper' && game.resources.trimps.owned < game.resources.trimps.realMax()) {
      if (game.buildings.Trap.owned < 1) {
        buyBuilding('Trap');
      }
      if (game.buildings.Trap.owned > 0) {
        setGather('trimps');
      }
    } else {
      if (autoTrapToggled()) {
        setGather('buildings')
      } else {
        setGather(reordenar());
      }
    }
  }
  //game.resources.trimps.owned = game.resources.trimps.max;

  if (game.global.radioStacks > 0) {
    game.global.radioStacks = 0;
  }

  setTimeout(function () {
    cursorMe();
  }, 100);
}

function mainLoop() {
  /* *********** */
  /*  BUILDINGS  */
  /* *********** */
  if (game.upgrades.Formations.done && game.global.formation != 2) {
    setFormation(2);
  }

  if (!pauseBuild) {
    let buildings = ['Collector', 'Gateway', 'Gym', 'Hotel', 'House', 'Hut', 'Mansion', 'Nursery', 'Resort', 'Tribute', 'Warpstation'];
    let houses = ['Hut', 'House', 'Mansion', 'Hotel', 'Resort', 'Gateway', 'Collector'];
    for (let i in buildings) {
      if (!game.buildings[buildings[i]].locked) {
        if (houses.indexOf(buildings[i]) == -1) {
          buyBuilding(buildings[i]);
        } else {
          if (game.buildings[buildings[i]].owned < 100) {
            buyBuilding(buildings[i]);
          }
        }
      }
    }

    /* ********** */
    /*  UPGRADES  */
    /* ********** */
    for (upgrade in game.upgrades) {
      if (game.upgrades.hasOwnProperty(upgrade)) {
        if (game.upgrades[upgrade].locked == 0) {
          game.upgrades[upgrade].alert = false;
          buyUpgrade(upgrade, true);
        }
      }
    }

    if (getAvailableGoldenUpgrades() > 0) {
      buyGoldenUpgrade('Helium');
    }

    /* *********** */
    /*  EQUIPMENT  */
    /* *********** */
    let equipmentMaxLvl = (game.global.challengeActive == "Trimp" || game.global.challengeActive == "Frugal") ? 100 : 10;

    if ((game.upgrades.Miners.done && game.upgrades.Speedminer.locked) || game.upgrades.Miners.locked) {
      for (equipment in game.equipment) {
        if (game.equipment.hasOwnProperty(equipment)) {
          if (game.equipment[equipment].locked == 0 && game.equipment[equipment].level < equipmentMaxLvl) {
            buyEquipment(equipment);
          }
        }
      }
    }

    /* ********* */
    /*  STORAGE  */
    /* ********* */
    let resources = ['food', 'wood', 'metal'];
    buildings = ['Barn', 'Shed', 'Forge'];

    for (let i = 0; i < 3; i++) {
      if (game.resources[resources[i]].owned > (getMyMaxResources(resources[i]) / 10 * 8)) {
        buyBuilding(buildings[i]);
      }
    }
  }

  if (!pauseBot) {
    setTimeout(function () {
      mainLoop();
    }, 300);
  }
}

function jobLoop() {
  /* ****** */
  /*  JOBS  */
  /* ****** */
  if (jobsBot && !game.global.firing) {
    let unemp = (Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed);

    if (unemp > 0) {
      game.global.buyAmt = 1;
      let training = false;
      let buildTrainers = (game.jobs['Trainer'].owned < ((game.jobs['Farmer'].owned - (game.jobs['Farmer'].owned % 4)) / 4) && game.jobs['Trainer'].owned < (game.global.world * 10) && !game.jobs.Trainer.locked);
      let buildExplorers = (game.jobs['Explorer'].owned < ((game.jobs['Farmer'].owned - (game.jobs['Farmer'].owned % 8)) / 8) && game.jobs['Explorer'].owned < (game.global.world * 10) && !game.jobs.Explorer.locked);
      let buildScientists = (game.jobs['Scientist'].owned < ((game.jobs['Farmer'].owned - (game.jobs['Farmer'].owned % 4)) / 4) && game.jobs['Scientist'].owned < (game.global.world * 10) && !game.jobs.Scientist.locked);
      let buildGeneticists = (game.jobs['Geneticist'].owned < ((game.jobs['Farmer'].owned - (game.jobs['Farmer'].owned % 8)) / 8) && game.jobs['Geneticist'].owned < (game.global.world * 2) && !game.jobs.Geneticist.locked);

      if (buildGeneticists && canAffordJob('Geneticist')) {
        buyJob('Geneticist');
        training = true;
        unemp--;
      }

      if (unemp > 0 && buildExplorers && canAffordJob('Explorer')) {
        buyJob('Explorer');
        training = true;
        unemp--;
      }

      if (unemp > 0 && buildTrainers && canAffordJob('Trainer')) {
        buyJob('Trainer');
        training = true;
        unemp--;
      }

      if (unemp > 0 && buildScientists && canAffordJob('Scientist')) {
        buyJob('Scientist');
        training = true;
        unemp--;
      }

      if (unemp > 0 && !training) {
        unemp = (Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed);

        if (game.jobs['Lumberjack'].owned < game.jobs['Farmer'].owned && !game.jobs['Lumberjack'].locked && unemp > 0 && canAffordJob('Lumberjack')) {
          game.global.buyAmt = (unemp > (game.jobs['Farmer'].owned - game.jobs['Lumberjack'].owned)) ? (game.jobs['Farmer'].owned - game.jobs['Lumberjack'].owned) : unemp;
          buyJob('Lumberjack');
          unemp = (Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed);
          game.global.buyAmt = 1;
        }

        unemp = (Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed);

        if (game.jobs['Miner'].owned < game.jobs['Farmer'].owned && !game.jobs['Miner'].locked && unemp > 0 && canAffordJob('Miner')) {
          game.global.buyAmt = (unemp > (game.jobs['Farmer'].owned - game.jobs['Miner'].owned)) ? (game.jobs['Farmer'].owned - game.jobs['Miner'].owned) : unemp;
          buyJob('Miner');
          unemp = (Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed);
          game.global.buyAmt = 1;
        }

        unemp = (Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed);

        if (game.jobs['Farmer'].owned < game.jobs['Lumberjack'].owned && !game.jobs['Farmer'].locked && unemp > 0 && canAffordJob('Farmer')) {
          game.global.buyAmt = (unemp > (game.jobs['Lumberjack'].owned - game.jobs['Farmer'].owned)) ? (game.jobs['Lumberjack'].owned - game.jobs['Farmer'].owned) : unemp;
          buyJob('Farmer');
          unemp = (Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed);
          game.global.buyAmt = 1;
        }

        unemp = (Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed);

        if (unemp >= (3 - game.jobs['Lumberjack'].locked - game.jobs['Miner'].locked)) {
          if (game.global.world == 1) {
            game.global.buyAmt = 1;
          } else {
            game.global.buyAmt = (unemp - (unemp % (3 - game.jobs['Lumberjack'].locked - game.jobs['Miner'].locked))) / (3 - game.jobs['Lumberjack'].locked - game.jobs['Miner'].locked);
          }

          if (!game.jobs['Farmer'].locked) {
            buyJob('Farmer');
          }
          if (!game.jobs['Lumberjack'].locked) {
            buyJob('Lumberjack');
          }
          if (!game.jobs['Miner'].locked) {
            buyJob('Miner');
          }

          game.global.buyAmt = 1;
        }
      }
    }
  }

  if (jobsBot) {
    setTimeout(function () {
      jobLoop();
    }, 300);
  }
}

function getMyMaxResources(what) {
  let structure;
  switch (what) {
    case "food":
      structure = "Barn";
      break;
    case "wood":
      structure = "Shed";
      break;
    case "metal":
      structure = "Forge";
      break;
  }
  if (!structure) return;
  let structureObj = game.buildings[structure];
  let base = 500;
  //Add base
  let currentCalc = base;
  //Add structure
  let structBonus = Math.pow(2, structureObj.owned);
  currentCalc *= structBonus;
  //Add packrat
  if (game.portal.Packrat.level) {
    let packAmt = (game.portal.Packrat.level * 0.2) + 1;
    currentCalc *= packAmt;
  }
  if (game.heirlooms.Shield.storageSize.currentBonus > 0) {
    let hatAmt = calcHeirloomBonus("Shield", "storageSize", 0, true);
    currentCalc *= ((hatAmt / 100) + 1);
  }

  return currentCalc;
}

/* ******** */
/*  PORTAL  */

/* ******** */

function waitForTrapsorm() {
  if (!game.upgrades.Trapstorm.done) {
    setTimeout(function () {
      waitForTrapsorm();
    }, 5000);
  } else {
    // Turn auto trap on
    if (!game.global.trapBuildToggled) {
      toggleAutoTrap();
    }
  }
}

function autoAttack() {
  if (game.upgrades.Bloodlust.done) {
    if (game.global.pauseFight) {
      setTimeout(function () {
        pauseFight();
      }, 500);
    }
  } else {
    if (game.upgrades.Battle.done) {
      fightManual();
    }
    setTimeout(function () {
      autoAttack();
    }, 500);
  }
}

function selectMyChallenge() {
  if (nextChallenge) {
    selectChallenge(nextChallenge);
  } else {
    if (challengeSelection[target]) {
      selectChallenge(challengeSelection[target]);
    } else {
      selectChallenge(0);
    }
  }
  nextChallenge = undefined;
}

let boughtSomething;

function getCheapestAbility() {
  let tempHability = 'Power';
  for (habilidad in game.portal) {
    if (game.portal.hasOwnProperty(habilidad) && !(game.portal[habilidad].locked) && (game.portal[habilidad].level + game.portal[habilidad].levelTemp < game.portal[habilidad].max || !game.portal[habilidad].max)) {
      if (getPortalUpgradePrice(habilidad) < getPortalUpgradePrice(tempHability)) {
        tempHability = habilidad;
      }
    }
  }

  if (getPortalUpgradePrice(tempHability) <= (game.resources.helium.respecMax - game.resources.helium.totalSpentTemp)) {
    buyPortalUpgrade(tempHability);
    setTimeout(function () {
      getCheapestAbility();
    }, 10);
  } else {
    setTimeout(function () {
      activateClicked();
      //if (confirm("Does it look alright?")) {
      activatePortal();
      //}
      mainLoop();
      gotoMaps();
      autoAttack();
      waitForTrapsorm();
      target = 31 + game.global.totalPortals;
      console.clear()
      console.log("Portal #", game.global.totalPortals);
      console.log("Target lvl to portal next #", target);
      if (challengeSelection[target - 1]) {
        console.log("Doing Challenge:", challengeSelection[target - 1]);
      }
      if (game.global.b > 19) {
        purchaseMisc('maps');
      }
      game.global.playerModifier = Math.pow(2, 50);
    }, 1000);
  }
}

function portalOut() {
  game.global.trapBuildToggled = false
  lvl = 1;
  pauseBot = false;
  uniqueMaps = [];
  portalClicked();
  selectMyChallenge();
  getCheapestAbility();
}

/* ************* */
/*  UNIQUE MAPS  */
/* ************* */
function waitForUniqueMapToComplete(timeout) {
  if (Date.now() > timeout) {
    mapsSwitch();
  }
  if (!game.global.mapsActive) {
    mapsSwitch();
  } else {
    setTimeout(function () {
      waitForUniqueMapToComplete(timeout);
    }, 500);
  }
}

function checkForUniqueMaps() {
  let unique_id;
  let void_id;
  for (let i = 0; i < game.global.mapsOwnedArray.length; i++) {
    if (uniqueMaps.indexOf(game.global.mapsOwnedArray[i].id) == -1 && game.global.mapsOwnedArray[i].level < game.global.world + 2) {
      if (game.global.mapsOwnedArray[i].level > 0) {
        unique_id = game.global.mapsOwnedArray[i].id;
        console.log("Found unique map:", game.global.mapsOwnedArray[i].name);
      } else {
        void_id = game.global.mapsOwnedArray[i].id;
        console.log("Found void map:", game.global.mapsOwnedArray[i].name);
      }
    }
  }
  if (unique_id) {
    selectMap(unique_id);
    uniqueMaps.push(unique_id);
    setTimeout(function () {
      runMap();
      repeatCurrentMap(false);
      setTimeout(function () {
        waitForUniqueMapToComplete(Date.now() + 600000);
      }, 500);
    }, 500);
  } else if (void_id) {
    selectMap(void_id);
    setTimeout(function () {
      runMap();
      repeatCurrentMap(false);
      setTimeout(function () {
        waitForUniqueMapToComplete(Date.now() + 300000);
      }, 500);
    }, 500);
  } else {
    mapsSwitch();
  }
}

/* ****** */
/*  MAPS  */

/* ****** */

function repeatCurrentMap(maybe) {
  game.global.repeatMap = maybe;
  let color = (game.global.repeatMap) ? "btn-success" : "btn-danger";
  let elem = document.getElementById("repeatBtn");
  elem.className = "";
  elem.className = "btn fightBtn " + color;
  elem.innerHTML = (game.global.repeatMap) ? "Repeat On" : "Repeat Off";
}

function waitForMapToComplete() {
  if (!game.global.mapsActive) {
    recycleMap();
    checkForUniqueMaps();
  } else {
    setTimeout(function () {
      waitForMapToComplete();
    }, 500);
  }
}

function calculateMapCost(biome, loot, difficulty, size) {
  var mapLevel = game.global.world;
  var baseCost = 0;
  //Sliders: 27 total * 0.74 = ~20
  baseCost += getMapSliderValue("size");
  baseCost += getMapSliderValue("loot");
  baseCost += getMapSliderValue("difficulty");
  baseCost *= (game.global.world >= 60) ? 0.74 : 1;
  //Special Modifier
  var specialModifier = getSpecialModifierSetting();
  if (specialModifier != "0"){
    baseCost += mapSpecialModifierConfig[specialModifier].costIncrease;
  }
  //Perfect Checkbox
  if (checkPerfectChecked()){
    baseCost += 6;
  }
  //Extra Levels
  var extraLevels = getExtraMapLevels();
  if (extraLevels > 0){
    baseCost += (10 * extraLevels);
  }
  baseCost += mapLevel;
  baseCost = Math.floor((((baseCost / 150) * (Math.pow(1.14, baseCost - 1))) * mapLevel * 2) * Math.pow((1.03 + (mapLevel / 50000)), mapLevel));
  baseCost *= 2;
  if (getValue) return baseCost;
  return baseCost;
}

function waitForMapCycle() {
  if (targetMapCycle <= (game.stats.mapsCleared.value + 1)) {
    repeatCurrentMap(false);
  } else {
    setTimeout(function () {
      waitForMapCycle();
    }, 1000);
  }
}

function reCalculateMap(mapBiome) {
  document.getElementById("biomeAdvMapsSelect").value = mapBiome;
  let loot = 0;
  let difficulty = 0;
  let size = 0;

  for (let i = 0; i < 10; i++) {
    if (calculateMapCost(mapBiome, i, 0, 0) < game.resources.fragments.owned) {
      loot = i;
    }
  }

  document.getElementById("lootAdvMapsRange").value = loot;

  for (let i = 0; i < 10; i++) {
    if (calculateMapCost(mapBiome, loot, i, 0) <= game.resources.fragments.owned) {
      difficulty = i;
    }
  }

  document.getElementById("difficultyAdvMapsRange").value = difficulty;

  for (let i = 0; i < 10; i++) {
    if (calculateMapCost(mapBiome, loot, difficulty, i) <= game.resources.fragments.owned) {
      size = i;
    }
  }

  document.getElementById("sizeAdvMapsRange").value = size;

  updateMapCost();
}

function createMyMap(goIn) {
  pauseBuild = true;
  let mapBiome = "Mountain";
  toggleSetting('pauseGame');

  if (calculateMapCost(mapBiome, 0, 0, 0) > game.resources.fragments.owned) {
    toggleSetting('pauseGame');
    setTimeout(function () {
      createMyMap(true)
    }, 1000);
  } else {
    reCalculateMap(mapBiome);
    buyMap();
    toggleSetting('pauseGame');

    console.log("Doing Map on zone:", game.global.world);

    let map;
    let map_id;
    let tryAgain = true;

    for (let i in game.global.mapsOwnedArray) {
      if (game.global.mapsOwnedArray[i].level == game.global.world && !game.global.mapsOwnedArray[i].noRecycle) {
        map = game.global.mapsOwnedArray[i];
        map_id = game.global.mapsOwnedArray[i].id;
        tryAgain = false;
      }
    }

    if (tryAgain) {
      setTimeout(function () {
        createMyMap(true)
      }, 100);
    } else {
      selectMap(map_id);

      if (goIn) {
        pauseBuild = false;
        runMap();
        // if (game.global.world > 100) {
        // 	if (game.global.world == target) {
        // 		targetMapCycle = game.stats.mapsCleared.value + 10;
        // 	} else {
        // 		targetMapCycle = game.stats.mapsCleared.value + 30;
        // 	}
        // } else {
        // 	targetMapCycle = game.stats.mapsCleared.value + 10;
        // }
        targetMapCycle = game.stats.mapsCleared.value + mapsPerRound;
        setTimeout(function () {
          repeatCurrentMap(true);
          waitForMapCycle();
          waitForMapToComplete();
        }, 1000);
      }
    }
  }
}

function gotoMaps() {
  if (game.global.world > target) {
    mapsSwitch();
    pauseBot = true;
    setTimeout(function () {
      portalOut();
    }, 1000);
  } else {
    if (game.global.world > lvl && game.global.world > 6) {
      lvl = game.global.world;
      mapsSwitch();
      setTimeout(function () {
        createMyMap(true);
      }, 500);
    }

    if (!pauseBot) {
      setTimeout(function () {
        gotoMaps();
      }, 1000);
    }
  }
}

/* ********* */
/*  RUN BOT  */
/* ********* */

cursorMe();
mainLoop();
jobLoop();
gotoMaps();
