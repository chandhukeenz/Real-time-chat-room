//imports & initialisations
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const userSession = require('express-session');
const path = require('path');
const unamePwd = require('./models/unamePwd');
const server = require('http').createServer(app);
const socketIO = require('socket.io');
const flash = require('connect-flash');
const io = socketIO(server, {
    cors: {origin: "*"}
});
const {v4: uuidv4} = require('uuid');
const chatMessage = require('./models/chatroomMessage');

//connections
server.listen(8080, () => console.log('listening on http://localhost:8080'));
mongoose.connect('mongodb://localhost:27017/fseChatroom').then(() => {
    console.log("mongodb connection is successful")
}).catch(err => {
    console.log("error in mongodb connection, err: ", err)
})
io.on('connection', socket => {
    socket.on('data', async (data) => {
        const parsedData = JSON.parse(data);
        const chatroomMessage = new chatMessage({
            uname: parsedData.uname,
            userMessage: parsedData.userMessage,
            dateAndTime: parsedData.dateAndTime,
            timeStamp: parsedData.timeStamp
        });
        await chatroomMessage.save().catch(err => console.error('Error saving the chatroom message:', err));
        io.emit('data', `${data}`)
    });
    socket.on('allChatRoomMessages', async ()=>{
        const messages = await chatMessage.find().sort({ timeStamp: 1 }).exec();
        console.log("from server:",messages)
        socket.emit('allChatRoomMessages', messages);
    });
});

//configurations
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());
app.use(userSession({secret: 'secret', resave: false, saveUninitialized: true, cookie: {secure: false}}))
//parses the incoming url encoded req data into structure
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

//middleware functions
const checkIfLoggedIn = (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('index')
    }
    next();
}

//handling post calls
app.post('/register', async (req, res) => {
    const {uname, pwd} = req.body;
    const registeredUser = await unamePwd.validateExistingUser(uname);
    console.log("registered user", registeredUser)
    if (registeredUser) {
        req.flash('error', 'Your username already exists!!')
        return res.redirect('index');
    }
    const hashedPwd = await bcrypt.hash(pwd, 12);
    console.log('hashedpwd: ', hashedPwd)
    const user = new unamePwd({uname: uname, pwd: hashedPwd})
    await user.save().catch(err => {
        console.log('Error saving user:', err.message);
        res.status(500).send('Internal Server Error');
    });
    console.log('User saved successfully:', user);
    req.session.user_id = uuidv4();
    req.session.uname = uname;
    res.redirect('chatroom')
})
app.post('/login', async (req, res) => {
    const {uname, pwd} = req.body;
    try {
        const registeredUser = await unamePwd.validateRegisteredUser(uname, pwd);
        console.log("registeredUser ", registeredUser)
        req.session.user_id = uuidv4();
        req.session.uname = uname;
        if (registeredUser) {
            return res.redirect('chatroom');
        } else {
            req.flash('error', 'Your username or password is incorrect!');
            return res.redirect('index')
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
    }
})
app.post('/logout', async (req, res) => {
    req.session.user_id = null;
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('index');
    });
})

//handling get calls
app.get('/index', async (req, res) => {
    res.render('index', {flashMessage: req.flash('error')})
})
app.get('/chatroom', checkIfLoggedIn, async (req, res) => {
    const uname = req.session.uname;
    console.log(uname)
    res.render('chatroom', {uname: uname})
})
app.get('*', async (req, res) => {
    res.render('index', {flashMessage: req.flash('error')})
})