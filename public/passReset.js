function DangerAlert(text){

  document.querySelector(".alert-danger").classList.remove("d-none")
  document.querySelector(".alert-danger").innerText=text
  setTimeout(()=> document.querySelector(".alert").classList.add("d-none"),1500)
}

document.getElementById("sendRequestForm").addEventListener("submit",async e=>{

    e.preventDefault()

    body={
        usermail:e.target.usermail.value,
        
    }
    document.getElementById("spinner1").classList.remove('d-none')
const req = await fetch("/forgotPasswordRequest",{method:"POST",headers: {
    'Content-Type': 'application/json'
    // 'Content-Type': 'application/x-www-form-urlencoded',
  },body:JSON.stringify(body)})
  document.getElementById("spinner1").classList.add('d-none')




if(req.status==200){
   e.target.classList.add("d-none")
    document.getElementById("changePassform").classList.remove("d-none")
    document.getElementById("resetMail").value=e.target.usermail.value
}
else{
const json = await req.json();
alert(json.reason) 


}



})

document.getElementById("changePassform").addEventListener("submit",async e=>{

    e.preventDefault()

    body={
        usermail:e.target.usermail.value,
        password:e.target.password.value,
        resetCode:e.target.resetCode.value
    }
    document.getElementById("spinner").classList.remove('d-none')
const req = await fetch("/forgotPasswordReset",{method:"POST",headers: {
    'Content-Type': 'application/json'
    // 'Content-Type': 'application/x-www-form-urlencoded',
  },body:JSON.stringify(body)})


  document.getElementById("spinner").classList.add('d-none')


if(req.status==200){
    alert("Password Reset! Pls login")
  window.location.href="/login"
}
else{
const json = await req.json();
DangerAlert(json.reason) 


}



})