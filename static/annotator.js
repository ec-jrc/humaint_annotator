/** GLOBAL VARIABLES **/
var listOfFiles = [];
var currentImageIndex = 0;
var selectedDataset = "";
var canvasElem, zoom, zoomCtx;
var imgData = new Object();
var datasetSpecificFeatures = new Object();
var newAgentsLabels = new Object();
var firstDraw = true;
var imageLabelled = false;
var groupsInPicture = new Object();
var correctionIndex = 0;
var canvasWidth = 1296;
var canvasHeight = 654

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

//Only for CityPersons dataset
const classLabels = {
    0: "Ignore",
    1: "Pedestrian",
    2: "Rider",
    3: "Sitting person",
    4: "Person in unusual posture",
    5: "Group of people"
};

//Only for Eurocity Persons dataset
const identitiesToAvoid = [
    "bicycle ", 
    "buggy ",
    "motorbike ",
    "scooter ", 
    "tricycle ", 
    "wheelchair ",
    "bicycle-group",
    "buggy-group", 
    "motorbike-group", 
    "scooter-group", 
    "tricycle-group", 
    "wheelchair-group",
    "person-group-far-away"
]

/*function toggleAccordionItem(accordionItem){
    var element = document.getElementById(accordionItem);
    if(element.classList.contains('show')){
        element.classList.remove('show');
        element.previousElementSibling.children[0].classList.add('collapsed')
    }
    else{
        element.classList.add('show');
        element.previousElementSibling.children[0].classList.remove('collapsed')
    }
}*/

function collapseAllButThis(element){
    var listOfCollapsableElems = [];

    $("#agentsTabs > button").each((index, elem) => {//Do not remove "index" even if unused, o.w. listOfCollapsableElems will be filled with undefineds
        listOfCollapsableElems.push(elem.id.replace("agent-tab-", "floating-window-"));
    });

    for(i = 0; i < listOfCollapsableElems.length; i++){
        if(listOfCollapsableElems[i] != element){
            var elementById = document.getElementById(listOfCollapsableElems[i]);
            elementById.style.visibility = "hidden";
            var agentIndex = i + 1;
            document.getElementById('agent-tab-' + agentIndex).classList.remove('active');
        }
    }
}

async function loadJSONData(file){
    //file = "barcelona_01375.png";
    //var jsonFile = file.replace(".png", datasetSpecificFeatures.jsonFileEnding);
    var jsonObj = {};

    await fetch('/img_json/' + selectedDataset + '/' + file)
        .then(function (response) {
            return response.json();
            }).then(function (elem) {
                jsonObj = elem;
            });

    /*$.ajax({
        url: datasetSpecificFeatures.jsonPath + jsonFile,
        async: false,
        dataType: 'json',
        success: function(json) {
            jsonObj = json;
        }
    });*/

    return jsonObj;
}

function loadCanvas(selectedDataset, img, canvasElem){
    var canvas = canvasElem,
    context = canvas.getContext('2d');

    make_base(selectedDataset, context, img, canvasElem);
}

function make_base(selectedDataset, context, img, canvasElem)
{
    img.onload = function(){
        drawImgCanvas(selectedDataset, context, img, canvasElem)
    }
}

function drawRect(context, imgHeight, canvasWidth, canvasHeight, selectedDataset, agent, rectColor, linewidth){
    var bBoxValues = getAgentbBoxValues(selectedDataset, agent);
    var x = bBoxValues.x/datasetSpecificFeatures.imgWidth*canvasWidth;
    var y = bBoxValues.y/imgHeight*canvasHeight;
    var bBoxWidth = bBoxValues.w/datasetSpecificFeatures.imgWidth*canvasWidth;
    var bBoxHeight = bBoxValues.h/imgHeight*canvasHeight;
    context.strokeStyle = rectColor;
    context.linewidth = linewidth;
    context.strokeRect(x, y, bBoxWidth, bBoxHeight);
}

