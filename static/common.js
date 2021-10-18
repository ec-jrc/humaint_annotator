async function getAnnotationPercentages(){
    var percentagesDict = {}
    await fetch('/get_annotation_percentages')//Request to flask server to retrieve a random image from storage
    .then(function (response) {
        return response.json();
        }).then(function (elem) {
            percentagesDict = elem
        });
    
        return percentagesDict 
}