const socket = io('ws://localhost:8080');

socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('allChatRoomMessages');
});

socket.on('data', data => {
    const parsedData = JSON.parse(data);
    htmlChatAppend(parsedData)
});

socket.on('allChatRoomMessages', messages=>{
    messages.forEach(message =>{
        htmlChatAppend(message)
    })
})

document.querySelector('.post-message').onclick = () => {
    const text = document.querySelector('.message-input').value;
    if (text === "") {
        alert("Please enter a message before posting.");
        return;
    }
    socket.emit('data', JSON.stringify({uname: username, userMessage: text, dateAndTime: getDateAndTime(), timeStamp:Date.now()}));
    document.querySelector('.message-input').value = '';
};

document.querySelector('.logout-chat').onclick = async () => {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        if (response.ok) {
            //redirect to login page if logout is successful
            window.location.href = '/login';
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
};

//get the date and time in mm.dd.yyyy hh:mm(pm/am) format
const getDateAndTime = function () {
    const currentDate = new Date();
    const hours = currentDate.getHours();
    let twelveHoursFormat = hours % 12 ? hours % 12 : 12;
    twelveHoursFormat = twelveHoursFormat.toString().length > 1 ? twelveHoursFormat : "0" + twelveHoursFormat.toString()
    const date = currentDate.getDate().toString().length > 1 ? currentDate.getDate() : "0" + currentDate.getDate()
    const minutes = currentDate.getMinutes().toString().length > 1 ? currentDate.getMinutes() : "0" + currentDate.getMinutes()
    const month = (currentDate.getMonth() + 1).toString().length > 1 ? (currentDate.getMonth() + 1) : "0" + (currentDate.getMonth() + 1)
    return `${month}.${date}.${currentDate.getFullYear()} ${twelveHoursFormat}:${minutes}${hours >= 12 ? 'PM' : 'AM'}`;
}

//adds the messages in a div element & append it to the ejs structure
function htmlChatAppend(parsedData){
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    const nameDiv = document.createElement('div');
    nameDiv.classList.add('name');
    nameDiv.innerText = parsedData.uname === username ? "Me" : parsedData.uname;

    const timeDiv = document.createElement('div')
    timeDiv.classList.add('dateAndTime');
    timeDiv.innerText = parsedData.dateAndTime;

    const textDiv = document.createElement('div');
    textDiv.classList.add('text');
    textDiv.innerText = parsedData.userMessage;

    const nameAndTimeDiv = document.createElement('div');
    nameAndTimeDiv.classList.add('nameAndTime');
    nameAndTimeDiv.appendChild(nameDiv);
    nameAndTimeDiv.appendChild(timeDiv);
    messageDiv.appendChild(nameAndTimeDiv);
    messageDiv.appendChild(textDiv);

    document.querySelector('.all-messages').appendChild(messageDiv);
}