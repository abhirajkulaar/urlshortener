const serverURL = "http://localhost:5000/"
//const serverURL = "https://password-reset1.herokuapp.com/"
function DangerAlert(text){

    document.querySelector(".alert-danger").classList.remove("d-none")
    document.querySelector(".alert-danger").innerText=text
    setTimeout(()=> document.querySelector(".alert").classList.add("d-none"),1500)
}


document.getElementById("signUpForm").addEventListener("submit",async (e)=>{
    e.preventDefault()

    body={
        usermail:e.target.usermail.value,
        firstName:e.target.firstName.value,
        lastName:e.target.lastName.value,
        password:e.target.password.value
    }
    document.getElementById("spinner").classList.remove('d-none')
const req = await fetch("/register",{method:"POST",headers: {
    'Content-Type': 'application/json'
    // 'Content-Type': 'application/x-www-form-urlencoded',
  },body:JSON.stringify(body)})




document.getElementById("spinner").classList.add('d-none')
if(req.status==200){document.getElementById("confirmMessage").classList.remove("d-none")
document.getElementById("signUpForm").classList.add("d-none")
}
else{
const json = await req.json();
DangerAlert(json.reason) 


}


})