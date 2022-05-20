window.onload = function() {
  loadIAStats();
};

async function loadIAStats(){
    var jsonObj = {};

    await fetch('/ia_stats_json')//request for JSON data to flask server
        .then(function (response) {
            return response.json();
            }).then(function (elem) {
                  parseAndDisplayData(elem);
            });
}

function parseAndDisplayData(jsonData){
    document.getElementById('cp_p_train').innerText = jsonData["citypersons_p_train"];
    document.getElementById('cp_p_val').innerText = jsonData["citypersons_p_val"];
    document.getElementById('ecp_p_train_day').innerText = jsonData["eurocity_p_train_day"];
    document.getElementById('ecp_p_val_day').innerText = jsonData["eurocity_p_val_day"];
    document.getElementById('ecp_p_train_night').innerText = jsonData["eurocity_p_train_night"];
    document.getElementById('ecp_p_val_night').innerText = jsonData["eurocity_p_val_night"];
    document.getElementById('nuscenes_p_train').innerText = jsonData["nuscenes_p_train"];
    document.getElementById('nuscenes_p_val').innerText = jsonData["nuscenes_p_val"];
    document.getElementById('td_p_train').innerText = jsonData["td_p_train"];
    document.getElementById('td_p_val').innerText = jsonData["td_p_val"];
    document.getElementById('td_p_test').innerText = jsonData["td_p_test"];
    document.getElementById('kitti_p_train').innerText = jsonData["kitti_p_train"];
    document.getElementById('bdd100k_p_train').innerText = jsonData["bdd100k_p_train"];
    document.getElementById('bdd100k_p_val').innerText = jsonData["bdd100k_p_val"];
    document.getElementById('nuscenes_v_train').innerText = jsonData["nuscenes_v_train"];
    document.getElementById('nuscenes_v_val').innerText = jsonData["nuscenes_v_val"];
    document.getElementById('kitti_v_train').innerText = jsonData["kitti_v_train"];
    document.getElementById('bdd100k_v_train').innerText = jsonData["bdd100k_v_train"];
    document.getElementById('bdd100k_v_val').innerText = jsonData["bdd100k_v_val"];
}