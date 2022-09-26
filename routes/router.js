const express       =   require('express');
const app           =   express();
const cors          =   require("cors");
const path          =   require('path');
const moment        =   require('moment-timezone');


const VpmToken   =   require('./blockchain/VpmToken');
const Businesses             =   require('./blockchain/Businesses');
const Auth              =   require('./auth/UserAuth');
const Vpm        =   require('./vpm/Vpm');
const Collab            =   require('./vpm/Collab');

// Timezone setup

moment.tz.setDefault("Asia/Kolkata");


//EXPRESS PRESET

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(express.text({ limit: '200mb' }));


// EXPRESS STATIC FILE SERVER

// Media uploaded by the users
app.use('/media',express.static(path.join(__dirname,'../VpmMedia')))


// CORS PRESETS

app.use(cors());

app.use(express.static("docs"));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,PUT,OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});


// User auth

app.use('/api',Auth);


// Blockchain APIs

app.use('/api',VpmToken);


// Businesses APIs

app.use('/api',Businesses);


// Vpm APIs

app.use('/api',Vpm);


// Collab APIs

app.use('/api',Collab);



module.exports = app;