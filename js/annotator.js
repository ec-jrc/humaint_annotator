/** GLOBAL VARIABLES **/
var listOfFiles = [];
var currentImageIndex = 0;
var selectedDataset = "";
var canvasElem, zoom, zoomCtx;
var imgData = new Object();
var currentSelectedAgent = new Object();
var datasetSpecificFeatures = new Object();
var firstDraw = true;
var imageLabelled = false;

function toggleAccordionItem(accordionItem){
    var element = document.getElementById(accordionItem);
    if(element.classList.contains('show')){
        element.classList.remove('show');
        element.previousElementSibling.children[0].classList.add('collapsed')
    }
    else{
        element.classList.add('show');
        element.previousElementSibling.children[0].classList.remove('collapsed')
    }
}

function collapseAllButThis(element){
    var listOfCollapsableElems = [];

    $("#agentsAccordion >> div").each((index, elem) => {
        listOfCollapsableElems.push(elem.id);
    });

    for(i = 0; i < listOfCollapsableElems.length; i++){
        if(listOfCollapsableElems[i] != element){
            var elementById = document.getElementById(listOfCollapsableElems[i]);
            elementById.classList.remove('show');
            elementById.previousElementSibling.children[0].classList.add('collapsed')
        }
    }
}

function loadJSONData(file){
    var jsonFile = file.replace(".png", datasetSpecificFeatures.jsonFileEnding);
    var jsonObj = {};

    $.ajax({
        url: datasetSpecificFeatures.jsonPath + jsonFile,
        async: false,
        dataType: 'json',
        success: function(json) {
            jsonObj = json;
        }
    });

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

function drawRect(context, imgHeight, canvasWidth, canvasHeight, selectedDataset, agent){
    var bBoxValues = getbBoxValues(selectedDataset, agent);
    var x = bBoxValues.x/datasetSpecificFeatures.imgWidth*canvasWidth;
    var y = bBoxValues.y/imgHeight*canvasHeight;
    var bBoxWidth = bBoxValues.w/datasetSpecificFeatures.imgWidth*canvasWidth;
    var bBoxHeight = bBoxValues.h/imgHeight*canvasHeight;
    context.strokeStyle = "red";
    context.linewidth = 5;
    context.strokeRect(x, y, bBoxWidth, bBoxHeight);
}

function getbBoxValues(selectedDataset, agentInfo){
    var bBoxValues = new Object();

    switch (selectedDataset){
        case "citypersons":
            bBoxValues.x = agentInfo.x1;
            bBoxValues.y = agentInfo.y1;
            bBoxValues.w = agentInfo.w;
            bBoxValues.h = agentInfo.h;
            break;
        case "eurocity":
            bBoxValues.x = agentInfo.x0;
            bBoxValues.y = agentInfo.y0;
            bBoxValues.w = agentInfo.x1 - agentInfo.x0;
            bBoxValues.h = agentInfo.y1 - agentInfo.y0;
            break;
    }

    return bBoxValues;
}

function drawImgCanvas(selectedDataset, context, img, canvasElem){
    context.clearRect(0,0,canvasElem.width, canvasElem.height);
    context.globalAlpha = 1;
    canvasElem.width = img.width;
    canvasElem.height = img.height;
    context.drawImage(img, 0, 0, canvasElem.width, canvasElem.height);
    var agentsKeys, imgHeight = 1024, canvasWidth = 1296, canvasHeight = 654;
    agentsKeys = Object.keys(datasetSpecificFeatures.agents);

    for(i = 0; i < agentsKeys.length; i++){
        var agent = agentsKeys[i];
        drawRect(context, imgHeight, canvasWidth, canvasHeight, selectedDataset, datasetSpecificFeatures.agents[agent]);

        //Agents might be riders, and their vehicle bounding box is provided as subchild
        if(datasetSpecificFeatures.agents[agent].hasOwnProperty("children") && datasetSpecificFeatures.agents[agent].children.length != 0){
            drawRect(context, imgHeight, canvasWidth, canvasHeight, selectedDataset, datasetSpecificFeatures.agents[agent].children[0]);
        }
    }
}

function loadAgentsD1(agents){
    var accordionBodies = [];
    const classLabels = {
        0: "Ignore",
        1: "Pedestrian",
        2: "Rider",
        3: "Sitting person",
        4: "Person in unusual posture",
        5: "Group of people"
    };

    for(i = 0; i < Object.keys(agents).length; i++){
        var accordionBody = document.createElement("div");
        var agent = Object.keys(agents)[i];
        var classLabelNumber = agents[agent].class_label;
        var classLabel = classLabels[classLabelNumber];

        accordionBody.className = "accordion-body";
        accordionBody.innerHTML = getAgentInnerHTML(classLabel);

        accordionBodies.push(accordionBody);
    }

    return accordionBodies;
}

function loadAgentsD2(agents){
    var accordionBodies = [];

    for(i = 0; i < Object.keys(agents).length; i++){
        var accordionBody = document.createElement("div");
        var agent = Object.keys(agents)[i];
        var identity = agents[agent].identity;

        accordionBody.className = "accordion-body";
        accordionBody.innerHTML = getAgentInnerHTML(identity);

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

    return accordionBodies;
}

function getAgentInnerHTML(currentClass){
    var innerHTML = `<div class="mb-0"><span>Current label</span><br/>
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button"><span class="font-weight-bold">` + currentClass + `</span></button></div>
    <div class="mb-0 mt-3"><span>Age</span><br/> 
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Adult</span></button>
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Kid</span></button>
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Unknown</span></button></div>
    <div class="mb-0 mt-3"><span>Sex</span><br/>
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Male</span></button>
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Female</span></button>
    <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button" onClick="toggleTag(this)"><span class="font-weight-bold">Unknown</span></button></div>
    <div class="mb-0 mt-3"><span>Custom labels</span><br/>
    <div class="row col-lg-7">
    <div class="col"><input type="text" class="form-control labelclass-input" placeholder="Label class"></div>
    <div class="col"><input type="text" class="form-control label-input" placeholder="Label"></div>
    <div class="col col-lg-1"><button type="button" class="btn btn-primary rounded btn-sm" data-bs-toggle="button" title="Click to add the label">
    <span class="font-weight-bold">Add</span></button></div></div>`;

    return innerHTML;
}

function isGroupOfPeople(){
    //TODO: detection of several people together as a group
}

function toggleTag(element){
    var elementParentChildren = element.parentElement.children;
    for(i = 2; i < elementParentChildren.length; i++){//first two elements are not buttons
        elementParentChildren[i].classList.remove("tag-pressed");
        elementParentChildren[i].classList.add("btn-primary");
    }
    element.classList.remove("btn-primary");
    element.classList.add("tag-pressed");
}

function loadAgents(){
    var agentsAccordion = document.getElementById("agentsAccordion");
    $(agentsAccordion).empty();

    for(i = 0; i < Object.keys(datasetSpecificFeatures.agents).length; i++){
        var accordionItem = document.createElement("div");
        var accordionHeader = document.createElement("h2");
        var accordionButton = document.createElement("button");
        var collapsableElement = document.createElement("div");
        var agentIndex = i+1;

        accordionItem.className = "accordion-item";

        accordionHeader.className = "accordion-header"
        accordionHeader.id = "heading" + agentIndex;
        
        accordionButton.className = "accordion-button collapsed";
        accordionButton.type = "button";
        accordionButton.innerText = "Agent " + agentIndex;

        collapsableElement.className = "accordion-collapse collapse";
        collapsableElement.id = "collapse" + agentIndex;

        accordionHeader.appendChild(accordionButton);
        collapsableElement.appendChild(datasetSpecificFeatures.accordionBodies[i]);
        accordionItem.appendChild(accordionHeader);
        accordionItem.appendChild(collapsableElement);
        agentsAccordion.appendChild(accordionItem);
    }
}

function getAgentToDeploy(selectedDataset, relX, relY){
    var context = canvasElem.getContext("2d");
    var imgOriginalHeight = 1024;

    if(!firstDraw){
        drawImgCanvas(selectedDataset, context, imgData.img, canvasElem);
    }
    else{
        firstDraw = false;
    }

    var agentToDeploy = 0;
    var canvasWidth = $('#imgToAnnotate').width();
    var canvasHeight = $('#imgToAnnotate').height();
    var percentageOfReductionWidth = canvasWidth/datasetSpecificFeatures.imgWidth;
    var percentageOfReductionHeight = canvasHeight/imgOriginalHeight;

    for(i = 0; i < Object.keys(datasetSpecificFeatures.agents).length; i++){
        var agent = Object.keys(datasetSpecificFeatures.agents)[i];
        var bBoxValues = getbBoxValues(selectedDataset, datasetSpecificFeatures.agents[agent]);
        var xCoordBottomRight = bBoxValues.x + bBoxValues.w;
        var yCoordBottomRight = bBoxValues.y + bBoxValues.h;

        //Check if click has been inside a bounding box
        if(relX > bBoxValues.x*percentageOfReductionWidth && relX < xCoordBottomRight*percentageOfReductionWidth && 
            relY > bBoxValues.y*percentageOfReductionHeight && relY < yCoordBottomRight*percentageOfReductionHeight){
                context.globalAlpha = 0.2;
                context.fillStyle = "blue";
                context.fillRect(bBoxValues.x*percentageOfReductionWidth, bBoxValues.y*percentageOfReductionHeight, 
                    bBoxValues.w*percentageOfReductionWidth, bBoxValues.h*percentageOfReductionHeight);
                currentSelectedAgent.x = bBoxValues.x*percentageOfReductionWidth;
                currentSelectedAgent.y = bBoxValues.y*percentageOfReductionHeight;
                currentSelectedAgent.width = bBoxValues.w*percentageOfReductionWidth;
                currentSelectedAgent.height = bBoxValues.h*percentageOfReductionHeight;
                agentToDeploy = i + 1;
                break;
        }
    }

    return agentToDeploy;
}

function saveCurrent(){
    // TODO: Mark picture as annotated
    var numberOfAgents = datasetSpecificFeatures.agents.length;
    var editedJson = imgData.json;
    editedJson.children = [];//Empty children array to be filled with edited agents
    for (i = 0; i < numberOfAgents; i++){
        var index = i + 1;
        var agent = datasetSpecificFeatures.agents[i];
        var query = $("#collapse" + index + " >> div");
        var numCategoriesAgent = query.length;
        var key;
        for(j = 1; j < numCategoriesAgent; j++){//We don't want the current labels nor the custom label form info
            var numLabelsOfCategory = query[j].children.length
            key = query[j].children[0].innerHTML;//We need the content of span tag
            if(key != "Custom labels"){
                if(key == "Sub-entities"){
                    var subEntityQuery = $("#collapse" + index + " >> div >> #subentity-color");
                    key = subEntityQuery.children()[0].innerHTML;
                    var numLabelsOfSubEntity = subEntityQuery.children().length;
                    var subEntity = editAgent(subEntityQuery.children(), numLabelsOfSubEntity, key, agent["children"][0]);
                    if(!imageLabelled){
                        break;
                    }
                    agent["children"][0] = subEntity;
                }
                else{
                    var auxAgent = editAgent(query[j].children, numLabelsOfCategory, key, agent);
                    if(!imageLabelled){
                        break;
                    }
                    agent = auxAgent;
                }
            }
        }
        if(imageLabelled){//imageLabelled variable is edited in editAgent() method. If it is false, that means the agent is not fully labelled
            editedJson.children.push(agent);
        }
        else{
            alert("You need to label all the agents of the picture to load a new image");
            break;
        }
    }
    // TODO CORRECT
    if(imageLabelled){//imageLabelled variable is edited in editAgent() method. If it is false, that means the agent is not fully labelled
        var editedJsonFile = listOfFiles[currentImageIndex].replace(".png", "_edited.json");
        downloadNewJson(editedJson, editedJsonFile, 'text/plain');
    }
}

function downloadNewJson(jsonData, fileName, contentType){
    var a = document.createElement("a");
    var file = new Blob([JSON.stringify(jsonData)], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
}

function editAgent(queryChildren, availableLabels, key, agent){
    var value;
    var tagged = false;
    for(k = 2; k < availableLabels; k++){
        if(queryChildren[k].classList.contains("tag-pressed")){
            value = queryChildren[k].children[0].innerHTML;//We need the content of span tag
            tagged = true;
            break;
        }
        imageLabelled = false;
    }
    if(tagged){
        agent[key.toLowerCase()] = value.toLowerCase();
        imageLabelled = true;
    }

    return agent;
}

function cleanAndDrawNew(){
    imgData = getRandomImageDataFromDataset();
    canvasElem = document.getElementById('imgToAnnotate');
    zoom = document.getElementById("zoomed-canvas");
    zoomCtx = zoom.getContext("2d");

    assignDatasetSpecificFeatures(selectedDataset, imgData.json);
    loadCanvas(selectedDataset, imgData.img, canvasElem);
    loadAgents();
}

function loadData(){
    saveCurrent();
    if(imageLabelled){//TODO CORRECT
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
            datasetSpecificFeatures.imgWidth = 2048;
            datasetSpecificFeatures.accordionBodies = loadAgentsD1(datasetSpecificFeatures.agents);
            break;
        case "eurocity":
            datasetSpecificFeatures.agents = jsonData.children;
            datasetSpecificFeatures.imgWidth = 1920;
            datasetSpecificFeatures.accordionBodies = loadAgentsD2(datasetSpecificFeatures.agents);
            break;
    }
}

function selectDataset(){
    var selectBox = document.getElementById("selectBox");
    selectedDataset = selectBox.options[selectBox.selectedIndex].value;
    assignDatasetPaths(selectedDataset);
    listOfFiles = getImagesList();
    cleanAndDrawNew();

    $('#canvasContainer').css("visibility", "visible");
    $('#loadimage-btn').css("visibility", "visible");
}

function getRandomImageDataFromDataset(){
    currentImageIndex = Math.floor(Math.random() * (listOfFiles.length - 0)) + 0;
    img = new Image();
    img.src = datasetSpecificFeatures.imgPath + listOfFiles[currentImageIndex];
    img.width = $("#canvasContainer").width();
    img.height = $("#canvasContainer").height();
    var jsonData = loadJSONData(listOfFiles[currentImageIndex]); 
    imgData.img = img;
    imgData.json = jsonData;

    return imgData;
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
            toggleAccordionItem(collapsableElement);
        }
    });

    if(selectedDataset == ""){
        $('#canvasContainer').css("visibility", "hidden");
        $('#loadimage-btn').css("visibility", "hidden");
    }
    
});
