var method = omegaGarage.prototype;
var GPIOHelper = require('./gpiohelper');
var https = require('https');

relaysStates = [0, 0];
config = {};
garageDoorsLength = 0;
myGPIO = new GPIOHelper();

function omegaGarage() {

}

omegaGarage.prototype.init = function()
{
  try
  {
    loadConfigFile();

    garageDoorsLength = config.garageDoors.length;

    for(var i = 0; i < garageDoorsLength; i++)
    {
      console.log("Creating relay for " + config.garageDoors[i].garageName + " garage on pin: " + config.garageDoors[i].relayPin);
      myGPIO.setPinSync(config.garageDoors[i].relayPin, 0);

      console.log("Creating sensor input for " + config.garageDoors[i].garageName + " garage on pin: " + config.garageDoors[i].sensorPin);
      myGPIO.setPinSync(config.garageDoors[i].sensorPin);
    }

    setInterval(beginStateUpdates, 5000);
  }
  catch(e)
  {
    console.log("Error initializing: " + e);
  }
};

omegaGarage.prototype.getGarageState = function(garageDoorIndex)
{
  try
  {
    var strResult = "";
    if(relaysStates[garageDoorIndex] == 0)
      strResult = "OPEN";
    else
      strResult = "CLOSED";

    console.log("The " + config.garageDoors[garageDoorIndex].garageName + " garage is " + strResult);
    return strResult;
  }
  catch(e)
  {
    console.log("Error getting garage state: " + e);
    return "OPEN";
  }
}

omegaGarage.prototype.changeGarageState = function(garageDoorIndex)
{
  try
  {
    console.log("Changing the state of the " + config.garageDoors[garageDoorIndex].garageName + " garage.");

    this.setRelayState(garageDoorIndex, 1);

    var obj = this;
    setTimeout(function()
    {
      obj.setRelayState(garageDoorIndex, 0);
    }, 1000);

  }
  catch(e)
  {
    console.log("Error changing the garage state: " + e);
  }
};

omegaGarage.prototype.closePins = function()
{
  for(var i = 0; i < this.garageDoorsLength; i++)
  {
    console.log("Closing relay pin: " + config.garageDoors[i].relayPin);
    myGPIO.closepin(config.garageDoors[i].relayPin);

    console.log("Closing sensor pin: " + config.garageDoors[i].sensorPin);
    myGPIO.closepin(config.garageDoors[i].sensorPin);
  }
};

omegaGarage.prototype.setRelayState = function(garageDoorIndex, value)
{
  myGPIO.setPinSync(config.garageDoors[garageDoorIndex].relayPin, value);
}

omegaGarage.prototype.getAllGarageStates = function()
{
  var obj = [];

  for(var i = 0; i < garageDoorsLength; i++)
    obj.push(relaysStates[i]);

  return obj;
}

////////////////////////////////PRIVATE FUNCTIONS///////////////////////////////
function loadConfigFile()
{
  try
  {
    console.log("Loading configuration file...");
    var home = process.env.HOME;
    config = require('/root/config.json');
    console.log("Configuration file loaded..." + JSON.stringify(config));
  }
  catch (e)
  {
    console.log('Error loading the configuration file:', e);
    process.exit();
  }
};

function beginStateUpdates()
{
  for(var i = 0; i < garageDoorsLength; i++)
  {
    updateGarageState(i);
  }
}

function updateGarageState(garageDoorIndex)
{
  try
  {
    console.log("Updating garage door states");

    var result = myGPIO.getPinSync(config.garageDoors[garageDoorIndex].sensorPin);

    if(result != relaysStates[garageDoorIndex])//If the state of the garage has changed, then notify the user.
    {

      var humanResult = result == 0 ? "opened" : "closed";
      var doorName = config.garageDoors[garageDoorIndex].garageName

      if (config.webhook) {
        //just fire it and forget it
        https.get(config.webhook + '?value1=' + doorName + '&value2=' + humanResult, null);
      }
    }

    relaysStates[garageDoorIndex] = result;
  }
  catch(e)
  {
    console.log("Error getting garage state: " + e);
  }
}
module.exports = new omegaGarage();