function getAgentbBoxValues(selectedDataset, agentInfo){
    var agentbBoxValues = new Object();

    switch (selectedDataset){
        case "citypersons":
            agentbBoxValues.x = agentInfo.x1;
            agentbBoxValues.y = agentInfo.y1;
            agentbBoxValues.w = agentInfo.w;
            agentbBoxValues.h = agentInfo.h;
            break;
        case "eurocity":
            agentbBoxValues.x = agentInfo.x0;
            agentbBoxValues.y = agentInfo.y0;
            agentbBoxValues.w = agentInfo.x1 - agentInfo.x0;
            agentbBoxValues.h = agentInfo.y1 - agentInfo.y0;
            break;
    }

    return agentbBoxValues;
}

function drawImgCanvas(selectedDataset, context, img, canvasElem){
    context.clearRect(0,0,canvasElem.width, canvasElem.height);
    context.globalAlpha = 1;
    canvasElem.width = img.width;
    canvasElem.height = img.height;
    context.drawImage(img, 0, 0, canvasElem.width, canvasElem.height);
    var agentsKeys, imgHeight = 1024;
    agentsKeys = Object.keys(datasetSpecificFeatures.agents);

    for(i = 0; i < agentsKeys.length; i++){
        var agent = agentsKeys[i];
        var isRealAgent = true;
        if((datasetSpecificFeatures.agents[agent].hasOwnProperty("class_label") && datasetSpecificFeatures.agents[agent].class_label == 0) ||
            (datasetSpecificFeatures.agents[agent].hasOwnProperty("identity") && identitiesToAvoid.includes(datasetSpecificFeatures.agents[agent].identity))){
                isRealAgent = false;
        }
        if(isRealAgent){
            drawRect(context, imgHeight, canvasWidth, canvasHeight, selectedDataset, datasetSpecificFeatures.agents[agent], "red", 5);

            //Agents might be riders, and their vehicle bounding box is provided as subchild (Only for Eurocity Persons dataset)
            if(datasetSpecificFeatures.agents[agent].hasOwnProperty("children") && datasetSpecificFeatures.agents[agent].children.length != 0){
                drawRect(context, imgHeight, canvasWidth, canvasHeight, selectedDataset, datasetSpecificFeatures.agents[agent].children[0], "green", 10);
            }
        }
    }

    var groupsKeys = Object.keys(groupsInPicture);
    for(i = 0; i < groupsKeys.length; i++){
        var key = groupsKeys[i];
        if(Object.keys(groupsInPicture[key]).length > 1){//If there is more than one agent in the group (i.e. it is a group)
            var agents = Object.entries(groupsInPicture[key]);
            var minMax = {
                "minX" : 1296,
                "minY" : 654,
                "maxX" : 0,
                "maxY" : 0
            }
            agents.forEach(agent => minMax = getMinMax(agent, minMax));
            context.strokeStyle = "blue";
            context.linewidth = 5;
            context.strokeRect(minMax.minX, minMax.minY, minMax.maxX - minMax.minX, minMax.maxY - minMax.minY);
        }
    }
}

function getMinMax(agent, minMax){
    minMax.minX = agent[1].xInit < minMax.minX ? agent[1].xInit : minMax.minX;
    minMax.minY = agent[1].yInit < minMax.minY ? agent[1].yInit : minMax.minY;
    minMax.maxX = agent[1].xRight > minMax.maxX ? agent[1].xRight : minMax.maxX;
    minMax.maxY = agent[1].yBottom > minMax.maxY ? agent[1].yBottom : minMax.maxY;

    return minMax;
}

function loadAgentsD1(agents){
    var accordionBodies = [];
    var agentIndex = 0;
    
    for(i = 0; i < Object.keys(agents).length; i++){
        var accordionBody = document.createElement("div");
        var agent = Object.keys(agents)[i];
        var classLabelNumber = agents[agent].class_label;
        var classLabel = classLabels[classLabelNumber];

        if(classLabel != "Ignore"){
            agentIndex += 1;
            var group = getPeopleGroup(agentIndex, agents[agent].x1, agents[agent].y1, 
                agents[agent].x1 + agents[agent].w, agents[agent].y1 + agents[agent].h);
            accordionBody.className = "accordion-body";
            accordionBody.innerHTML = getAgentInnerHTML(agentIndex, classLabel, group);

            accordionBodies.push(accordionBody);
        }
    }

    var groups = Object.entries(groupsInPicture);
    document.getElementById('groupsList').innerHTML = "Available groups:&nbsp;&nbsp";
    groups.forEach(group => addGroupTag(group[0]));
    if($('#groupsList > button').length == 0){
        document.getElementById('groupsList').innerHTML = "Available groups: None";
    }

    return accordionBodies;
}

