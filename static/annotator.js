/** GLOBAL VARIABLES **/
var listOfFiles = [];
var currentImageIndex = 0;
var selectedDataset = "";
var selectedDatasetType = "";
var canvasElem, zoom, zoomCtx;
var imgData = new Object();
var datasetSpecificFeatures = new Object();
var newAgentsLabels = new Object();
var firstDraw = true;
var imageLabelled = false;
var groupsInPicture = new Object();
var correctionIndex = 0;
var canvasWidth = 1296;
var canvasHeight = 654;
var minbBoxArea = 6000;
var magnifyingGlassZoomFactor = 2;
var percentageImageAnnotated = 0;
var numberOfTagsToPressInImage = 0;
var globalNumberOfTagsPressed = 0;
var expectedAttributesPersons = ["age", "sex", "skin tone", "mean of transport"];
var expectedAttributesVehicles = ["vehicle type", "color"];
const pedestrianHTML = `<div class="mb-0 mt-2"><span>Age</span><br/> 
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Adult</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Kid</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Unknown</span></button></div>
<div class="mb-0 mt-2"><span>Sex</span><br/>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Male</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Female</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="displayConfCasePopup(this)"><span class="font-weight-bold">Unknown</span></button>
<div class="conflicting-case">
<span>A conflicting case is declared when a person's sexual identity cannot be classified following the traditional binary approach. Select "Yes" if: (1) you can clearly see the agent but they do not conform to the traditional male/female appearance. (2) The characteristics of the person you can see in the image are not sufficient to declare whether he/she/they is male or female. Select "No" when the quality of the image does not allow you to make a decision.</span>
<div class="row conf-case-row-buttons">
<button class="btn btn-primary rounded-pill btn-sm conf-case-btn" onClick="setConflictingState(this, true)">Yes</button>
<button class="btn btn-primary rounded-pill btn-sm conf-case-btn" onClick="setConflictingState(this, false)">No</button></div></div></div>
<div class="mb-0 mt-2"><span>Skin tone</span><br/>
<button type="button" class="btn btn-dark-skin btn-dark-skin-tone rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Dark Skin</span></button>
<button type="button" class="btn btn-light-skin btn-light-skin-tone rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Light Skin</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="displayConfCasePopup(this)"><span class="font-weight-bold">Unknown</span></button>
<div class="conflicting-case">
<span>A conflicting case is declared when a person's skin tone cannot be classified following a binary approach. Select "Yes" when you can clearly see the person to be labeled in the image but they does not conform to either dark or light skin tones, . Select "No" when the quality of the image does not allow you to make a decision.</span>
<div class="row conf-case-row-buttons">
<button class="btn btn-primary rounded-pill btn-sm conf-case-btn" onClick="setConflictingState(this, true)">Yes</button>
<button class="btn btn-primary rounded-pill btn-sm conf-case-btn" onClick="setConflictingState(this, false)">No</button></div></div></div>
<div class="mb-0 mt-2"><span>Mean of transport</span><br/>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Pedestrian</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Wheelchair</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Bicycle</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Personal mobility device</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Unknown</span></button>
<div class="mt-3 errorInLabellingAgent"><span style="margin-right:10px;">Error in agent's labelling</span><input type="checkbox" onClick="toggleErrorInAgent(this)"></div></div>`

const vehicleHTML = `<div class="mb-0 mt-2"><span>Vehicle Type</span><br/> 
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Car</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Motorcycle</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Truck</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Bus</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Van/Minivan</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Other</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Unknown</span></button></div>
<div class="mb-0 mt-2"><span>Color</span><br/>
<button type="button" class="btn btn-dark rounded-pill btn-sm dark-btn" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Black</span></button>
<button type="button" class="btn btn-light rounded-pill btn-sm light-btn" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">White</span></button>
<button type="button" class="btn btn-secondary rounded-pill btn-sm secondary-btn" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Grey</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm primary-btn" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Blue</span></button>
<button type="button" class="btn btn-danger rounded-pill btn-sm danger-btn" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Red</span></button>
<button type="button" class="btn btn-warning rounded-pill btn-sm warning-btn" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Yellow</span></button>
<button type="button" class="btn btn-success rounded-pill btn-sm success-btn" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Green</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Other</span></button>
<button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Unknown</span></button>
<div class="mt-3 errorInLabellingAgent"><span style="margin-right:10px;">Error in agent's labelling</span><input type="checkbox" onClick="toggleErrorInAgent(this)"></div></div>`

var agentHTML = ""

const divisionThresholdsX = {
    "firstDivision" : 1,
    "secondDivision" : 20,
    "thirdDivision" : 90,
    "fourthDivision": 160,
    "fifthDivision" : 250
}

const divisionThresholdsY = {
    "firstDivision" : 1,
    "secondDivision" : 5,
    "thirdDivision" : 15,
    "fourthDivision": 50,
    "fifthDivision" : 100
}

const avoidVehicles = [
    "buggy ",
    "motorbike ",
    "scooter ", 
    "tricycle ",
    "cycle.without_rider",
    "vehicle.moving",
    "vehicle.parked",
    "vehicle.stopped",
    "vehicle_light.emergency.flashing",
    "vehicle_light.emergency.not_flashing",
    "vehicle.bicycle",
    "vehicle.bus.bendy",
    "vehicle.bus.rigid",
    "vehicle.car",
    "vehicle.construction",
    "vehicle.emergency.ambulance",
    "vehicle.emergency.police",
    "vehicle.motorcycle",
    "vehicle.trailer",
    "vehicle.truck",
    "car", 
    "van", 
    "truck",
    "tram",
    "bus",
    "train",
    "motorcycle",
    "bike",
    "motor"
]

const avoidPersons = [
    "pedestrian",
    "rider",
    "sitting person",
    "bicycle ",
    "wheelchair ",
    "cycle.with_rider",
    "human.pedestrian.adult",
    "human.pedestrian.child",
    "human.pedestrian.construction_worker",
    "human.pedestrian.personal_mobility",
    "human.pedestrian.police_officer",
    "human.pedestrian.stroller",
    "human.pedestrian.wheelchair",
    "cyclist",
    "person_sitting",
    "person"
]

const commonToAvoid = [
    "ignore",
    "bicycle-group",
    "buggy-group", 
    "motorbike-group", 
    "scooter-group", 
    "tricycle-group", 
    "wheelchair-group",
    "person-group-far-away",
    "animal",
    "vertical_position.off_ground",
    "vertical_position.on_ground",
    "movable_object.barrier",
    "movable_object.debris",
    "movable_object.pushable_pullable",
    "movable_object.trafficcone",
    "static_object.bicycle_rack",
    "flat.drivable_surface",
    "flat.ego",
    "misc", 
    "dontcare",
    "traffic light",
    "traffic sign"
]

var identitiesToAvoid = []

function collapseAllButThis(element){
    var listOfCollapsableElems = [];

    $("#agentsTabs > button").each((index, elem) => {//Do not remove "index" even if unused, o.w. listOfCollapsableElems will be filled with undefineds
        listOfCollapsableElems.push(elem.id.replace("agent-tab-", "floating-window-"));
    });

    for(i = 0; i < listOfCollapsableElems.length; i++){
        if(listOfCollapsableElems[i] != element){//Hidding non-selected agent tabs's floating windows
            var elementById = document.getElementById(listOfCollapsableElems[i]);
            elementById.style.visibility = "hidden";
            var agentIndex = i + 1;
            document.getElementById('agent-tab-' + agentIndex).classList.remove('active');
        }
    }
}

async function loadJSONData(file){
    var jsonObj = {};

    await fetch('/img_json/' + selectedDataset + '/' + file)//request for JSON data to flask server
        .then(function (response) {
            return response.json();
            }).then(function (elem) {
                jsonObj = elem;
            });

    return jsonObj;
}

