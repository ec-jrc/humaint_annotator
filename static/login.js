$(document).ready(function() {
  var emailCorrect = false;
  $('#person-email').on('keyup change', function() {
    var email = $('#person-email').val();
    emailCorrect = emailIsValid(email);
  });
  
  $('.input-group input[required], .input-group textarea[required], .input-group select[required]').trigger('change');
  
  
});

function emailIsValid (email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function displayEmailVerificationIcon(iconType){
  if(iconType == 'ok'){
    $('#emailCheckIcon').removeClass('hidden');
    $('#emailCheckIcon').removeClass('glyphicon-remove');
    $('#emailCheckIcon').addClass('glyphicon-ok')
  }
  else{
    $('#emailCheckIcon').removeClass('hidden');
    $('#emailCheckIcon').removeClass('glyphicon-ok');
    $('#emailCheckIcon').addClass('glyphicon-remove')
  }
}

async function loginUser(){
  var userEmail = document.getElementById('userEmail').value;
  var userPwd = document.getElementById('userPwd').value;
  var currentPage = window.location.href;
  var rememberUser = document.getElementById('rememberUser').checked;

  await fetch('/user_credentials/' + userEmail + '/' + userPwd + '/' + rememberUser)
    .then(function (response) {
          if(response.ok){
            if(currentPage.indexOf("annotation.html") != -1){
              window.location = "annotation.html";
            }
            else{
              window.location = "index.html";
            }
          }
          else{
            alert("Login credentials are incorrect, please try again")
          }
        })
}