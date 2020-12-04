async function main(){
    document.getElementById("userDataList").innerHTML=""
    const userData = await fetch("/userDetails")
    debugger
    const userDataJson = await userData.json()
    if(userData.status!=200){ window.location.href="/logout"}

    

    
    document.getElementById("userName").innerText=userDataJson.usermail

    for(let i=0;i<userDataJson.data.length;i++)
    {
        let tr=document.createElement("tr");
        tr.innerHTML='            <th >'+(i+1)+'</th><td>'+userDataJson.domain+'/'+userDataJson.data[i].shortURL+'</td><td>'+userDataJson.data[i].longURL+'</td><td>'+userDataJson.data[i].hits+'</td>'



        document.getElementById("userDataList").appendChild(tr)
    }

}


function DangerAlert(text){

    document.querySelector(".alert-danger").classList.remove("d-none")
    document.querySelector(".alert-danger").innerText=text
    setTimeout(()=> document.querySelector(".alert-danger").classList.add("d-none"),1500)
}
function SuccessAlert(text){

    document.querySelector(".alert-success").classList.remove("d-none")
    document.querySelector(".alert-success").innerText=text
    setTimeout(()=> document.querySelector(".alert-success").classList.add("d-none"),1500)
}



main()


document.getElementById("newURLform").addEventListener("submit",async(e)=>{
    e.preventDefault()

    let body={
        shortURL:e.target.shortURL.value,
        longURL:e.target.longURL.value
    }

    document.getElementById("spinner").classList.remove('d-none')
    let req = await fetch("/addNewURL",{method:"POST",headers:{
    'Content-Type': 'application/json'

},body:JSON.stringify(body)})
document.getElementById("spinner").classList.add('d-none')
if(req.status==200){SuccessAlert("Successfully Added!");$('#exampleModal').modal('hide');main();return;}

let reqJson=await req.json();
DangerAlert(reqJson.reason)


})