function loadCanvas(canvasElem){
    var canvas = canvasElem,
    context = canvas.getContext('2d');
    img = new Image();
    img.onload = function(){
        drawImgCanvas(context, img, canvasElem)
    }

    document.getElementById("canvasContainer").style.height = canvasHeight + "px"
    img.width = canvasWidth;
    img.height = canvasHeight;
    img.src = imgData.src;//src is specified later so that the browser does not use cached image
    imgData.img = img;
    document.getElementById("img-name-title").innerText = imgData.imgName;
}

function drawRect(context, agent, rectColor, linewidth){
    var bBoxValues = getAgentbBoxValues(agent);
    var x = bBoxValues.x/datasetSpecificFeatures.imgWidth*canvasWidth;
    var y = bBoxValues.y/datasetSpecificFeatures.imgHeight*canvasHeight;
    var bBoxWidth = bBoxValues.w/datasetSpecificFeatures.imgWidth*canvasWidth;
    var bBoxHeight = bBoxValues.h/datasetSpecificFeatures.imgHeight*canvasHeight;
    context.strokeStyle = rectColor;
    context.lineWidth = linewidth;
    context.strokeRect(x, y, bBoxWidth, bBoxHeight);
}

function getAgentbBoxValues(agentInfo){
    var agentbBoxValues = new Object();

    //Getting agent's bBox coordinates
    agentbBoxValues.x = agentInfo.x0;
    agentbBoxValues.y = agentInfo.y0;
    agentbBoxValues.w = agentInfo.x1 - agentInfo.x0;
    agentbBoxValues.h = agentInfo.y1 - agentInfo.y0;

    return agentbBoxValues;
}

function drawImgCanvas(context, img, canvasElem){
    context.clearRect(0,0,canvasElem.width, canvasElem.height);
    context.globalAlpha = 1;
    canvasElem.width = img.width;
    canvasElem.height = img.height;
    context.drawImage(img, 0, 0, canvasElem.width, canvasElem.height);
    var agentsKeys;
    agentsKeys = Object.keys(datasetSpecificFeatures.agents);

    for(i = 0; i < agentsKeys.length; i++){
        var agent = agentsKeys[i];
        var isRealAgent = getAgentAutenticity(agent, false);

        if(isRealAgent){
            drawRect(context, datasetSpecificFeatures.agents[agent], "red", 2);

            //Agents might be riders, and their vehicle bounding box is provided as subchild (Only for Eurocity Persons dataset)
            if(datasetSpecificFeatures.agents[agent].sub_entities.length != 0){
                for(k = 0; k < datasetSpecificFeatures.agents[agent].sub_entities.length; k++){
                    drawRect(context, datasetSpecificFeatures.agents[agent].sub_entities[k], "green", 2);
                }
            }
        }
    }

    var groupsKeys = Object.keys(groupsInPicture);
    for(i = 0; i < groupsKeys.length; i++){
        var key = groupsKeys[i];
        if(Object.keys(groupsInPicture[key]).length > 1){//If there is more than one agent in the group (i.e. it is a group)
            var agents = Object.entries(groupsInPicture[key]);
            var minMax = {
                "minX" : canvasWidth,
                "minY" : canvasHeight,
                "maxX" : 0,
                "maxY" : 0
            }
            agents.forEach(agent => minMax = getMinMax(agent, minMax));
            context.strokeStyle = "blue";
            context.lineWidth = 2;
            context.strokeRect(minMax.minX, minMax.minY, minMax.maxX - minMax.minX, minMax.maxY - minMax.minY);
        }
    }
}

//Getting left top corner and right bottom corner of the group's bBox
function getMinMax(agent, minMax){
    minMax.minX = agent[1].xInit < minMax.minX ? agent[1].xInit : minMax.minX;
    minMax.minY = agent[1].yInit < minMax.minY ? agent[1].yInit : minMax.minY;
    minMax.maxX = agent[1].xRight > minMax.maxX ? agent[1].xRight : minMax.maxX;
    minMax.maxY = agent[1].yBottom > minMax.maxY ? agent[1].yBottom : minMax.maxY;

    return minMax;
}

//Load function for agents info
function loadAgentsInfo(agents){
    var agentsBodies = [];
    var agentIndex = 0;

    for(i = 0; i < Object.keys(agents).length; i++){
        var agentBody = document.createElement("div");
        var agent = Object.keys(agents)[i];
        var identity = agents[agent].identity;
        var bBoxArea = getbBoxArea(agents[agent]);
        var subentitiesText = "";
        minbBoxArea = selectedDatasetType == "persons" ? 6000 : 8000;

        if(!identitiesToAvoid.includes(identity.toLowerCase()) && bBoxArea >= minbBoxArea){//Identities to avoid are scooters, bikes,...
            agentIndex += 1;
            var group = getPeopleGroup(agentIndex, agents[agent].x0, agents[agent].y0, agents[agent].x1, agents[agent].y1);
            agentBody.className = "agent-body";
            agentBody.innerHTML = getAgentInnerHTML(agentIndex, identity);

            for(k = 0; k < datasetSpecificFeatures.agents[agent].sub_entities.length; k++){
                identity = datasetSpecificFeatures.agents[agent].sub_entities[k].identity;
                if(k == 0){
                    subentitiesText += '<div class="mb-0 mt-3"><span>Sub-entities</span><br/>';
                }
                subEntNum = k + 1;
                subentitiesText += `<div id="subentity" class="border border-primary rounded mb-2" style="padding:10px;">
                <div class="sub-entity mb-0"><span>Sub-entity ` + subEntNum + `</span><br/>
                <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button"><span class="font-weight-bold">` + identity + `</span></button>`
                if(identity == "co-rider"){
                    subentitiesText += pedestrianHTML;
                }
                else{
                    subentitiesText += `<div id="subentity-color" class="mb-0 mt-3"><span>Color</span><br/> 
                    <button type="button" class="btn btn-dark rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Black</span></button>
                    <button type="button" class="btn btn-light rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">White</span></button>
                    <button type="button" class="btn btn-secondary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Grey</span></button>
                    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Blue</span></button>
                    <button type="button" class="btn btn-danger rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Red</span></button>
                    <button type="button" class="btn btn-warning rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Yellow</span></button>
                    <button type="button" class="btn btn-success rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Green</span></button>
                    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Other</span></button>
                    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Unknown</span></button></div>
                    </div></div>`;
                }
            }
            agentBody.innerHTML += subentitiesText;

            agentsBodies.push(agentBody);
        }
    }

    setAvailableGroupsList(groupsInPicture);

    return agentsBodies;
}

function setAvailableGroupsList(groupsInPicture){
    var groups = Object.entries(groupsInPicture);
    document.getElementById('groupsList').innerHTML = "Available groups:&nbsp;&nbsp";
    groups.forEach(group => addGroupTag(group[0]));
    if($('#groupsList > button').length == 0){
        document.getElementById('groupsList').innerHTML = "Available groups: None";
    }
}

function addGroupTag(group){
    if(Object.keys(groupsInPicture[group]).length > 1){
        var availableGroups = document.getElementById('groupsList');
        var groupTag = document.createElement("button");
        groupTag.type = "button";
        groupTag.id = "group-btn-" + group;
        groupTag.className = "btn btn-primary rounded-pill btn-sm group-btn";
        groupTag.style = "width: auto; margin-right: 5px";
        groupTag.innerHTML = "<span class='font-weight-bold'>Group " + group + "</span>";
        groupTag.setAttribute("onmouseover", "showGroup(" + group + ")");
        groupTag.setAttribute("onClick", "removeGroup(" + group + ")");
        availableGroups.appendChild(groupTag);
    }
}

