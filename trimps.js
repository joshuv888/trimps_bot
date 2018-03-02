var pauseBot = false;
var jobsBot = true;
var lvl = game.global.world;
var uniqueMaps = [];
var targetMapCycle = 0;
var nextChallenge = undefined;
var mapsPerRound = 10;

for (var i = 0;i < game.global.mapsOwnedArray.length;i++) {
	if (uniqueMaps.indexOf(game.global.mapsOwnedArray[i].id) == -1 && game.global.mapsOwnedArray[i].level < game.global.world + 2) {
		if (game.global.mapsOwnedArray[i].level > 0) {
			uniqueMaps.push(game.global.mapsOwnedArray[i].id);
		}
	}
}

var target = 30 + game.global.totalPortals;
var challengeSelection = Array(40).fill(0);
var Balance = Array(40).fill('Balance');
challengeSelection = challengeSelection.concat(Balance);
var Electricity = Array(50).fill('Electricity');
challengeSelection = challengeSelection.concat(Electricity);
var Crushed = Array(50).fill('Crushed');
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
	var resources = [];
	resources.push({label:"food", valor:game.resources.food.owned});
	resources.push({label:"wood", valor:game.resources.wood.owned});
	resources.push({label:"metal", valor:game.resources.metal.owned});
	resources.push({label:"science", valor:game.resources.science.owned});
	resources.sort(function(a,b) {return a.valor - b.valor});
	return resources[0].label;
}

var cursorMe = function () {
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

	setTimeout(function(){
		cursorMe();
	}, 100);
}

var mainLoop = function () {
	/* *********** */
	/*  BUILDINGS  */
	/* *********** */
	var buildings = ['Collector','Gateway','Gym','Hotel','House','Hut','Mansion','Nursery','Resort','Tribute','Warpstation']

	if (game.upgrades.Formations.done && game.global.formation != 2) {
		setFormation(2);
	}

	let houses = ['Hut','House','Mansion','Hotel','Resort','Gateway','Collector']

	for (var i = 0;i < buildings.length;i++) {
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
				buyUpgrade(upgrade,true);
			}
		}
	}

	if (getAvailableGoldenUpgrades() > 0) {
		buyGoldenUpgrade('Helium');
	}

	/* *********** */
	/*  EQUIPMENT  */
	/* *********** */

	var equipmentMaxLvl = (game.global.challengeActive == "Trimp" || game.global.challengeActive == "Frugal") ? 100 : 10;

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

	var resources = ['food','wood','metal'];
	var buildings = ['Barn','Shed','Forge'];

	for (var i = 0;i < 3;i++) {
		if (game.resources[resources[i]].owned > (getMyMaxResources(resources[i]) / 10 * 8 ) ) {
			buyBuilding(buildings[i]);
		}
	}

	if (!pauseBot) {
		setTimeout(function(){
			mainLoop();
		}, 300);
	}
}

