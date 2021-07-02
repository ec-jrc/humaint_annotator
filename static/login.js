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
  var autenticationIsValid = false;

  await fetch('/user_credentials/' + userEmail + '/' + userPwd)
    .then(function (response) {
          if(response.ok){
            alert("Autentication is valid!");
          }
          else{
            alert("Autentication is not valid!");
          }
        })
}