function removeGroup(groupNumber){
    var groupTag = document.getElementById('group-btn-' + groupNumber);
    groupTag.parentNode.removeChild(groupTag);
    if($('#groupsList > button').length == 0){
        document.getElementById('groupsList').innerHTML = "Available groups: None";
    }

    var agents = Object.keys(groupsInPicture[groupNumber]);
    for(j = 0; j < agents.length; j++){
        var agent = agents[j];
        var joinButton = document.getElementById('join-agent-btn-' + agent.replace('agent_', ''));
        joinButton.classList.remove('disabled');
        var currentTagToRemove = $(agent.replace('agent_', '#current-labels-')).find("button")[1];//Group tag is element 1
        if(Object.keys(groupsInPicture[groupNumber]).length > 1){
            removeAutomaticTag(currentTagToRemove, true);
        }
    }
}

function showGroup(groupNumber){
    var canvasSpecs = setCanvasSpecs();
    var agents = Object.entries(groupsInPicture[groupNumber]);
    var minMax = {
        "minX" : canvasWidth,
        "minY" : canvasHeight,
        "maxX" : 0,
        "maxY" : 0
    }
    agents.forEach(agent => minMax = getMinMax(agent, minMax));
    highlightRect(canvasSpecs.context, minMax.minX, minMax.minY, minMax.maxX - minMax.minX, minMax.maxY - minMax.minY);
}

function getAgentsInGroup(group){
    var numberOfAgentsInGroup = Object.keys(groupsInPicture[group]).length;

    return numberOfAgentsInGroup;
}

function getAgentInnerHTML(i, currentClass){
    var innerHTML = `<div id="current-labels-` + i + `" class="mb-0"><span>Current label</span><br/>
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button"><span class="font-weight-bold">` + currentClass + `</span></button></div>`+
    agentHTML;
    
    if(selectedDatasetType == "persons"){
        innerHTML += `<div class="mb-0 mt-4"><div class="col col-lg-6 join-agent"><button id="join-agent-btn-` + i + `" type="button" class="btn btn-primary rounded btn-sm" style="width:10vw;" data-toggle="modal" onClick="showGroupAssignationPopup(` + i + `)" data-target="#assignGroupPopup" title="Click to assign a group">
        <span class="font-weight-bold">Join to agent/group</span></button></div></div>`;
    }
    else{
        if(currentClass.toLowerCase().indexOf("car") != -1){
            innerHTML += `<div class="mb-0 mt-2"><span data-elem-name="car-type">Car type</span><br/>
            <img id="car-preview-` + i + `" class="hide-preview" src="" style="width: 100%; margin-top: -102px; height:100px;">
            <div id="spacer-` + i + `" style="height: 22.6px"></div>
            <button type="button" class="btn btn-primary rounded-pill btn-sm btn-sedan" data-bs-toggle="button" onClick="toggleTag(this)" onmouseover="$('#car-preview-` + i + `').attr('src', '../static/small-car.png');$('#car-preview-` + i + `').removeClass('hide-preview');$('#spacer-` + i +`').hide(0)" onmouseout="$('#car-preview-` + i + `').addClass('hide-preview');$('#spacer-` + i +`').show(0)"><span class="font-weight-bold">Small (Compact/Micro/Hatchback)</span></button>
            <button type="button" class="btn btn-primary rounded-pill btn-sm btn-wagon" data-bs-toggle="button" onClick="toggleTag(this)" onmouseover="$('#car-preview-` + i + `').attr('src', '../static/medium-car.png');$('#car-preview-` + i + `').removeClass('hide-preview');$('#spacer-` + i +`').hide(0)" onmouseout="$('#car-preview-` + i + `').addClass('hide-preview');$('#spacer-` + i +`').show(0)"><span class="font-weight-bold">Medium (Sedan/Coupe/Sport/Mid size/Wagon)</span></button>
            <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)" onmouseover="$('#car-preview-` + i + `').attr('src', '../static/large-car.png');$('#car-preview-` + i + `').removeClass('hide-preview');$('#spacer-` + i +`').hide(0)" onmouseout="$('#car-preview-` + i + `').addClass('hide-preview');$('#spacer-` + i +`').show(0)"><span class="font-weight-bold">Large (SUV/Crossover)</span></button>
            <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)" onmouseover="$('#car-preview-` + i + `').attr('src', '../static/pickup-car.png');$('#car-preview-` + i + `').removeClass('hide-preview');$('#spacer-` + i +`').hide(0)" onmouseout="$('#car-preview-` + i + `').addClass('hide-preview');$('#spacer-` + i +`').show(0)"><span class="font-weight-bold">Pickup</span></button>
            <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)" onmouseover="$('#car-preview-` + i + `').attr('src', '../static/convertible-car.png');$('#car-preview-` + i + `').removeClass('hide-preview');$('#spacer-` + i +`').hide(0)" onmouseout="$('#car-preview-` + i + `').addClass('hide-preview');$('#spacer-` + i +`').show(0)"><span class="font-weight-bold">Convertible / Cabriolet</span></button>
            <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Others (Off-roader/Camping van/Limousine/etc.)</span></button>
            <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Unknown</span></button></div>`
        }
    }
    
    return innerHTML;
}

//Shows apopup where the user can assign the agent to a group or join two independent agents
function showGroupAssignationPopup(agentNumber){
    var popupBody = document.getElementById('assignGroupPopup-body');
    var saveChangesButton = document.getElementById('saveChanges-btn');
    popupBody.innerHTML = "";
    var agentsDropdown = document.createElement('div');
    var selectObject = document.createElement('select');
    var defaultOption = document.createElement('option');
    
    agentsDropdown.className = "custom-select";
    selectObject.id = "agentsSelect";
    selectObject.className = "rounded mt-3";
    defaultOption.value = "none";
    defaultOption.innerText = "Select agent to join";

    selectObject.appendChild(defaultOption);
    var groupsKeys = Object.keys(groupsInPicture);
    for(i = 0; i < groupsKeys.length; i++){
        var key = groupsKeys[i]
        for(j = 0; j < Object.keys(groupsInPicture[key]).length; j++){
            var agNum = parseInt(Object.keys(groupsInPicture[key])[j].replace("agent_", ""));
            if(agentNumber != agNum){
                var newOption = document.createElement('option');
                newOption.value = Object.keys(groupsInPicture[key])[j].replace("agent_", "Agent ");
                newOption.innerText = Object.keys(groupsInPicture[key])[j].replace("agent_", "Agent ");
                if(Object.keys(groupsInPicture[key]).length > 1){
                    newOption.innerText += " (Group " + key + ")";
                }
                selectObject.appendChild(newOption);
            }
        }
    }
    saveChangesButton.setAttribute("onclick", "addAgentToGroup('agentsSelect', " + agentNumber + ")")
    agentsDropdown.appendChild(selectObject);    
    popupBody.appendChild(agentsDropdown);
}

function addAgentToGroup(selectObject, agentNumber){
    var selectBox = document.getElementById(selectObject);
    var selectedAgent = selectBox.options[selectBox.selectedIndex].value;
    selectedAgent = selectedAgent.replace("Agent ", "agent_");

    var agentToChange = "agent_" + agentNumber;
    var groupsKeys = Object.keys(groupsInPicture);
    var xInit, yInit, xRight, yBottom;
    for(i = 0; i < groupsKeys.length; i++){
        var key = groupsKeys[i];
        if(agentToChange in groupsInPicture[key]){
            xInit = groupsInPicture[key][agentToChange].xInit;
            yInit = groupsInPicture[key][agentToChange].yInit;
            xRight = groupsInPicture[key][agentToChange].xRight;
            yBottom = groupsInPicture[key][agentToChange].yBottom;
            delete groupsInPicture[key][agentToChange];

            if(Object.keys(groupsInPicture[key]).length == 0){
                delete groupsInPicture[key];
                groupsKeys = Object.keys(groupsInPicture);
            }
            break;
        }
    }

    var newGroup;
    for(i = 0; i < groupsKeys.length; i++){
        var key = groupsKeys[i];
        if(selectedAgent in groupsInPicture[key]){
            newGroup = key;
            groupsInPicture[key][agentToChange] = new Object();
            groupsInPicture[key][agentToChange].xInit = xInit;
            groupsInPicture[key][agentToChange].yInit = yInit;
            groupsInPicture[key][agentToChange].xRight = xRight;
            groupsInPicture[key][agentToChange].yBottom = yBottom;
            break;
        }
    }
    drawImgCanvas(canvasElem.getContext("2d"), imgData.img, canvasElem);
    if(document.getElementById('group-btn-' + newGroup) == null){
        document.getElementById('groupsList').innerHTML = "Available groups:&nbsp;&nbsp";
        addGroupTag(newGroup);
    }
    addGroupButtonToAgent();
}