function loadAgentsD2(agents){
    var accordionBodies = [];
    var agentIndex = 0;

    for(i = 0; i < Object.keys(agents).length; i++){
        var accordionBody = document.createElement("div");
        var agent = Object.keys(agents)[i];
        var identity = agents[agent].identity;

        if(!identitiesToAvoid.includes(identity)){
            agentIndex += 1;
            var group = getPeopleGroup(agentIndex, agents[agent].x0, agents[agent].y0, agents[agent].x1, agents[agent].y1);
            accordionBody.className = "accordion-body";
            accordionBody.innerHTML = getAgentInnerHTML(agentIndex, identity, group);

            if(datasetSpecificFeatures.agents[agent].hasOwnProperty("children") && datasetSpecificFeatures.agents[agent].children.length != 0){
                identity = datasetSpecificFeatures.agents[agent].children[0].identity;
                accordionBody.innerHTML += `<div class="mb-0 mt-3"><span>Sub-entities</span><br/>
                <div id="subentity" class="border border-primary rounded" style="padding:10px;">
                <div class="mb-0"><span>Current label</span><br/>
                <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button"><span class="font-weight-bold">` + identity + `</span></button></div>
                <div id="subentity-color" class="mb-0 mt-3"><span>Color</span><br/> 
                <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Black</span></button>
                <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">White</span></button>
                <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Grey</span></button>
                <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Blue</span></button>
                <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Red</span></button>
                <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Yellow</span></button>
                <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Green</span></button>
                <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Other</span></button>
                <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Unknown</span></button></div>
                </div>`;
            }

            accordionBodies.push(accordionBody);
        }
    }

    var groups = Object.entries(groupsInPicture);
    document.getElementById('groupsList').innerHTML = "Available groups:&nbsp;&nbsp";
    groups.forEach(group => addGroupTag(group[0]));
    if($('#groupsList > button').length == 0){
        document.getElementById('groupsList').innerHTML = "Available groups: None";
    }

    return accordionBodies;
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
        "minX" : 1296,
        "minY" : 654,
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
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button"><span class="font-weight-bold">` + currentClass + `</span></button></div>
    <div class="mb-0 mt-3"><span>Age</span><br/> 
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Adult</span></button>
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Kid</span></button>
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Unknown</span></button></div>
    <div class="mb-0 mt-3"><span>Sex</span><br/>
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Male</span></button>
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Female</span></button>
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Unknown</span></button></div>
    <div class="mb-0 mt-3"><span>Skin tone</span><br/>
    <button type="button" class="btn btn-dark-skin btn-dark-skin-tone rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Dark Skin</span></button>
    <button type="button" class="btn btn-light-skin btn-light-skin-tone rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Light Skin</span></button>
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Unknown</span></button></div>
    <div class="mb-0 mt-3">`+/*<span>Custom labels</span><br/>
    <div class="row col-lg-7">
    <div class="col"><input type="text" class="form-control labelclass-input" placeholder="Label class"></div>
    <div class="col"><input type="text" class="form-control label-input" placeholder="Label"></div>
    <div class="col col-lg-1"><button type="button" class="btn btn-primary rounded btn-sm" data-bs-toggle="button" title="Click to add the label">
    <span class="font-weight-bold">Add</span></button></div>*/`
    <div class="col col-lg-6 mt-5"><button id="join-agent-btn-` + i + `" type="button" class="btn btn-primary rounded btn-sm" data-toggle="modal" onClick="showGroupAssignationPopup(` + i + `)" data-target="#assignGroupPopup" title="Click to assign a group">
    <span class="font-weight-bold">Join to agent</span></button></div></div>`;

    return innerHTML;
}

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
            var newOption = document.createElement('option');
            newOption.value = Object.keys(groupsInPicture[key])[j].replace("agent_", "Agent ");
            newOption.innerText = Object.keys(groupsInPicture[key])[j].replace("agent_", "Agent ");
            if(Object.keys(groupsInPicture[key]).length > 1){
                newOption.innerText += " (Group " + key + ")";
            }
            selectObject.appendChild(newOption);
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
    drawImgCanvas(selectedDataset, canvasElem.getContext("2d"), imgData.img, canvasElem);
    if(document.getElementById('group-btn-' + newGroup) == null){
        addGroupTag(newGroup);
    }
    addGroupButtonToAgent();
}

function getPeopleGroup(agentNumber, xInit, yInit, xRight, yBottom){//x1 and x2 to measure x middle point and y2 to get bbox bottom
    var groupOfAgent;
    var adaptedXs = new Object();
    adaptedXs.xInit = (xInit/datasetSpecificFeatures.imgWidth) * 1296;
    adaptedXs.xRight = (xRight/datasetSpecificFeatures.imgWidth) * 1296;
    var adaptedYs = new Object();
    adaptedYs.yInit = (yInit/1024) * 654;
    adaptedYs.yBottom = (yBottom/1024) * 654;
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

    if(createNewGroup || groupsKeys.length == 0){
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

    const heightDivisionLength = 654/5;//Length of each height division of the image in pixels
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

function toggleTag(element){
    var elementParentChildren = element.parentElement.children;
    for(i = 2; i < elementParentChildren.length; i++){//first two elements are not buttons
        elementParentChildren[i].classList.remove("tag-pressed");
        if(elementParentChildren[i].classList.contains("btn-dark-skin")){
            elementParentChildren[i].classList.add("btn-dark-skin-tone");
        }
        else if(elementParentChildren[i].classList.contains("btn-light-skin")){
            elementParentChildren[i].classList.add("btn-light-skin-tone");
        }
        else{
            elementParentChildren[i].classList.add("btn-primary");
        }
    }
    if(element.classList.contains("btn-dark-skin")){
        element.classList.remove("btn-dark-skin-tone");
    }
    else if(element.classList.contains("btn-light-skin")){
        element.classList.remove("btn-light-skin-tone");
    }
    else{
        element.classList.remove("btn-primary");
    }
    element.classList.add("tag-pressed");

    var currentAgent = element.closest(".container").firstElementChild.id.replace("current-labels-", "Agent ");//Get agent name
    var category = element.parentElement.firstElementChild.innerText;//Get label category
    var labelValue = element.innerText;//Get label value

    if(element.closest("#subentity") != null){//If the label comes from a subentity, agent's children dictionary has to be edited
        newAgentsLabels[currentAgent]["children"][category.toLowerCase()] = labelValue.toLowerCase();
    }
    else{
        newAgentsLabels[currentAgent][category.toLowerCase()] = labelValue.toLowerCase();
    }
}

function loadAgents(){
    var agentsTabs = document.getElementById("agentsTabs");
    $(agentsTabs).empty();

    for(i = 0; i < datasetSpecificFeatures.accordionBodies.length; i++){
        //var accordionItem = document.createElement("div");
        //var accordionHeader = document.createElement("h2");
        //var accordionButton = document.createElement("button");
        //var collapsableElement = document.createElement("div");
        var agentIndex = i+1;

        /*accordionItem.className = "accordion-item";

        accordionHeader.className = "accordion-header"
        accordionHeader.id = "heading" + agentIndex;
        
        accordionButton.className = "accordion-button collapsed";
        accordionButton.type = "button";
        accordionButton.innerText = "Agent " + agentIndex;
        accordionButton.setAttribute("onclick", "collapseAllButThis('collapse" + agentIndex + "'); toggleAccordionItem('collapse" + 
                                        agentIndex + "'); selectAgentInCanvas(" + agentIndex + ");");

        collapsableElement.className = "accordion-collapse collapse";
        collapsableElement.id = "collapse" + agentIndex;
        collapsableElement.style.visibility = "hidden";

        accordionHeader.appendChild(accordionButton);
        collapsableElement.appendChild(datasetSpecificFeatures.accordionBodies[i]);
        accordionItem.appendChild(accordionHeader);
        accordionItem.appendChild(collapsableElement);*/
        createFloatingWindow(datasetSpecificFeatures.accordionBodies[i].innerHTML, i);
        //agentsAccordion.appendChild(accordionItem);
        var agentButton = document.createElement('button');
        agentButton.id = "agent-tab-" + agentIndex;
        agentButton.className = "tablinks";
        agentButton.innerText = "Agent " + agentIndex;
        agentButton.setAttribute("onclick", "displayFloatingInfo(" + agentIndex + ")")
        agentsTabs.appendChild(agentButton);

        //Initializing newAgentsLabels to be used in toggleTag() method
        newAgentsLabels["Agent " + agentIndex] = new Object();
        newAgentsLabels["Agent " + agentIndex]["children"] = new Object();
    }

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
                    button.innerHTML = "<span class='font-weight-bold'>Group " + j + "</span>";
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
            groupsInPicture[groupsKeys.length] = new Object();
            groupsInPicture[groupsKeys.length][agent] = new Object();
            groupsInPicture[groupsKeys.length][agent].xInit = xInit;
            groupsInPicture[groupsKeys.length][agent].yInit = yInit;
            groupsInPicture[groupsKeys.length][agent].xRight = xRight;
            groupsInPicture[groupsKeys.length][agent].yBottom = yBottom;
            break;
        }
    }
    element.parentNode.removeChild(element);//Remove group tag
    drawImgCanvas(selectedDataset, canvasElem.getContext("2d"), imgData.img, canvasElem);
}

function selectAgentInCanvas(visibleAgentsIndex){
    var canvasSpecs = setCanvasSpecs();

    for(i = 0; i < Object.keys(datasetSpecificFeatures.agents).length; i++){
        var agent = Object.keys(datasetSpecificFeatures.agents)[i];
        var bBoxValues = getAgentbBoxValues(selectedDataset, datasetSpecificFeatures.agents[agent]);
        var isRealAgent = getAgentAutenticity(agent);//Check if it is a real agent or not

        if(isRealAgent && visibleAgentsIndex == i + 1 - correctionIndex){
            highlightRect(canvasSpecs.context, bBoxValues.x*canvasSpecs.percentageOfReductionWidth, bBoxValues.y*canvasSpecs.percentageOfReductionHeight, 
                bBoxValues.w*canvasSpecs.percentageOfReductionWidth, bBoxValues.h*canvasSpecs.percentageOfReductionHeight);
        }
    }
    correctionIndex = 0;
}

function highlightRect(context, x, y, w, h){
    context.globalAlpha = 0.5;
    context.fillStyle = "#6acadd";//Light blue
    context.fillRect(x, y, w, h);
}

function getAgentAutenticity(agent){
    isRealAgent = true;
    if((datasetSpecificFeatures.agents[agent].hasOwnProperty("class_label") && datasetSpecificFeatures.agents[agent].class_label == 0) ||
            (datasetSpecificFeatures.agents[agent].hasOwnProperty("identity") && identitiesToAvoid.includes(datasetSpecificFeatures.agents[agent].identity))){
        isRealAgent = false;
        correctionIndex += 1;//If an agent is skipped, it must be taken into account
    }

    return isRealAgent;
}

function setCanvasSpecs(){
    var canvasSpecs = new Object();
    canvasSpecs.context = canvasElem.getContext("2d");

    //Next condition resets the image in the canvas removing highlight from agents
    if(!firstDraw){
        drawImgCanvas(selectedDataset, canvasSpecs.context, imgData.img, canvasElem);
    }
    else{
        firstDraw = false;
    }

    var imgOriginalHeight = 1024;

    //Percentages of reduction are needed since image dimensions and canvas dimensions do not match
    canvasSpecs.percentageOfReductionWidth = canvasWidth/datasetSpecificFeatures.imgWidth;
    canvasSpecs.percentageOfReductionHeight = canvasHeight/imgOriginalHeight;

    return canvasSpecs;
}

function getAgentToDeploy(selectedDataset, relX, relY){
    var agentToDeploy = 0;
    var canvasSpecs = setCanvasSpecs();

    for(i = 0; i < Object.keys(datasetSpecificFeatures.agents).length; i++){
        var agent = Object.keys(datasetSpecificFeatures.agents)[i];
        var bBoxValues = getAgentbBoxValues(selectedDataset, datasetSpecificFeatures.agents[agent]);
        var xCoordBottomRight = bBoxValues.x + bBoxValues.w;
        var yCoordBottomRight = bBoxValues.y + bBoxValues.h;
        var isRealAgent = getAgentAutenticity(agent);
        
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

function saveCurrent(){
    // TODO: Mark picture as annotated
    var numberOfAgents = datasetSpecificFeatures.numberOfAgents;

    //Edit each agent of the json object
    for (i = 0; i < numberOfAgents; i++){
        var index = 0;
        var isRealAgent = true;
        if((datasetSpecificFeatures.agents[i].hasOwnProperty("class_label") && datasetSpecificFeatures.agents[i].class_label == 0) ||
            (datasetSpecificFeatures.agents[i].hasOwnProperty("identity") && identitiesToAvoid.includes(datasetSpecificFeatures.agents[i].identity))){
                isRealAgent = false;
        }

        if(isRealAgent){
            index = index + 1;
            var currentAgentNewInfo = newAgentsLabels["Agent " + index];
            var agent;
            if(selectedDataset == "citypersons"){
                agent = datasetSpecificFeatures.agents["agent_" + index];
            }
            else{
                agent = datasetSpecificFeatures.agents[i];
            }
            
            var agentKeys = Object.keys(currentAgentNewInfo); 
            for(j = 0; j < agentKeys.length; j++){
                parserInfo = datasetSpecificJSONParse(i, j, agent, currentAgentNewInfo, agentKeys);
                if(agentKeys[j] == "children"){
                    agent = parserInfo.agent;
                }
                else{
                    agent[agentKeys[j]] = currentAgentNewInfo[agentKeys[j]];//Copy info from new labels into the agent
                }
            }

            datasetSpecificFeatures.agents[parserInfo.index] = agent;//Adding edited agents to img json
        }
    }

    var agentsLabelled = isAgentCorrectlyLabelled(numberOfAgents);

    if(!agentsLabelled){
        alert("You need to label all the agents of the picture to load a new image");
        imageLabelled = false;
    }
    else{
        imageLabelled = true;
        //var editedJsonFile = listOfFiles[currentImageIndex].replace(".png", "_edited.json");
        //downloadNewJson(imgData.json, editedJsonFile, 'text/plain');
        saveEditedJson(imgData.json);
    }
}

function datasetSpecificJSONParse(agentIndex, agentNewKeysIndex, agent, currentAgentNewInfo, agentKeys){
    var parserInfo = new Object();
    var isRealAgent = true;
    if((datasetSpecificFeatures.agents[agentIndex].hasOwnProperty("class_label") && datasetSpecificFeatures.agents[agentIndex].class_label == 0) ||
        (datasetSpecificFeatures.agents[agentIndex].hasOwnProperty("identity") && identitiesToAvoid.includes(datasetSpecificFeatures.agents[agentIndex].identity))){
            isRealAgent = false;
    }
    if(isRealAgent){
        switch(selectedDataset){
            case "citypersons":
                parserInfo.index = "agent_" + agentIndex + 1;
                delete(agent["children"]);//Children key does not exist in this dataset
                break;
            case "eurocity":
                parserInfo.index = agentIndex;
                var childrenKeys = Object.keys(currentAgentNewInfo[agentKeys[agentNewKeysIndex]]);
                for(k = 0; k < childrenKeys.length; k++){
                    //Copy info from new labels's children into the agent
                    agent[agentKeys[agentNewKeysIndex]] = currentAgentNewInfo[agentKeys[agentNewKeysIndex]]; 
                }
                break;
        }
    }

    parserInfo.agent = agent;

    return parserInfo;
}

function isAgentCorrectlyLabelled(numberOfAgents){
    var agentsCorrectlyLabelled = 0;
    for (i = 0; i < numberOfAgents; i++){
        var index = i + 1;
        var query = $("#floating-window-" + index + " >> div");
        var numCategoriesAgent = query.length;
        for(j = 1; j < numCategoriesAgent - 1; j++){//We don't want the current labels nor the custom label form info
            if(query[j].firstElementChild.innerHTML != "Custom labels"){
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
                    agentsCorrectlyLabelled = $(query[j]).find(".tag-pressed").length;
                }

                if(!agentsCorrectlyLabelled){//If one category is not labelled, agent is not correctly labelled
                    break;
                }
            }
        }

        if(!agentsCorrectlyLabelled){//If one category is not labelled, agent is not correctly labelled
            break;
        }
    }

    return agentsCorrectlyLabelled;
}

function saveEditedJson(json){//downloadNewJson(jsonData, fileName, contentType){
    /*var a = document.createElement("a");
    var file = new Blob([JSON.stringify(jsonData)], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);*/
    fetch('/save_edited_json/' + imgData.imgName, {
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

async function cleanAndDrawNew(){
    /*imgData = */await getRandomImageDataFromDataset();
    canvasElem = document.getElementById('imgToAnnotate');
    zoom = document.getElementById("zoomed-canvas");
    zoomCtx = zoom.getContext("2d");

    assignDatasetSpecificFeatures(selectedDataset, imgData.json);
    loadCanvas(selectedDataset, imgData.img, canvasElem);
    loadAgents();
}

function loadData(){
    saveCurrent();
    if(imageLabelled){
        cleanAndDrawNew();
        imageLabelled = false;
    }
}

function getImagesList(){
    var imagesList = [];
    var pageData = "";

    $.ajax({
        url : datasetSpecificFeatures.imgPath,
        async: false,
        success: function (data) {
            pageData = data;
        }
    });

    //Using regular expressions to get the list of images
    const regex = "addRow\\(\"\\w+.png\"";
    var matches = [...pageData.matchAll(regex)];

    const fileNameRegex = "\\w+.png";
    for(i = 0; i < matches.length; i++){
        imagesList.push(matches[i][0].match(fileNameRegex)[0]);
    }

    return imagesList;
}

function displayMagnifyingGlass(currentElem, e, canvasElem, zoom, zoomCtx){
    var cursorX = e.pageX - $(currentElem).offset().left;//Page coordinates minus the offset of the canvas container
    var cursorY = e.pageY - $(currentElem).offset().top;
    var zoomFactor = 2;
    var w = zoom.offsetWidth / zoomFactor;
    var h = zoom.offsetHeight / zoomFactor;
    zoomCtx.fillStyle = "transparent";
    var glassDim = 150; //Square dimensions of the magnifying glass
    var glassCursorRepositioningFactor = glassDim/4;
    var glassCanvasWidth = canvasElem.height/zoomFactor;//current width of canvasElem divided by zoomFactor*canvas width/canvas height);
    var glassCanvasHeight = glassCanvasWidth;//Since the glass is a square canvas we use glassCanvasWidth
    zoomCtx.drawImage(canvasElem, cursorX-glassCursorRepositioningFactor, cursorY-glassCursorRepositioningFactor, glassCanvasWidth, glassCanvasHeight, 0, 0, canvasElem.width, canvasElem.height);
    zoom.style.top = cursorY - h + "px";//Relocation of the canvas to set the cursor in the center instead of in top left position
    zoom.style.left = cursorX - w + "px";
    zoom.style.display = "block";
}

function assignDatasetPaths(selectedDataset){
    switch(selectedDataset){
        case "citypersons":
            datasetSpecificFeatures.imgPath = "../img/citypersons/train/strasbourg/";
            datasetSpecificFeatures.jsonPath = "../annotations_json/citypersons/anno_train/";
            datasetSpecificFeatures.jsonFileEnding = "_annotation.json";
            datasetSpecificFeatures.editedJSONsPath = "../edited_jsons/citypersons/";
            break;
        case "eurocity":
            datasetSpecificFeatures.imgPath = "../img/ECP/day/img/val/barcelona/";
            datasetSpecificFeatures.jsonPath = "../annotations_json/ECP/ECP_day_labels_val/ECP/day/labels/val/barcelona/";
            datasetSpecificFeatures.jsonFileEnding = ".json";
            datasetSpecificFeatures.editedJSONsPath = "../edited_jsons/eurocity/";
            break;
    }
}

function assignDatasetSpecificFeatures(selectedDataset, jsonData){
    switch(selectedDataset){
        case "citypersons":
            datasetSpecificFeatures.agents = jsonData.bbs;
            datasetSpecificFeatures.numberOfAgents = Object.keys(jsonData.bbs).length;
            datasetSpecificFeatures.imgWidth = 2048;
            datasetSpecificFeatures.accordionBodies = loadAgentsD1(datasetSpecificFeatures.agents);
            break;
        case "eurocity":
            datasetSpecificFeatures.agents = jsonData.children;
            datasetSpecificFeatures.numberOfAgents = jsonData.children.length;
            datasetSpecificFeatures.imgWidth = 1920;
            datasetSpecificFeatures.accordionBodies = loadAgentsD2(datasetSpecificFeatures.agents);
            break;
    }
}

async function selectDataset(){
    var selectBox = document.getElementById("selectBox");
    groupsInPicture = new Object();
    selectedDataset = selectBox.options[selectBox.selectedIndex].value;
    //assignDatasetPaths(selectedDataset);//TODO: Remove on full merge
    //listOfFiles = getImagesList();//TODO: Remove on full merge
    await cleanAndDrawNew();

    $('#canvasContainer').css("visibility", "visible");
    $('#loadimage-btn').css("visibility", "visible");
    $('#groupsList').css("visibility", "visible");
    $('#agentsTabs').css("visibility", "visible");
}

async function getRandomImageDataFromDataset(){
    //currentImageIndex = Math.floor(Math.random() * (listOfFiles.length - 0)) + 0;//TODO: Remove on full merge
    img = new Image();
    var imgName;
    var imgInfo = new Object();
    await fetch('/img_url')
        .then(function (response) {
            return response.json();
            }).then(function (elem) {
                img.src = elem.img_url;
                imgName = elem.img_name;
            });
    //img.src = imgUrl;//datasetSpecificFeatures.imgPath + listOfFiles[currentImageIndex];//
    img.width = $("#canvasContainer").width();
    img.height = $("#canvasContainer").height();
    var jsonData = await loadJSONData(imgName); 
    imgInfo.img = img;
    imgInfo.json = jsonData;
    imgInfo.imgName = imgName;
    imgData = imgInfo;

    //return imgData;
}

function displayFloatingInfo(agentIndex){
    collapseAllButThis(document.getElementById('floating-window' + agentIndex));
    document.getElementById('floating-window-' + agentIndex).style.visibility = "visible";
    document.getElementById('agent-tab-' + agentIndex).classList.add("active")
}

function createFloatingWindow(innerHTML, i){
    var agentIndex = i + 1;
    var floatingWindow = document.createElement('div');
    var floatingWindowContainer = document.createElement('div');
    var closeButton = document.createElement('button');
    var agentsKeys = Object.keys(datasetSpecificFeatures.agents);
    var agent = agentsKeys[i];
    var agentbBoxValues = getAgentbBoxValues(selectedDataset, datasetSpecificFeatures.agents[agent]);
    var left = agentbBoxValues.x/datasetSpecificFeatures.imgWidth*canvasWidth > 650 ? 0 : 1000;

    closeButton.innerHTML = "X";
    closeButton.className = "btn btn-primary rounded float-end"
    closeButton.setAttribute("onclick", "closeFloatingWindow(this)");
    floatingWindow.id = "floating-window-" + agentIndex;
    floatingWindowContainer.className = "container";
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

$(document).ready(function() {
    $('#canvasContainer').mousemove(function(e){
        if(selectedDataset != ""){
            displayMagnifyingGlass(this, e, canvasElem, zoom, zoomCtx);
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
            var agentNumber = getAgentToDeploy(selectedDataset, relX, relY);
            var collapsableElement = "collapse" + agentNumber;
    
            collapseAllButThis(collapsableElement);
            //toggleAccordionItem(collapsableElement);
            displayFloatingInfo(agentNumber);
        }
    });

    if(selectedDataset == ""){
        $('#canvasContainer').css("visibility", "hidden");
        $('#loadimage-btn').css("visibility", "hidden");
        $('#groupsList').css("visibility", "hidden");
    }
    
});
