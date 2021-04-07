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

function coordPercentages(x, y){
    this.X = x/$('#imgToAnnotate').width()*100;
    this.Y = y/$('#imgToAnnotate').height()*100;
}

function loadJSONData(){
    const JSONPath = "../annotations_json/anno_train/strasbourg_000000_004383_leftImg8bit_annotation.json";
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
    var canvas = document.getElementById('imgToAnnotate'),
    context = canvas.getContext('2d');

    make_base(context, jsonData, img, canvasElem);
}

function make_base(context, jsonData, img, canvasElem)
{
    img.onload = function(){
        canvasElem.width = img.width;
        canvasElem.height = img.height;
        context.drawImage(img, 0, 0, canvasElem.width, canvasElem.height);

        for(i = 0; i < Object.keys(jsonData.bbs).length; i++){
            var agent = Object.keys(jsonData.bbs)[i];
            var x = jsonData.bbs[agent].x1;
            var y = jsonData.bbs[agent].y1;
            var bBoxWidth = jsonData.bbs[agent].w;
            var bBoxHeight = jsonData.bbs[agent].h;
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
        /*accordionButton.data-bs-toggle = "collapse";
        accordionButton.data-bs-target = "#collapse" + agentIndex;
        accordionButton.aria-expanded = "false";
        accordionButton.aria-controls = "collapse" + agentIndex;*/

        collapsableElement.className = "accordion-collapse collapse";
        collapsableElement.id = "collapse" + agentIndex;
        /*collapsableElement.aria-labelledby = "heading" + agentIndex;
        collapsableElement.data-bs-parent = "#agentsAccordion"*/

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

        if(relX > x*percentageOfReductionWidth && relX < xCoordBottomRight*percentageOfReductionWidth && 
            relY > y*percentageOfReductionHeight && relY < yCoordBottomRight*percentageOfReductionHeight){
                agentToDeploy = i + 1;
                break;
        }
    }

    return agentToDeploy;
}

$(document).ready(function() {
    var jsonData = loadJSONData();  
    img = new Image();
    img.src = '../img/train/strasbourg/strasbourg_000000_004383_leftImg8bit.png';
    var canvasElem = document.getElementById('imgToAnnotate');
    var zoom = document.getElementById("zoomed-canvas");
    var zoomCtx = zoom.getContext("2d");
    loadCanvas(jsonData, img, canvasElem);
    loadAgents(jsonData);
   /* $('#canvasContainer').mousemove(function(e){
        var cursorX = e.pageX - $(this).offset().left;
        var cursorY = e.pageY - $(this).offset().top;
        var zoomFactor = 2;
        var bw = 3;
        var w = zoom.offsetWidth / 2;
        var h = zoom.offsetHeight / 2;
        zoomCtx.fillStyle = "transparent";
        zoomCtx.fillRect(0,0, zoom.width, zoom.height);
        //zoomCtx.drawImage(canvasElem, cursorX, cursorY, canvasElem.width, canvasElem.height, 0, 0, zoomFactor*canvasElem.width, zoomFactor*canvasElem.height);
        zoom.style.backgroundRepeat = "no-repeat";
        //zoom.style.backgroundSize = (canvasElem.width * zoomFactor) + "px " + (canvasElem.height * zoomFactor) + "px";
        zoom.style.top = cursorY - h + "px";
        zoom.style.left = cursorX - w + "px";
        zoom.style.display = "block";
        //zoom.style.backgroundPosition = "-" + ((cursorX * zoomFactor) - w + bw) + "px -" + ((cursorY * zoomFactor) - h + bw) + "px";
    });*/
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