function getPeopleGroup(agentNumber, xInit, yInit, xRight, yBottom){//x1 and x2 to measure x middle point and y2 to get bbox bottom
    var groupOfAgent;
    var adaptedXs = new Object();
    adaptedXs.xInit = (xInit/datasetSpecificFeatures.imgWidth) * canvasWidth;
    adaptedXs.xRight = (xRight/datasetSpecificFeatures.imgWidth) * canvasWidth;
    var adaptedYs = new Object();
    adaptedYs.yInit = (yInit/datasetSpecificFeatures.imgHeight) * canvasHeight;
    adaptedYs.yBottom = (yBottom/datasetSpecificFeatures.imgHeight) * canvasHeight;
    var bBoxDivisionAssignment = getPictureDivision(adaptedYs.yBottom);
    var yAxisThreshold = divisionThresholdsY[bBoxDivisionAssignment.y + "Division"];//Depending on the y position of the agent we can guess if it is a group
    var xAxisThreshold = divisionThresholdsX[bBoxDivisionAssignment.y + "Division"];
    var groupsKeys = Object.keys(groupsInPicture);
    var createNewGroup = false;
    var currentAgent = "agent_" + agentNumber;

    for(t = 0; t < groupsKeys.length; t++){
        var group = groupsKeys[t]; 
        var agentsInGroup = Object.keys(groupsInPicture[group]);
        var breakLoop = false;
        for(k = 0; k < agentsInGroup.length; k++){
            var agent = agentsInGroup[k];
            if(Math.abs(adaptedXs.xRight - groupsInPicture[group][agent].xRight) < xAxisThreshold && 
                    Math.abs(adaptedYs.yBottom - groupsInPicture[group][agent].yBottom) < yAxisThreshold){
                groupOfAgent = group;
                groupsInPicture[group][currentAgent] = new Object();
                groupsInPicture[group][currentAgent].xInit = adaptedXs.xInit;//First agent in group defines group position
                groupsInPicture[group][currentAgent].yInit = adaptedYs.yInit;
                groupsInPicture[group][currentAgent].xRight = adaptedXs.xRight;
                groupsInPicture[group][currentAgent].yBottom = adaptedYs.yBottom;
                createNewGroup = false;
                breakLoop = true;
            }    
        }

        if(breakLoop){
            break;
        }
        else{
            createNewGroup = true;
        }
    }

    if((createNewGroup || groupsKeys.length == 0) && selectedDatasetType == "persons"){
        groupsInPicture[groupsKeys.length] = new Object();
        groupsInPicture[groupsKeys.length][currentAgent] = new Object();
        groupsInPicture[groupsKeys.length][currentAgent].xInit = adaptedXs.xInit;//First agent in group defines group position
        groupsInPicture[groupsKeys.length][currentAgent].yInit = adaptedYs.yInit;
        groupsInPicture[groupsKeys.length][currentAgent].xRight = adaptedXs.xRight;
        groupsInPicture[groupsKeys.length][currentAgent].yBottom = adaptedYs.yBottom;
        groupOfAgent = Object.keys(groupsInPicture)[groupsKeys.length];
    }

    return groupOfAgent;
}

function getPictureDivision(y){
    var pictureDivision = new Object();

    const heightDivisionLength = canvasHeight/5;//Length of each height division of the image in pixels (5 divisions)
    const heightDivisions = {
        "first" : heightDivisionLength,
        "second" : 2*heightDivisionLength,
        "third" : 3*heightDivisionLength,
        "fourth" : 4*heightDivisionLength,
        "fifth" : 5*heightDivisionLength
    }

    var heightDivisionsKeys = Object.keys(heightDivisions);
    for(j = 0; j < heightDivisionsKeys.length; j++){
        var heightDivision = heightDivisionsKeys[j];
        if(y < heightDivisions[heightDivision]){
            pictureDivision.y = heightDivision;
            break;
        }
    }

    return pictureDivision;
}

function changeImagePtgAnnotated(){
    var percentageElem = document.getElementById('ptg-annotated');
    percentageElem.innerHTML = percentageImageAnnotated + "%";
    percentageElem.parentElement.style.width = percentageImageAnnotated + "%";
}

function toggleErrorInAgent(element){
    var currentAgent = element.closest(".container").firstElementChild.id.replace("current-labels-", "Agent ");//Get agent name
    if(element.checked){
        newAgentsLabels[currentAgent]["error_labelling_agent"] = "true";
    }
    else{
        delete newAgentsLabels[currentAgent]["error_labelling_agent"];
    }
}

function toggleTag(element, addConfCaseTag = false, isConfCase = false){
    var elementParentChildren = element.parentElement.children;
    for(i = 2; i < elementParentChildren.length; i++){//first two elements are not buttons
        if(i == 2 && elementParentChildren[0].dataset["elemName"] == "car-type"){//On first iteration of "Car Type" tooltip and spacer must be avoided
            i += 2;
        }

        if(elementParentChildren[i].classList.contains("tag-pressed")){
            globalNumberOfTagsPressed -= 1;
            elementParentChildren[i].classList.remove("tag-pressed");
        }
        if(elementParentChildren[i].classList.contains("btn-dark-skin")){
            elementParentChildren[i].classList.add("btn-dark-skin-tone");
        }
        else if(elementParentChildren[i].classList.contains("btn-light-skin")){
            elementParentChildren[i].classList.add("btn-light-skin-tone");
        }
        else if(elementParentChildren[i].classList.contains("dark-btn")){
            elementParentChildren[i].classList.add("btn-dark");
        }
        else if(elementParentChildren[i].classList.contains("light-btn")){
            elementParentChildren[i].classList.add("btn-light");
        }
        else if(elementParentChildren[i].classList.contains("secondary-btn")){
            elementParentChildren[i].classList.add("btn-secondary");
        }
        else if(elementParentChildren[i].classList.contains("primary-btn")){
            elementParentChildren[i].classList.add("btn-primary");
        }
        else if(elementParentChildren[i].classList.contains("danger-btn")){
            elementParentChildren[i].classList.add("btn-danger");
        }
        else if(elementParentChildren[i].classList.contains("warning-btn")){
            elementParentChildren[i].classList.add("btn-warning");
        }
        else if(elementParentChildren[i].classList.contains("success-btn")){
            elementParentChildren[i].classList.add("btn-success");
        }
        else{
            if(element.tagName.toLowerCase() == "button" && !elementParentChildren[i].classList.contains("errorInLabellingAgent")){
                elementParentChildren[i].classList.add("btn-primary");
            }
            else if(!elementParentChildren[i].classList.contains("errorInLabellingAgent")){
                element.style.color = "#0b5ed7"
            }
        }
    }
    if(element.classList.contains("btn-dark-skin")){
        element.classList.remove("btn-dark-skin-tone");
    }
    else if(element.classList.contains("btn-light-skin")){
        element.classList.remove("btn-light-skin-tone");
    }
    else if(element.classList.contains("dark-btn")){
        element.classList.remove("btn-dark");
    }
    else if(element.classList.contains("light-btn")){
        element.classList.remove("btn-light");
    }
    else if(element.classList.contains("secondary-btn")){
        element.classList.remove("btn-secondary");
    }
    else if(element.classList.contains("primary-btn")){
        element.classList.remove("btn-primary");
    }
    else if(element.classList.contains("danger-btn")){
        element.classList.remove("btn-danger");
    }
    else if(element.classList.contains("warning-btn")){
        element.classList.remove("btn-warning");
    }
    else if(element.classList.contains("success-btn")){
        element.classList.remove("btn-success");
    }
    else{
        if(element.tagName.toLowerCase() == "button"){
            element.classList.remove("btn-primary");
        }
        else{
            element.style.color = "#0b5ed7"
        }
    }
    if(element.tagName.toLowerCase() == "button"){
        element.classList.add("tag-pressed");
    }
    else{
        element.classList.add("icon-pressed");
    }
    globalNumberOfTagsPressed += 1;
    percentageImageAnnotated = ((globalNumberOfTagsPressed/numberOfTagsToPressInImage) * 100).toFixed();
    changeImagePtgAnnotated();

    var currentAgent = element.closest(".container").firstElementChild.id.replace("current-labels-", "Agent ");//Get agent name
    var category = element.parentElement.firstElementChild.innerText;//Get label category
    var labelValue = ""
    
    if(element.tagName.toLowerCase() == "button"){
        labelValue = element.innerText;//Get label value
        if(addConfCaseTag){
            labelValue += isConfCase ? "(C)" : "(NC)";
        }
    }
    else{
        labelValue = element.dataset["vehicleType"];
    }

    if(element.closest("#subentity") != null){//If the label comes from a subentity, agent's children dictionary has to be edited
        var subEnt = element.closest("#subentity").children[0].firstChild.innerText.toLowerCase();
        if(newAgentsLabels[currentAgent]["sub_entities"][subEnt] == undefined){
            newAgentsLabels[currentAgent]["sub_entities"][subEnt] = new Object();
        }
        newAgentsLabels[currentAgent]["sub_entities"][subEnt][category.toLowerCase()] = labelValue.toLowerCase();
    }
    else{
        newAgentsLabels[currentAgent][category.toLowerCase()] = labelValue.toLowerCase();
    }
}

