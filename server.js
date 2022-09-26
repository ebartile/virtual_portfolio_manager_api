const app       = require("./routes/router");
const http      = require("http");
const mongoose  = require("mongoose");


// MongoDB connection

mongoose.connect("mongodb+srv://ebartile:mgz19gbL9e1Tka8l@cluster0.jeurjcs.mongodb.net/?retryWrites=true&w=majority",
{ useNewUrlParser: true,
  useCreateIndex:true,
  useFindAndModify:false,
  useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.log("Error connecting to Vpm Database",err.message);
});



// Server setup

const server = http.createServer(app);

server.listen(process.env.SERVERPORT, process.env.SERVERURL, () => {
  console.log("Vpm server started on port " + process.env.SERVERPORT);
});
