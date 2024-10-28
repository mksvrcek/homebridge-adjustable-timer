"use strict";

var Service, Characteristic, HomebridgeAPI;
const { HomebridgeDummyVersion } = require('./package.json');

module.exports = function (homebridge) {

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  HomebridgeAPI = homebridge;
  homebridge.registerAccessory("homebridge-dummy-timer-custom-45n3u54u134n5iun", "DummyTimer", DummyTimer);
}


function DummyTimer(log, config) {
  this.log = log;
  this.name = config.name;
  this.dimmer = true;
  this.isTimer = true;
  this.delay = 60000;
  this.delayUnit = config.delayUnit;
  this.defBrightness = config.brightness;
  this.brightness = config.brightness;
  this.brightnessStorageKey = this.name + "Brightness";
  this.timer = null;
  this.disableLogging = config.disableLogging;

  this.sensor = config.sensor;
  this.sensorTriggered = 0;

  this.delay = (() => {
    switch(this.delayUnit) {
      case "s": return 1000
      case "m": return 60000
      case "h": return 3600000
      case "d": return 86400000
      default: return 60000;
    }
  })();

  if (this.dimmer) {
    this._service = new Service.Lightbulb(this.name);
    this.modelString = "Dummy Timer";
  }

  this.informationService = new Service.AccessoryInformation();
  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, 'Homebridge')
    .setCharacteristic(Characteristic.Model, this.modelString)
    .setCharacteristic(Characteristic.FirmwareRevision, HomebridgeDummyVersion)
    .setCharacteristic(Characteristic.SerialNumber, 'Dummy-Timer-' + this.name.replace(/\s/g, '-'));

  this.cacheDirectory = HomebridgeAPI.user.persistPath();
  this.storage = require('node-persist');
  this.storage.initSync({ dir: this.cacheDirectory, forgiveParseErrors: true });

  this._service.getCharacteristic(Characteristic.On)
    .on('set', this._setOn.bind(this));
  if (this.dimmer) {
    this._service.getCharacteristic(Characteristic.Brightness)
      .on('get', this._getBrightness.bind(this))
      .on('set', this._setBrightness.bind(this));
  }

  if (this.dimmer) {
    var cachedBrightness = this.storage.getItemSync(this.brightnessStorageKey);
    if ((cachedBrightness == undefined) || cachedBrightness == 0) {
      this._service.setCharacteristic(Characteristic.On, false);
      this._service.setCharacteristic(Characteristic.Brightness, 0);
    } else {
      this._service.setCharacteristic(Characteristic.On, true);
      this._service.setCharacteristic(Characteristic.Brightness, cachedBrightness);
    }
  }

  this.getSensorState = () => {
		const state = this.sensorTriggered
		// if (this.flipSensor && this.sensorType === 'motion')
		// 	return !state
		if (this.sensor === 'motion')
			return !!state
		// if (this.flipSensor)
		// 	return state ^ 1
		return state
	}
}

DummyTimer.prototype.getServices = function () {
  var services = [this.informationService, this._service];

  if (this.sensor != "off") {
    switch (this.sensor) {
      case 'contact':
        this.sensorService = new Service.ContactSensor(this.name + ' Trigger')
        this.sensorCharacteristic = Characteristic.ContactSensorState
        break
      case 'occupancy':
        this.sensorService = new Service.OccupancySensor(this.name + ' Trigger')
        this.sensorCharacteristic = Characteristic.OccupancyDetected
        break
      case 'leak':
        this.sensorService = new Service.LeakSensor(this.name + ' Trigger')
        this.sensorCharacteristic = Characteristic.LeakDetected
        break
      default:
        this.sensorService = new Service.MotionSensor(this.name + ' Trigger')
        this.sensorCharacteristic = Characteristic.MotionDetected
        break
      }
  
      this.sensorService
        .getCharacteristic(this.sensorCharacteristic)
        .on('get', (callback) => {
          callback(null, this.getSensorState())
        })
  
      services.push(this.sensorService)
  }

  return services;
}

DummyTimer.prototype._getBrightness = function (callback) {

  if (!this.disableLogging) {
    this.log("Getting " + "brightness: " + this.brightness);
  }

  callback(null, this.brightness);
}

DummyTimer.prototype._setBrightness = function (brightness, callback) {

  if (!this.disableLogging) {
    var msg = "Setting brightness: " + brightness
    this.log(msg);
  }

  this.brightness = brightness;
  this.storage.setItemSync(this.brightnessStorageKey, brightness);

  callback();
}

DummyTimer.prototype._setOn = function (on, callback) {

  var msg = "Setting switch to " + on
  if (!this.disableLogging) {
    this.log(msg);
  }

  if (this.isTimer) {
    if (on) {
      this._service.setCharacteristic(Characteristic.Brightness, this.defBrightness);
      this.brightness = this.defBrightness

      this.timer = setInterval(function () {
        if (this.brightness > 1) {
          this.brightness = this.brightness - 1
          this._service.setCharacteristic(Characteristic.Brightness, this.brightness);
        } else {
          clearInterval(this.timer);
          this._service.setCharacteristic(Characteristic.On, false);

          if (this.sensor != "off") {
            this.sensorTriggered = 1
            this.sensorService.getCharacteristic(this.sensorCharacteristic).updateValue(this.getSensorState())
            this.log.easyDebug('Triggering Sensor')
            setTimeout(function () {
              this.sensorTriggered = 0
              this.sensorService.getCharacteristic(this.sensorCharacteristic).updateValue(this.getSensorState())
            }.bind(this), 3000)
          }
        }
      }.bind(this), this.delay)
    } else {
      clearInterval(this.timer);
    }
  }

  callback();
}