function displayConfCasePopup(element){
    var popup = $(element).next();
    popup.css("display", "block");
}

function setConflictingState(element, isConfCase){
    var unknownBtn = element.parentElement.parentElement.previousElementSibling;
    $(element.parentElement.parentElement).css("display", "none");
    toggleTag(unknownBtn, true, isConfCase);
}

function loadAgents(){
    var agentsTabs = document.getElementById("agentsTabs");
    $(agentsTabs).empty();
    var agentIndex = 0;

    for(i = 0; i < datasetSpecificFeatures.agents.length; i++){
        var agent = Object.keys(datasetSpecificFeatures.agents)[i];
        var isRealAgent = getAgentAutenticity(agent, true);//Check if it is a real agent or not
        if(isRealAgent){
            agentIndex += 1;
            var agentButton = document.createElement('button');

            agentButton.id = "agent-tab-" + agentIndex;
            agentButton.className = "tablinks";
            agentButton.innerText = "Agent " + agentIndex;
            agentButton.setAttribute("onclick", "displayFloatingInfo(" + agentIndex + "); selectAgentInCanvas(" + agentIndex + ");")

            agentsTabs.appendChild(agentButton);

            createFloatingWindow(datasetSpecificFeatures.agentsBodies[agentIndex - 1].innerHTML, agent, agentIndex);

            //Initializing newAgentsLabels to be used in toggleTag() method
            newAgentsLabels["Agent " + agentIndex] = new Object();
            newAgentsLabels["Agent " + agentIndex]["sub_entities"] = new Object();
        }
    }

    var floatingWindowHeight = 617;
    if(selectedDataset == "kitti"){
        floatingWindowHeight = 335;
    }
    var elements = document.querySelectorAll('.floating-window-container');
    for(var i=0; i<elements.length; i++){
        elements[i].style.height = floatingWindowHeight + "px";
    }

    numberOfTagsToPressInImage = getNumberOfTagsTopress(datasetSpecificFeatures.agents.length);
    percentageImageAnnotated = 0;
    globalNumberOfTagsPressed = 0;
    changeImagePtgAnnotated();

    addGroupButtonToAgent();
}

function addGroupButtonToAgent(){
    var groupsKeys = Object.keys(groupsInPicture);
    for(j = 0; j < groupsKeys.length; j++){
        var key = groupsKeys[j];
        var numberOfAgentsInGroup = getAgentsInGroup(key);

        if(numberOfAgentsInGroup > 1){
            var agentsInGroup = Object.keys(groupsInPicture[key]);
            for(k = 0; k < agentsInGroup.length; k++){
                var agentNumber = agentsInGroup[k].replace("agent_", "");
                var cardBody = document.getElementById("current-labels-" + agentNumber);
                if($("#current-labels-" + agentNumber).find('button').length == 1){
                    var joinButton = document.getElementById('join-agent-btn-' + agentNumber);
                    joinButton.classList.add('disabled');
                    var button = document.createElement("button");
                    button.type = "button";
                    button.className = "btn btn-primary rounded-pill btn-sm group-btn";
                    button.innerHTML = "<span class='font-weight-bold'>Group " + groupsKeys[j] + "</span>";
                    button.setAttribute("onclick", "removeAutomaticTag(this, false)");
                    cardBody.appendChild(button);
                }
            }
        }
    }
}

function removeAutomaticTag(element, removeGroup){
    var agent = element.parentElement.id.replace("current-labels-", "agent_");
    var groupsKeys = Object.keys(groupsInPicture);
    for(i = 0; i < groupsKeys.length; i++){
        var key = groupsKeys[i];
        if(agent in groupsInPicture[key]){
            var xInit = groupsInPicture[key][agent].xInit;
            var yInit = groupsInPicture[key][agent].yInit;
            var xRight = groupsInPicture[key][agent].xRight;
            var yBottom = groupsInPicture[key][agent].yBottom;
            delete groupsInPicture[key][agent];
            var joinButton = document.getElementById('join-agent-btn-' + agent.replace('agent_', ''));
            joinButton.classList.remove('disabled');
            var agents = Object.keys(groupsInPicture[key]);

            if(agents.length == 1){//Only 1 agent left in group
                var lastAgentGroupButton =  $(agents[0].replace("agent_", "#current-labels-")).find('button')[1];//Element 1 is the group button
                lastAgentGroupButton.parentNode.removeChild(lastAgentGroupButton);//Removing group tag from agent
                if(!removeGroup){
                    var availableGroupsTag = document.getElementById('group-btn-' + key);
                    availableGroupsTag.parentNode.removeChild(availableGroupsTag);//Removing group tag from available groups
                }
            }

            //Assign the agent to a new group
            groupsInPicture[groupsKeys.length + 1] = new Object();
            groupsKeys = Object.keys(groupsInPicture);
            groupsInPicture[groupsKeys.length][agent] = new Object();
            groupsInPicture[groupsKeys.length][agent].xInit = xInit;
            groupsInPicture[groupsKeys.length][agent].yInit = yInit;
            groupsInPicture[groupsKeys.length][agent].xRight = xRight;
            groupsInPicture[groupsKeys.length][agent].yBottom = yBottom;
            break;
        }
    }
    element.parentNode.removeChild(element);//Remove group tag
    drawImgCanvas(canvasElem.getContext("2d"), imgData.img, canvasElem);
}

