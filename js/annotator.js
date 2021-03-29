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

function coordPercentages(x, y){
    this.X = x/$('#imgToAnnotate').width()*100;
    this.Y = y/$('#imgToAnnotate').height()*100;
}

$(document).ready(function() {
    $("#imgToAnnotate").click(function(event){            
        var relX = event.pageX - $(this).offset().left;
        var relY = event.pageY - $(this).offset().top;
        
        /*
        * For test purposes, those value are hardcoded for current hardcoded img.
        */
        var minXOne = 28.75;
        var maxXOne = 38.46;
        var minYOne = 37.36;
        var maxYOne = 74.45;
        var minXTwo = 62.82;
        var maxXTwo = 73.26;
        var minYTwo = 38.74;
        var maxYTwo = 77.75;
        
        var clickedPointInPercentages = new coordPercentages(relX, relY);
        
        if(clickedPointInPercentages.X > minXOne && clickedPointInPercentages.X < maxXOne && 
            clickedPointInPercentages.Y > minYOne && clickedPointInPercentages.Y < maxYOne){
            toggleAccordionItem('collapseOne');
        }
        else if(clickedPointInPercentages.X > minXTwo && clickedPointInPercentages.X < maxXTwo && 
            clickedPointInPercentages.Y > minYTwo && clickedPointInPercentages.Y < maxYTwo){
            toggleAccordionItem('collapseTwo');
        }
    });
});