function jobLoop() {
	/* ****** */
	/*  JOBS  */
	/* ****** */
	if (jobsBot && !game.global.firing) {
		var unemp = (Math.ceil(game.resources.trimps.realMax() / 2) - game.resources.trimps.employed);

		if (unemp > 0) {
			game.global.buyAmt = 1;
			var training = false;
			var buildTrainers = (game.jobs['Trainer'].owned < ((game.jobs['Farmer'].owned - (game.jobs['Farmer'].owned % 4)) / 4) && game.jobs['Trainer'].owned < (game.global.world * 10) && !game.jobs.Trainer.locked);
			var buildExplorers = (game.jobs['Explorer'].owned < ((game.jobs['Farmer'].owned - (game.jobs['Farmer'].owned % 8)) / 8) && game.jobs['Explorer'].owned < (game.global.world * 10) && !game.jobs.Explorer.locked);
			var buildScientists = (game.jobs['Scientist'].owned < ((game.jobs['Farmer'].owned - (game.jobs['Farmer'].owned % 4)) / 4) && game.jobs['Scientist'].owned < (game.global.world * 10) && !game.jobs.Scientist.locked);
			var buildGeneticists = (game.jobs['Geneticist'].owned < ((game.jobs['Farmer'].owned - (game.jobs['Farmer'].owned % 8)) / 8) && game.jobs['Geneticist'].owned < (game.global.world * 2) && !game.jobs.Geneticist.locked);

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
		setTimeout(function(){
			jobLoop();
		}, 300);
	}
}

function getMyMaxResources(what) {
	var structure;
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
	var structureObj = game.buildings[structure];
	var base = 500;	
	//Add base
	var currentCalc = base;
	//Add structure
	var structBonus = Math.pow(2, structureObj.owned);
	currentCalc *= structBonus;
	//Add packrat
	if (game.portal.Packrat.level){
		var packAmt = (game.portal.Packrat.level * 0.2) + 1;
		currentCalc *= packAmt;
	}
	if (game.heirlooms.Shield.storageSize.currentBonus > 0){
		var hatAmt = calcHeirloomBonus("Shield", "storageSize", 0, true);
		currentCalc *= ((hatAmt / 100) + 1);
	}
	
	return currentCalc;
}

/* ******** */
/*  PORTAL  */
/* ******** */

function waitForTrapsorm() {
	if (!game.upgrades.Trapstorm.done) {
		setTimeout(function(){
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
			setTimeout(function(){
				pauseFight();
			}, 500);
		}
	} else {
		if (game.upgrades.Battle.done) {
			fightManual();
		}
		setTimeout(function(){
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

var boughtSomething;

function getCheapestAbility() {
	var tempHability = 'Power';
	for (habilidad in game.portal) {
		if (game.portal.hasOwnProperty(habilidad) && !(game.portal[habilidad].locked) && (game.portal[habilidad].level + game.portal[habilidad].levelTemp < game.portal[habilidad].max || !game.portal[habilidad].max)) {
			if (getPortalUpgradePrice(habilidad) < getPortalUpgradePrice(tempHability)) {
				tempHability = habilidad;
			}
		}
	}
	
	if (getPortalUpgradePrice(tempHability) <= (game.resources.helium.respecMax - game.resources.helium.totalSpentTemp)) {
		buyPortalUpgrade(tempHability);
		setTimeout(function(){
			getCheapestAbility();
		}, 10);
	} else {
		setTimeout(function(){
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
			if (challengeSelection[target-1]) {
				console.log("Doing Challenge:",challengeSelection[target-1]);
			}
			if (game.global.b > 19) {
				purchaseMisc('maps');
			}
			game.global.playerModifier = Math.pow(2,50);
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
		setTimeout(function(){
			waitForUniqueMapToComplete(timeout);
		}, 500);
	}
}

function checkForUniqueMaps() {
	var unique_id;
	var void_id;
	for (var i = 0;i < game.global.mapsOwnedArray.length;i++) {
		if (uniqueMaps.indexOf(game.global.mapsOwnedArray[i].id) == -1 && game.global.mapsOwnedArray[i].level < game.global.world + 2) {
			if (game.global.mapsOwnedArray[i].level > 0) {
				unique_id = game.global.mapsOwnedArray[i].id;
				console.log("Found unique map:",game.global.mapsOwnedArray[i].name);
			} else {
				void_id = game.global.mapsOwnedArray[i].id;
				console.log("Found void map:",game.global.mapsOwnedArray[i].name);
			}
		}
	}
	if (unique_id) {
		selectMap(unique_id);
		uniqueMaps.push(unique_id);
		setTimeout(function(){
			runMap();
			repeatCurrentMap(false);
			setTimeout(function(){
				waitForUniqueMapToComplete(Date.now() + 600000);
			}, 500);
		}, 500);
	} else if (void_id) {
		selectMap(void_id);
		setTimeout(function(){
			runMap();
			repeatCurrentMap(false);
			setTimeout(function(){
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
	var color = (game.global.repeatMap) ? "btn-success" : "btn-danger";
	var elem = document.getElementById("repeatBtn");
	elem.className = "";
	elem.className = "btn fightBtn " + color;
	elem.innerHTML = (game.global.repeatMap) ? "Repeat On" : "Repeat Off";
}

function waitForMapToComplete() {
	if (!game.global.mapsActive) {
		recycleMap();
		checkForUniqueMaps();
	} else {
		setTimeout(function(){
			waitForMapToComplete();
		}, 500);
	}
}

function calculateMapCost(biome,loot,difficulty,size) {
	var baseCost = game.global.world;
	baseCost += size;
	baseCost += (loot * 2);
	baseCost += Math.floor(difficulty * 1.5);
	baseCost = Math.floor((baseCost / 4) + (Math.pow(1.15, baseCost - 1)));
	if (biome != "Random") baseCost *= 2;
	return baseCost;
}

function waitForMapCycle() {
	if (targetMapCycle <= (game.stats.mapsCleared.value + 1)) {
		repeatCurrentMap(false);
	} else {
		setTimeout(function() {
			waitForMapCycle();
		}, 1000);
	}
}

function createMyMap(goIn) {
	document.getElementById("biomeAdvMapsSelect").value = "Mountain";
	var loot = 0;
	var difficulty = 0;
	var size = 0;

	for (var i = 0;i < 10;i++) {
		if (calculateMapCost("Mountain",i,0,0) < game.resources.fragments.owned) {
			loot = i;
		}
	}

	document.getElementById("lootAdvMapsRange").value = loot;

	for (var i = 0;i < 10;i++) {
		if (calculateMapCost("Mountain",loot,i,0) <= game.resources.fragments.owned) {
			difficulty = i;
		}
	}

	document.getElementById("difficultyAdvMapsRange").value = difficulty;

	for (var i = 0;i < 10;i++) {
		if (calculateMapCost("Mountain",loot,difficulty,i) <= game.resources.fragments.owned) {
			size = i;
		}
	}

	document.getElementById("sizeAdvMapsRange").value = size;

	updateMapCost();

	if (calculateMapCost("Mountain",0,0,0) > game.resources.fragments.owned) {
		setTimeout(function() {
			createMyMap(true)
		}, 1000);
	} else {
		updateMapCost();

		buyMap();

		console.log("Doing Map on zone:", game.global.world);

		var map = game.global.mapsOwnedArray[0];
		var map_id = map.id;

		for (var i = 0;i < game.global.mapsOwnedArray.length;i++) {
			if (game.global.mapsOwnedArray[i].level > map.level && !game.global.mapsOwnedArray[i].noRecycle) {
				map_id = game.global.mapsOwnedArray[i].id;
			}
		}

		selectMap(map_id);

		if (goIn) {
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
			setTimeout(function() {
				repeatCurrentMap(true);
				waitForMapCycle();
				waitForMapToComplete();
			}, 1000);
		} else {

		}
	}
}

function gotoMaps() {
	if (game.global.world > target) {
		mapsSwitch();
		pauseBot = true;
		setTimeout(function(){
			portalOut();
		}, 1000);
	} else {
		if (game.global.world > lvl && game.global.world > 6) {
			lvl = game.global.world;
			mapsSwitch();
			setTimeout(function(){
				createMyMap(true);
			}, 500);
		}

		if (!pauseBot) {
			setTimeout(function(){
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