function selectAgentInCanvas(visibleAgentsIndex){
    var canvasSpecs = setCanvasSpecs();
    correctionIndex = 0;

    for(i = 0; i < Object.keys(datasetSpecificFeatures.agents).length; i++){
        var agent = Object.keys(datasetSpecificFeatures.agents)[i];
        var bBoxValues = getAgentbBoxValues(datasetSpecificFeatures.agents[agent]);
        var isRealAgent = getAgentAutenticity(agent, true);//Check if it is a real agent or not

        if(isRealAgent && visibleAgentsIndex == i + 1 - correctionIndex){
            highlightRect(canvasSpecs.context, bBoxValues.x*canvasSpecs.percentageOfReductionWidth, bBoxValues.y*canvasSpecs.percentageOfReductionHeight, 
                bBoxValues.w*canvasSpecs.percentageOfReductionWidth, bBoxValues.h*canvasSpecs.percentageOfReductionHeight);
        }
    }
    correctionIndex = 0;
}

function highlightRect(context, x, y, w, h){
    context.lineWidth = 1;
    context.strokeStyle = 'yellow';
    context.strokeRect(x, y, w, h);
}

function getbBoxArea(agentFeatures){
    var w = agentFeatures.x1 - agentFeatures.x0;
    var h = agentFeatures.y1 - agentFeatures.y0;
    var bBoxArea = w*h;

    return bBoxArea;
}

function getAgentAutenticity(agent, updateCorrectionIndex){
    var isRealAgent = true;
    minbBoxArea = selectedDatasetType == "persons" ? 6000 : 8000
    var bBoxArea = getbBoxArea(datasetSpecificFeatures.agents[agent]);
    if(identitiesToAvoid.includes(datasetSpecificFeatures.agents[agent].identity.toLowerCase()) || bBoxArea < minbBoxArea){
        isRealAgent = false;
        correctionIndex = updateCorrectionIndex ? correctionIndex + 1 : correctionIndex;//If an agent is skipped, it must be taken into account
    }

    return isRealAgent;
}

function setCanvasSpecs(){
    var canvasSpecs = new Object();
    canvasSpecs.context = canvasElem.getContext("2d");

    //Next condition resets the image in the canvas removing highlight from agents
    if(!firstDraw){
        drawImgCanvas(canvasSpecs.context, imgData.img, canvasElem);
    }
    else{
        firstDraw = false;
    }

    //Percentages of reduction are needed since image dimensions and canvas dimensions do not match
    canvasSpecs.percentageOfReductionWidth = canvasWidth/datasetSpecificFeatures.imgWidth;
    canvasSpecs.percentageOfReductionHeight = canvasHeight/datasetSpecificFeatures.imgHeight;

    return canvasSpecs;
}

function getAgentToDeploy(relX, relY){
    var agentToDeploy = 0;
    var canvasSpecs = setCanvasSpecs();
    correctionIndex = 0;

    for(i = 0; i < Object.keys(datasetSpecificFeatures.agents).length; i++){
        var agent = Object.keys(datasetSpecificFeatures.agents)[i];
        var bBoxValues = getAgentbBoxValues(datasetSpecificFeatures.agents[agent]);
        var xCoordBottomRight = bBoxValues.x + bBoxValues.w;
        var yCoordBottomRight = bBoxValues.y + bBoxValues.h;
        var isRealAgent = getAgentAutenticity(agent, true);
        
        if(isRealAgent){
            //Check if click has been inside a bounding box
            if(relX > bBoxValues.x*canvasSpecs.percentageOfReductionWidth && relX < xCoordBottomRight*canvasSpecs.percentageOfReductionWidth && 
                relY > bBoxValues.y*canvasSpecs.percentageOfReductionHeight && relY < yCoordBottomRight*canvasSpecs.percentageOfReductionHeight){
                    highlightRect(canvasSpecs.context, bBoxValues.x*canvasSpecs.percentageOfReductionWidth, 
                        bBoxValues.y*canvasSpecs.percentageOfReductionHeight, bBoxValues.w*canvasSpecs.percentageOfReductionWidth, 
                        bBoxValues.h*canvasSpecs.percentageOfReductionHeight);
                    agentToDeploy = i + 1 - correctionIndex;
                    break;
            }
        }
    }
    correctionIndex = 0;

    return agentToDeploy;
}

async function saveCurrent(){
    var numberOfAgents = datasetSpecificFeatures.numberOfAgents;
    var index = 0;
    var newErrorInLabelling = false;

    //Edit each agent of the json object
    for (i = 0; i < numberOfAgents; i++){
        var isRealAgent = getAgentAutenticity(i, false);

        if(isRealAgent){
            index = index + 1;
            var groupTag = $('#current-labels-' + index + ' > button')[1];
            var assignedGroup = "";
            if(groupTag != undefined){
                assignedGroup = $('#current-labels-' + index + ' > button')[1].firstChild.innerHTML.toLowerCase();
            }
            else{
                assignedGroup = "none";
            }
            newAgentsLabels["Agent " + index]["group"] = assignedGroup;
            var currentAgentNewInfo = newAgentsLabels["Agent " + index];
            var agent = datasetSpecificFeatures.agents[i];
            
            var agentKeys = Object.keys(currentAgentNewInfo);
            allAttributesPresent = checkAllAttributesPresent(currentAgentNewInfo);
            if(!allAttributesPresent){break;}
            for(j = 0; j < agentKeys.length; j++){
                parserInfo = datasetJSONParse(i, j, agent, currentAgentNewInfo, agentKeys);
                agent = parserInfo.agent;//Copy info from new labels into the agent
            }

            datasetSpecificFeatures.agents[parserInfo.index] = agent;//Adding edited agents to img json
        }
    }

    if(allAttributesPresent){
        var agentsLabelled = isAgentCorrectlyLabelled(numberOfAgents);

        if(!agentsLabelled){
            alert("You need to label all the agents of the picture to load a new image");
            imageLabelled = false;
        }
        else{
            imageLabelled = true;
            var isErrorInLabelling = $('#errorInLabellingCheckbox').is(':checked');
            imgData.json["error_in_labelling"] = isErrorInLabelling;
            await saveEditedJson(imgData.json);
            $('#errorInLabellingCheckbox').prop('checked', false)
        }
    }
}

function checkAllAttributesPresent(agentNewInfo){
    var allAttributesPresent = false;
    var expectedAttributes = selectedDatasetType == 'persons' ? expectedAttributesPersons : expectedAttributesVehicles;
    for(eA = 0; eA < expectedAttributes.length; eA++){
        allAttributesPresent = agentNewInfo.hasOwnProperty(expectedAttributes[eA]) ? true : false;
        if(!allAttributesPresent){
            alert("Attribute '" + expectedAttributes[eA] + "' is missing for one of the agents. Please double check the annotation or reload the page to start over.")
            break;
        }
    }

    return allAttributesPresent
}

function datasetJSONParse(agentIndex, agentNewKeysIndex, agent, currentAgentNewInfo, agentKeys){
    var parserInfo = new Object();
    var isRealAgent = getAgentAutenticity(agentIndex, false);

    if(isRealAgent){
        parserInfo.index = agentIndex;
        //Copy info from new labels's children into the agent
        if(agentKeys[agentNewKeysIndex] == "sub_entities"){
            for(k = 0; k < agent["sub_entities"].length; k++){
                var subEnt = Object.keys(currentAgentNewInfo[agentKeys[agentNewKeysIndex]])[k]
                agent["sub_entities"][k]["attributes"] = currentAgentNewInfo[agentKeys[agentNewKeysIndex]][subEnt];
            }
        }
        else if(agentKeys[agentNewKeysIndex] != "sub_entities"){
            agent['attributes'][agentKeys[agentNewKeysIndex]] = currentAgentNewInfo[agentKeys[agentNewKeysIndex]]; 
        }
    }

    parserInfo.agent = agent;

    return parserInfo;
}

