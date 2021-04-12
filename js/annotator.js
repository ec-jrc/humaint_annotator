/** GLOBAL VARIABLES **/
var listOfFiles = [];
var currentImageIndex = 0;

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

function loadJSONData(listOfFiles){
    var file = listOfFiles[currentImageIndex];
    var jsonFile = file.replace(".png", "_annotation.json");
    const JSONPath = "../annotations_json/anno_train/" + jsonFile;
    var jsonObj = {};

    $.ajax({
        url: JSONPath,
        async: false,
        dataType: 'json',
        success: function(json) {
            jsonObj = json;
        }
    });

    return jsonObj;
}

function loadCanvas(jsonData, img, canvasElem){
    var canvas = canvasElem,
    context = canvas.getContext('2d');

    make_base(context, jsonData, img, canvasElem);
}

function make_base(context, jsonData, img, canvasElem)
{
    img.onload = function(){
        canvasElem.width = img.width;
        canvasElem.height = img.height;
        context.drawImage(img, 0, 0, canvasElem.width, canvasElem.height);
        var imgWidth = 2048;
        var imgHeight = 1024;
        var canvasWidth = 1296;
        var canvasHeight = 654;
        for(i = 0; i < Object.keys(jsonData.bbs).length; i++){
            var agent = Object.keys(jsonData.bbs)[i];
            var x = jsonData.bbs[agent].x1/imgWidth*canvasWidth;
            var y = jsonData.bbs[agent].y1/imgHeight*canvasHeight;
            var bBoxWidth = jsonData.bbs[agent].w/imgWidth*canvasWidth;
            var bBoxHeight = jsonData.bbs[agent].h/imgHeight*canvasHeight;
            context.strokeStyle = "red";
            context.linewidth = 5;
            context.strokeRect(x, y, bBoxWidth, bBoxHeight);
        }
    }
}

function loadAgents(jsonData){
    var agentsAccordion = document.getElementById("agentsAccordion");
    const classLabels = {
        0: "Ignore",
        1: "Pedestrian",
        2: "Rider",
        3: "Sitting person",
        4: "Person in unusual posture",
        5: "Group of people"
    };

    for(i = 0; i < Object.keys(jsonData.bbs).length; i++){
        var accordionItem = document.createElement("div");
        var accordionHeader = document.createElement("h2");
        var accordionButton = document.createElement("button");
        var collapsableElement = document.createElement("div");
        var accordionBody = document.createElement("div");
        var agentIndex = i+1;

        accordionItem.className = "accordion-item";

        accordionHeader.className = "accordion-header"
        accordionHeader.id = "heading" + agentIndex;
        
        accordionButton.className = "accordion-button collapsed";
        accordionButton.type = "button";
        accordionButton.innerText = "Agent " + agentIndex;

        collapsableElement.className = "accordion-collapse collapse";
        collapsableElement.id = "collapse" + agentIndex;

        var agent = Object.keys(jsonData.bbs)[i];
        var classLabelNumber = jsonData.bbs[agent].class_label;
        var classLabel = classLabels[classLabelNumber];

        accordionBody.className = "accordion-body";
        accordionBody.innerHTML = `<p class="mb-0">Current label<p>
        <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button"><span class="font-weight-bold">` + classLabel + `</span></button>
        <p class="mb-0">Age</p> 
        <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button"><span class="font-weight-bold">Adult</span></button>
        <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button"><span class="font-weight-bold">Kid</span></button>
        <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button"><span class="font-weight-bold">Unknown</span></button>
        <p class="mb-0 mt-1">Sex</p>
        <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button"><span class="font-weight-bold">Male</span></button>
        <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button"><span class="font-weight-bold">Female</span></button>
        <button type="button" class="btn btn-primary rounded-pill btn-sm" data-bs-toggle="button"><span class="font-weight-bold">Unknown</span></button>`

        accordionHeader.appendChild(accordionButton);
        collapsableElement.appendChild(accordionBody);
        accordionItem.appendChild(accordionHeader);
        accordionItem.appendChild(collapsableElement);
        agentsAccordion.appendChild(accordionItem);
    }
}

function getAgentToDeploy(jsonData, relX, relY){
    var agentToDeploy = 0;
    var canvasWidth = $('#imgToAnnotate').width();
    var canvasHeight = $('#imgToAnnotate').height();
    const imgOriginalWidth = 2048;
    const imgOriginalHeight = 1024;
    var percentageOfReductionWidth = canvasWidth/imgOriginalWidth;
    var percentageOfReductionHeight = canvasHeight/imgOriginalHeight;
    for(i = 0; i < Object.keys(jsonData.bbs).length; i++){
        var agent = Object.keys(jsonData.bbs)[i];
        var x = jsonData.bbs[agent].x1;
        var y = jsonData.bbs[agent].y1;
        var bBoxWidth = jsonData.bbs[agent].w;
        var bBoxHeight = jsonData.bbs[agent].h;
        var xCoordBottomRight = x + bBoxWidth;
        var yCoordBottomRight = y + bBoxHeight;

        //Check if click has been inside a bounding box
        if(relX > x*percentageOfReductionWidth && relX < xCoordBottomRight*percentageOfReductionWidth && 
            relY > y*percentageOfReductionHeight && relY < yCoordBottomRight*percentageOfReductionHeight){
                agentToDeploy = i + 1;
                break;
        }
    }

    return agentToDeploy;
}

function saveCurrent(){
    /*
    Update json with new annotations
     */
}

function loadData(){
    /*
    refresh page with new image index
    */
}

function getImagesList(){
    var folder = "../img/train/strasbourg/";
    var imagesList = [];
    var pageData = "";

    $.ajax({
        url : folder,
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

$(document).ready(function() {
    listOfFiles = getImagesList();
    currentImageIndex = Math.floor(Math.random() * (listOfFiles.length - 0)) + 0;
    var jsonData = loadJSONData(listOfFiles);  
    img = new Image();
    img.src = '../img/train/strasbourg/' + listOfFiles[currentImageIndex];
    img.width = $("#canvasContainer").width();
    img.height = $("#canvasContainer").height();
    var canvasElem = document.getElementById('imgToAnnotate');
    var zoom = document.getElementById("zoomed-canvas");
    var zoomCtx = zoom.getContext("2d");
    loadCanvas(jsonData, img, canvasElem);
    loadAgents(jsonData);
    $('#canvasContainer').mousemove(function(e){
        displayMagnifyingGlass(this, e, canvasElem, zoom, zoomCtx);
    });
    $('#imgToannotate').mouseout(function(){
        zoom.style.display = "none";
    });
    $("#imgToAnnotate").click(function(event){            
        var relX = event.pageX - $(this).offset().left;
        var relY = event.pageY - $(this).offset().top;
        var agentNumber = getAgentToDeploy(jsonData, relX, relY);
        var collapsableElement = "collapse" + agentNumber;

        collapseAllButThis(collapsableElement);
        toggleAccordionItem(collapsableElement);
    });
});