function getNumberOfTagsTopress(numberOfAgents){
    var numberOfTagsTopress = 0;
    var index = 1;
    for (i = 0; i < numberOfAgents; i++){
        var numberOfTagsTopressPerAgent = 0;
        var isRealAgent = getAgentAutenticity(i, false);
        if(isRealAgent){
            var query = $("#floating-window-" + index + " >> div");
            if(query.length > 0){
                //We don't take into account current labels (or "join to agent" button in persons datasets) 
                numberOfTagsTopressPerAgent = selectedDatasetType == 'persons' ? query.length - 2 : query.length - 1;
            }
            index += 1;
        }
        numberOfTagsTopress += numberOfTagsTopressPerAgent;
    }
    
    return numberOfTagsTopress;
}

async function isAgentCorrectlyLabelled(numberOfAgents){
    var agentsCorrectlyLabelled = 0;
    var realAgents = 0;
    for (i = 0; i < numberOfAgents; i++){
        var isRealAgent = getAgentAutenticity(i, false);
        var categoriesLabelled = 0;
        if(isRealAgent){
            realAgents +=1;
            var query = $("#floating-window-" + realAgents + " >> div");
            var numCategoriesAgent = query.length;
            for(j = 1; j < numCategoriesAgent - 1; j++){//We don't want the current labels nor the custom label form info
                if(!query[j].firstElementChild.classList.contains('join-agent')){
                    if(query[j].firstElementChild.innerHTML == "Sub-entities"){
                        var subentityChildren = $(query).find("#subentity")[0].children;
                        var numCategoriesSubEntity = subentityChildren.length;
                        for(k = 1; k < numCategoriesSubEntity; k++){//We don't want the current labels
                            //Look for pressed tags in sub-entity
                            agentsCorrectlyLabelled = $(subentityChildren[k]).find(".tag-pressed").length;

                            if(!agentsCorrectlyLabelled){//If one category is not labelled, agent is not correctly labelled
                                break;
                            }
                        }
                    }
                    else{
                        //Look for pressed tags in category
                        if($(query[j]).find(".tag-pressed").length == 1){
                            categoriesLabelled +=1;
                        }
                    }
                }
            }

            if(categoriesLabelled != numCategoriesAgent - 2){//If one category is not labelled, agent is not correctly labelled
                break;
            }
            else{
                agentsCorrectlyLabelled += 1;
            }
        }
    }
    
    correctlyLabelled = false;
    if(agentsCorrectlyLabelled == realAgents){
        correctlyLabelled = true
        await update_annotated_agents(agentsCorrectlyLabelled)
    }

    return correctlyLabelled;//return true if all real agents are correctly labelled
}

async function update_annotated_agents(num_agents){
    fetch('/update_annotated_agents/' + imgData.imgName + '/' + num_agents)
    .then(function (response){
        console.log(response.text());
    });
}

async function saveEditedJson(json){
    await fetch('/save_edited_json/' + imgData.imgName + '/' + selectedDatasetType + '/' + imgData.json["annotator"] + '/' + selectedDataset, {//Request to flask server to save new json
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
            json
        })
    }).then(function (response) { // At this point, Flask has printed our JSON
        return response.text();
    }).then(function (text) {
        console.log('POST response: ' + text);
    });
}

//Canvas is cleaned and redrawn
async function cleanAndDrawNew(){
    groupsInPicture = {};
    closeAllFloatingWindows();

    if(selectedDataset != "kitti"){//DS Kitti has a different aspect ratio and hence cannot be adapted to usual canvas
        canvasHeight = 654;  
    }
    else{
        canvasHeight = 370;
    }

    var autoDiscardImg = true;
    while(autoDiscardImg){
        await getRandomImageDataFromDataset();
        canvasElem = document.getElementById('imgToAnnotate');
        zoom = document.getElementById("zoomed-canvas");
        zoomCtx = zoom.getContext("2d");
        imgData.json["annotator"] = $("#userInfo").data('user')
        assignDatasetSpecificFeatures(imgData.json);
        autoDiscardImg = isDiscardableImg();
    }
    loadCanvas(canvasElem);
    loadAgents();
}

function isDiscardableImg(){
    var agentsKeys = Object.keys(datasetSpecificFeatures.agents);
    var realAgentsNum = 0;
    for(i = 0; i < agentsKeys.length; i++){
        var isRealAgent = getAgentAutenticity(i);
        if(isRealAgent){
            realAgentsNum +=1
            break;//No need to continue checking
        }
    }

    if(realAgentsNum > 0){
        return false;
    }
    else{
        discardImage('auto-discarded');
        return true;
    }
}

async function loadData(){
    await saveCurrent();
    if(imageLabelled){
        cleanAndDrawNew();
        imageLabelled = false;
    }
}

function displayMagnifyingGlass(currentElem, e, canvasElem, zoom, zoomCtx){
    var cursorX = e.pageX - $(currentElem).offset().left;//Page coordinates minus the offset of the canvas container
    var cursorY = e.pageY - $(currentElem).offset().top;
    var zoomFactor = magnifyingGlassZoomFactor;
    var w = zoom.offsetWidth / 2;
    var h = zoom.offsetHeight / 2;
    zoomCtx.fillStyle = "transparent";
    var glassDim = 150; //Square dimensions of the magnifying glass
    var glassCursorRepositioningFactor = glassDim/(2*zoomFactor);
    var glassCanvasWidth = canvasElem.height/zoomFactor;//current width of canvasElem divided by zoomFactor*canvas width/canvas height);
    var glassCanvasHeight = glassCanvasWidth;//Since the glass is a square canvas we use glassCanvasWidth
    zoomCtx.drawImage(canvasElem, cursorX-glassCursorRepositioningFactor, cursorY-glassCursorRepositioningFactor, glassCanvasWidth, glassCanvasHeight, 0, 0, canvasElem.width, canvasElem.height);
    zoom.style.top = cursorY - h + "px";//Relocation of the canvas to set the cursor in the center instead of in top left position
    zoom.style.left = cursorX - w + "px";
    zoom.style.display = "block";
}

function assignDatasetSpecificFeatures(jsonData){
    datasetSpecificFeatures.agents = jsonData.agents;
    datasetSpecificFeatures.numberOfAgents = jsonData.agents.length;
    datasetSpecificFeatures.imgWidth = jsonData.im_width;
    datasetSpecificFeatures.imgHeight = jsonData.im_height;
    datasetSpecificFeatures.agentsBodies = loadAgentsInfo(jsonData.agents);
}

async function selectDataset(ds, type){
    var selectBox = document.getElementById("selectBox");
    groupsInPicture = new Object();
    if(ds == ""){
        if(selectBox.options[selectBox.selectedIndex].value.indexOf("-persons") != -1){
            selectedDataset = selectBox.options[selectBox.selectedIndex].value.replace("-persons", "");
            type = "persons";
        }
        else if(selectBox.options[selectBox.selectedIndex].value.indexOf("-vehicles") != -1){
            selectedDataset = selectBox.options[selectBox.selectedIndex].value.replace("-vehicles", "");
            type = "vehicles";
        }
        else{
            selectedDataset = selectBox.options[selectBox.selectedIndex].value;
        }
    }
    else{
        selectedDataset = ds;
    }

    identitiesToAvoid = [];
    identitiesToAvoid = identitiesToAvoid.concat(commonToAvoid);
    selectedDatasetType = type;
    if(type == "persons"){
        identitiesToAvoid = identitiesToAvoid.concat(avoidVehicles);
        agentHTML = pedestrianHTML;
    }
    else if(type == "vehicles"){
        identitiesToAvoid = identitiesToAvoid.concat(avoidPersons);
        agentHTML = vehicleHTML;
    }

    await cleanAndDrawNew();

    $('#canvasContainer').css("visibility", "visible");
    $('#loadimage-btn').css("visibility", "visible");
    $('#discardimage-btn').css("visibility", "visible");
    if(selectedDatasetType == "persons"){
        $('#groupsList').css("visibility", "visible");
    }
    $('#errorInLabelling').css("visibility", "visible");
    $('#agentsTabs').css("visibility", "visible");
    $('.custom-select').css("visibility", "visible");
    $('.w3-container').css("visibility", "visible");
    $('#ptg-annotated-text').css("visibility", "visible");
    $('#img-name-title').css("visibility", "visible");
    $('#ds-buttons').css("visibility", "hidden");
}

function discardImage(discardAuthor){
    fetch('/discard-img/' + discardAuthor + '/' + selectedDatasetType + '/' + imgData.imgName)
        .then(function (response){
            console.log(response.text());
        });
}

async function getRandomImageDataFromDataset(){
    var imgName, imgSrc;
    /*INFO FETCHING CHANGES WHEN USING AWS INFRASTRUCTURE, AS FOLLOWS */
    /*await fetch('/img_url/' + selectedDataset + '/' + selectedDatasetType)//Request to flask server to retrieve a random image from storage
        .then(function (response) {
            return response.json();
            }).then(function (elem) {
                imgSrc = elem.img_url;
                imgName = elem.img_name;
            });*/

    await fetch('/img_url/' + selectedDataset + '/' + selectedDatasetType)//Request to flask server to retrieve a random image from storage
    .then(function (response) {
        return response.json();
        }).then(function (elem) {
            imgSrc = elem.img;
            imgName = elem.img_name;
        });

    var jsonData = await loadJSONData(imgName); 

    imgData.src = "data:image/png;base64," + imgSrc;
    imgData.json = jsonData;
    imgData.imgName = imgName;
}

//Agent information is displayed inside a window on the side of the canvas
function displayFloatingInfo(agentIndex){
    collapseAllButThis(document.getElementById('floating-window' + agentIndex));
    document.getElementById('floating-window-' + agentIndex).style.visibility = "visible";
    document.getElementById('agent-tab-' + agentIndex).classList.add("active")
}

//Each agent has its own floating window with its information
function createFloatingWindow(innerHTML, agent, agentIndex){
    var floatingWindow = document.createElement('div');
    var floatingWindowContainer = document.createElement('div');
    var closeButton = document.createElement('button');
    var agentbBoxValues = getAgentbBoxValues(datasetSpecificFeatures.agents[agent]);
    var left = agentbBoxValues.x/datasetSpecificFeatures.imgWidth*canvasWidth > 650 ? 0 : 1000;

    closeButton.innerHTML = "X";
    closeButton.className = "btn btn-primary rounded float-end"
    closeButton.setAttribute("onclick", "closeFloatingWindow(this)");
    floatingWindow.id = "floating-window-" + agentIndex;
    floatingWindowContainer.className = "container floating-window-container";
    floatingWindowContainer.innerHTML = innerHTML;
    floatingWindow.style.left = left + 'px';
    floatingWindow.style.top ='0px';
    floatingWindow.style.width = '296px';
    floatingWindow.style.height = '654px';
    floatingWindow.style.position = 'absolute';
    floatingWindow.style.background = 'rgba(255, 255, 255, 0.7)';
    floatingWindow.style.visibility = 'hidden';
    floatingWindow.appendChild(closeButton);
    floatingWindow.appendChild(floatingWindowContainer);
    document.getElementById('canvasContainer').appendChild(floatingWindow);
}

function closeFloatingWindow(element){
    element.parentElement.style.visibility = "hidden";
}

function closeAllFloatingWindows(){
    $('#canvasContainer > div').remove();
}

function displayPtgLabelled(){
    var percentages = $('.percentage-completed');

    for(i = 0; i < percentages.length; i++){
        var ptgElementId = percentages[i].id;
        var ptg = percentages[i].innerHTML;

        while(ptg.indexOf("&nbsp;") != -1){
            ptg = ptg.replace("&nbsp;", "");
        }
        var ptgCircleId = ptgElementId.replace("ptg-", "success-value-");

        //2*PI*35 (circle of radius 35), 0.75 is the displayed part of the circle and ptg/100 is the percentage of labelled images
        var scaledValue = 2*Math.PI*35*0.75*parseFloat(ptg)/100;

        var ptgCircle = document.getElementById(ptgCircleId);
        ptgCircle.setAttribute("stroke-dasharray", scaledValue + ", 220");
    }
}

function changeZoomFactor(e) {
    var evtobj = window.event? event : e
    if (evtobj.keyCode == 90 && evtobj.ctrlKey) {
        magnifyingGlassZoomFactor += 1;
        if(magnifyingGlassZoomFactor >= 10){
            magnifyingGlassZoomFactor = 10;
        }
    }
    else if (evtobj.keyCode == 88 && evtobj.ctrlKey){
        magnifyingGlassZoomFactor -= 1;
        if(magnifyingGlassZoomFactor <= 2){
            magnifyingGlassZoomFactor = 2;
        }
    }
}

async function getNumImgsAnnotated(){
    await fetch('/get_imgs_annotated/' + selectedDataset + '/' + selectedDatasetType)//Request to flask server to retrieve a random image from storage
    .then(function (response) {
        return response.json();
        }).then(function (elem) {
            imgs
        });
}

async function getPercentageAnnotated(){
    var percentagesDict = await getAnnotationPercentages()
    updatePercentages(percentagesDict);
}

function updatePercentages(percentagesDict){
    var percentages = $('.percentage-completed');
    var personsDs = Object.keys(percentagesDict["persons"]);
    var vehiclesDs = Object.keys(percentagesDict["vehicles"])
    var datasetElements = $(".ds-name");

    for(i=0; i < personsDs.length; i++){
        var dataSet = personsDs[i]
        for(k = 0; k < datasetElements.length; k++){
            if(datasetElements[k].dataset.dsType == "persons" && datasetElements[k].dataset.dsName == dataSet){
                var ptgElement = document.getElementById('ptg-' + dataSet + '-persons');
                var ptg = percentagesDict["persons"][dataSet].toString();
                if(ptg.length == 1){
                    ptg = "&nbsp;&nbsp;" + ptg + "%&nbsp;&nbsp;"
                }
                else if(ptg.length == 2){
                    ptg = "&nbsp;" + ptg + "%&nbsp;"
                }
                else if(ptg.length == 3){
                    ptg = ptg + "%"
                }

                ptgElement.innerHTML = ptg;
                break;
            }
        }
    }

    for(i=0; i < vehiclesDs.length; i++){
        var dataSet = vehiclesDs[i]
        for(k = 0; k < datasetElements.length; k++){
            if(datasetElements[k].dataset.dsType == "vehicles" && datasetElements[k].dataset.dsName == dataSet){
                var ptgElement = document.getElementById('ptg-' + dataSet + '-vehicles');
                var ptg = percentagesDict["vehicles"][dataSet].toString();
                if(ptg.length == 1){
                    ptg = "&nbsp;&nbsp;" + ptg + "%&nbsp;&nbsp;"
                }
                else if(ptg.length == 2){
                    ptg = "&nbsp;" + ptg + "%&nbsp;"
                }

                ptgElement.innerHTML = ptg;
                break;
            }
        }
    }
}

$(document).ready(async function() {
    await getPercentageAnnotated();
    displayPtgLabelled();

    $('#canvasContainer').mousemove(function(e){
        if(selectedDataset != ""){
            displayMagnifyingGlass(this, e, canvasElem, zoom, zoomCtx);
            document.onkeydown = changeZoomFactor;
        }
    });

    $('#imgToannotate').mouseout(function(){
        if(selectedDataset != ""){
            zoom.style.display = "none";
        }
    });

    $("#imgToAnnotate").click(function(event){    
        if(selectedDataset != ""){        
            var relX = event.pageX - $(this).offset().left;
            var relY = event.pageY - $(this).offset().top;
            var agentNumber = getAgentToDeploy(relX, relY);
            var collapsableElement = "collapse" + agentNumber;
    
            collapseAllButThis(collapsableElement);
            displayFloatingInfo(agentNumber);
        }
    });   
});
